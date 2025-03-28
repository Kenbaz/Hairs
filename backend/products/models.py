# products/models.py

from django.db import models
from django.utils.text import slugify
from currencies.utils import CurrencyConverter
from django.core.mail import send_mail
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import transaction
from decimal import Decimal
from django.core.cache import cache
from django.core.files.storage import default_storage
from cloudinary_storage.storage import MediaCloudinaryStorage
from django.conf import settings
from utils.cloudinary_utils import CloudinaryUploader
import os
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.files.images import get_image_dimensions
import logging

logger = logging.getLogger(__name__)


class Category(models.Model):
    CATEGORY_CHOICES = [
         ('straight', 'Straight Hairs'),
        ('curly', 'Curly Hairs'),
        ('wavy', 'Wavy Hairs'),
        ('bouncy', 'Bouncy Hairs'),
        ('braiding', 'Braiding Extensions'),
        ('care', 'Hair Care Products'),
        ('tools', 'Styling Tools'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)


    class Meta:
        verbose_name_plural = 'Categories'


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


    def __str__(self):
        return self.name
    


class Product(models.Model):
    HAIR_TYPE_CHOICES = [
        ('raw', 'Raw hairs'),
        ('virgin', 'Virgin hairs'),
        ('single donor', 'Single donor hairs')
    ]

    HAIR_STYLE_CHOICES = [
        ('straight', 'Straight'),
        ('wavy', 'Wavy'),
        ('curly', 'Curly'),
        ('bouncy', 'Bouncy'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    description = models.TextField()
    hair_type = models.CharField(
        max_length=20,
        choices=HAIR_TYPE_CHOICES,
        blank=True,
        null=True,
        help_text='Only applicable for hair products, not tools or care products'
    )
    length = models.IntegerField(
        help_text='Length in inches',
        null=True,
        blank=True
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Price in USD (base currency)"
    )
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Discount price in USD (base currency)"
    )
    stock = models.IntegerField(default=0)
    care_instructions = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    low_stock_threshold = models.PositiveIntegerField(
        default=5,
        help_text="Notify when stock falls below this number"
    )
    last_stock_update = models.DateTimeField(auto_now=True)
    notify_low_stock = models.BooleanField(
        default=True,
        help_text="Send notification when stock falls below threshold"
    )


    def update_stock(self, quantity_changed, transaction_type, order=None, user=None, notes=''):
        """
            Update product stock and create history record

            Args:
                quantity_changed (int): Negative for reduction, positive for addition
                transaction_type (str): One of StockHistory.TRANSACTION_TYPES
                order (Order, optional): Related order if applicable
                user (User, optional): User making the change
                notes (str, optional): Additional notes
        """
        previous_stock = self.stock
        
        # Update stock
        self.stock += quantity_changed
        self.save()


        # Create stock history record
        StockHistory.objects.create(
            product = self,
            transaction_type=transaction_type,
            quantity_changed=quantity_changed,
            previous_stock=previous_stock,
            new_stock=self.stock,
            reference_order=order,
            notes=notes,
            created_by=user
        )

        # Check for low stock after reduction
        if quantity_changed < 0:
            self.check_low_stock()
    

    def check_low_stock(self):
        """ Check if stock is below threshold and send notification if needed """
        if self.notify_low_stock and self.stock <= self.low_stock_threshold:
            self.send_low_stock_notification()
    

    def send_low_stock_notification(self):
        """ Send low stock notification email """
        subject = f'Low Stock Alert: {self.name}'
        message = f"""
        Low stock alert for {self.name}

        Current stock: {self.stock}
        Threshold: {self.low_stock_threshold}

        Please restock this item soon.
        """
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_EMAIL],
            fail_silently=True
        )


    def get_price_in_currency(self, currency_code='USD'):
        """
            Get price in specified currency
            
            Args:
                currency_code: Target currency code
                
            Returns:
                Decimal: Converted price
                
            Raises:
                ValueError: If currency code is invalid
        """

        try:
            if currency_code == 'USD':
                return self.price
            
            # Try to get from cache first
            cache_key = f'product_price_{self.id}_{currency_code}'
            cached_price = cache.get(cache_key)
            if cached_price is not None:
                return cached_price
            
            # Convert price
            converted_price = CurrencyConverter.convert_price(
                amount=self.price,
                from_currency='USD',
                to_currency=currency_code,
                round_digits=2
            )

            # Cache the converted price
            cache.set(
                cache_key,
                converted_price,
                timeout=settings.CACHE_TIMEOUTS['PRODUCT']
            )

            return converted_price
        
        except ValueError as e:
            logger.error(f"Price conversion failed for product {self.id}: {str(e)}")
            return self.price
    

    def get_discount_price_in_currency(self, currency_code='USD'):
        """
            Get discount price in specified currency
            
            Args:
                currency_code: Target currency code
                
            Returns:
                Optional[Decimal]: Converted discount price or None if no discount
        """

        if not self.discount_price:
            return None
        
        try:
            if currency_code == 'USD':
                return self.discount_price
            
            # Try to get from cache first
            cache_key = f'product_discount_price_{self.id}_{currency_code}'
            cached_price = cache.get(cache_key)
            if cached_price is not None:
                return cached_price
            
            # Convert discount_price
            converted_price = CurrencyConverter.convert_price(
                amount=self.discount_price,
                from_currency='USD',
                to_currency=currency_code,
                round_digits=2
            )

            # Cache the converted price
            cache.set(
                cache_key,
                converted_price,
                timeout=settings.CACHE_TIMEOUTS['PRODUCT']
            )

            return converted_price
        
        except ValueError as e:
            logger.error(f"Discount price conversion failed for product {self.id}: {str(e)}")
            return self.discount_price
    

    def format_price(self, currency_code='USD', include_symbol=True):
        """
            Get formatted price in specified currency
            
            Args:
                currency_code: Target currency code
                include_symbol: Include currency symbol in output
                
            Returns:
                str: Formatted price string
        """
        price = self.get_price_in_currency(currency_code)
        return CurrencyConverter.format_price(
            amount=price,
            currency_code=currency_code,
            include_symbol=include_symbol
        )
    

    def format_discount_price(self, currency_code='USD', include_symbol=True):
        """
            Get formatted discount price in specified currency
            
            Args:
                currency_code: Target currency code
                include_symbol: Include currency symbol in output
                
            Returns:
                Optional[str]: Formatted discount price string or None if no discount
        """
        discount_price = self.get_discount_price_in_currency(currency_code)
        if discount_price is None:
            return None
        return CurrencyConverter.format_price(
            amount=discount_price,
            currency_code=currency_code,
            include_symbol=include_symbol
        )
    

    def clear_price_cache(self):
        """ Clear cached prices when product is updated """
        active_currencies = CurrencyConverter.get_active_currencies()
        for currency in active_currencies:
            cache.delete(f'product_price_{self.id}_{currency}')
            cache.delete(f'product_discount_price_{self.id}_{currency}')

    class Meta:
        ordering = ['-created_at']

    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        # Clear price cache when product is updated
        if self.id:
            self.clear_price_cache()

        super().save(*args, **kwargs)


    def __str__(self):
        return self.name


def validate_image(image):
    """ Validate image file size and dimensions """
    # Check file size (max 5MB)
    if image.size > 5 * 1024 * 1024:
        raise ValidationError('Image file too large (greater than 5MB)')
    
    # Check dimensions
    width, height = get_image_dimensions(image)
    if width > 4096 or height > 4096:
        raise ValidationError("Image dimensions too large")



class ProductImage(models.Model): 
    product = models.ForeignKey(
        Product,
        related_name='images',
        on_delete=models.CASCADE
    )
    image = models.ImageField(
        storage=MediaCloudinaryStorage(),
        upload_to=settings.CLOUDINARY_STORAGE_FOLDERS['PRODUCT_IMAGES']
    )
    public_id = models.CharField(max_length=225, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering = ['-is_primary', '-created_at']
    

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product,
                is_primary=True
            ).update(is_primary=False)
        super().save(*args, **kwargs)
    

    def delete(self, *args, **kwargs):
        # Delete from Cloudinary
        if self.public_id:
            CloudinaryUploader.delete_file(self.public_id)
        super().delete(*args, **kwargs)



class StockHistory(models.Model):
    TRANSACTION_TYPES = [
        ('order', 'Order placed'),
        ('cancel', 'Order cancelled'),
        ('restock', 'Manual Restock'),
        ('adjustment', 'Stock Adjustment')
    ]

    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        related_name='Stock_history'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity_changed = models.IntegerField(
        help_text="Negative for stock reduction, positive for addition"
    )
    previous_stock = models.IntegerField()
    new_stock = models.IntegerField()
    reference_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def clean(self):
        super().clean()
        if self.previous_stock is None:
            raise ValidationError({'Previous_stock:' 'Previous stock value is required'})
        if self.new_stock is None:
            raise ValidationError({'new_stock:' 'New stock value is required'})

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Stock History Entry'
        verbose_name_plural = 'Stock History Entries'
    

    def __str__(self):
        return f"{self.product.name} - {self.transaction_type} ({self.quantity_changed})"


class FlashSale(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled')
    ]
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount')
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        default='percentage'
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    products = models.ManyToManyField(
        'Product',
        related_name='flash_sales',
        through='FlashSaleProduct'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled'
    )
    max_quantity_per_customer = models.PositiveIntegerField(
        default=1,
        help_text="Maximum quantity of each product per customer"
    )
    total_quantity_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Total quantity available for the flash sale"
    )
    is_visible = models.BooleanField(
        default=True,
        help_text="Whether the sale is visible to customers"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_flash_sales'
    )

    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['status', 'start_time', 'end_time'])
        ]

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    

    def clean(self):
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError('End time must be after start time')
            
            if self.start_time <= timezone.now() and self.status == 'scheduled':
                raise ValidationError('Start time must be in the future for scheduled sales')
    

    def update_status(self):
        now = timezone.now()

        if self.status == 'cancelled':
            return
        
        if now < self.start_time:
            new_status = 'scheduled'
        elif now >= self.start_time and now <= self.end_time:
            new_status = 'active'
        else:
            new_status = 'ended'
        
        if new_status != self.status:
            self.status = new_status
            self.save(update_fields=['status'])
    

    def calculate_discounted_price(self, original_price):
        if self.discount_type == 'percentage':
            discount_amount = (original_price * self.discount_value) / 100
        else:
            discount_amount = self.discount_value
        
        return max(original_price - discount_amount, Decimal('0.01'))


class FlashSaleProduct(models.Model):
    flash_sale = models.ForeignKey(
        FlashSale,
        on_delete=models.CASCADE,
        related_name='sale_products'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='sale_entries'
    )
    quantity_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum quantity available for this product in the sale"
    )
    quantity_sold = models.PositiveIntegerField(default=0)
    original_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Original price when added to sale'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['flash_sale', 'product']
        indexes = [
            models.Index(fields=['flash_sale', 'product'])
        ]
    
    def __str__(self):
        return f"{self.product.name} in {self.flash_sale.name}"
    

    def clean(self):
        if self.quantity_limit is not None:
            if self.quantity_limit <= 0:
                raise ValidationError('Quantity limit must be greater than zero')
            if self.quantity_sold > self.quantity_limit:
                raise ValidationError('Quantity sold cannot exceed quantity limit')


class FlashSalePurchase(models.Model):
    flash_sale = models.ForeignKey(
        FlashSale,
        on_delete=models.CASCADE,
        related_name='purchases'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    quantity = models.PositiveIntegerField()
    price_at_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['flash_sale', 'product', 'user'])
        ]

    def __str__(self):
        return f"{self.user.email} purchased {self.quantity}x {self.product.name} in {self.flash_sale.name}"
