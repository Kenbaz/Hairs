from django.db import models
from django.utils.text import slugify
from currencies.utils import convert_price
from django.core.mail import send_mail
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import transaction
from decimal import Decimal
from django.core.files.storage import default_storage
import os
from django.core.exceptions import ValidationError
from django.core.files.images import get_image_dimensions


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
        """ Get price in specified currency """
        if currency_code == 'USD':
            return self.price
        return convert_price(self.price, 'USD', currency_code)
    

    def get_discount_price_in_currency(self, currency_code='USD'):
        """ Get discount price in specified currency """
        if not self.discount_price:
            return None
        if currency_code == 'USD':
            return self.discount_price
        return convert_price(self.discount_price, 'USD', currency_code)


    class Meta:
        ordering = ['-created_at']

    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
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
    image = models.ImageField(upload_to='products/', validators=[validate_image])
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
        # Store the image path before deletion
        image_path = self.image.path if self.image else None

        # Close any open file handlers
        if self.image:
            self.image.close()
        
        #Call parent class delete method
        super().delete(*args, **kwargs)

        # Delete the physical file after the model instance is deleted
        if image_path and os.path.isfile(image_path):
            try:
                default_storage.delete(image_path)
            except (OSError, PermissionError) as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error deleting file {image_path}: {str(e)}")



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