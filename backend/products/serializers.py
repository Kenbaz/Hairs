# products/serializers.py
from rest_framework import serializers
from .models import Category, Product, ProductImage, StockHistory, FlashSaleProduct, FlashSale, FlashSalePurchase
from currencies.utils import CurrencyConverter
from django.conf import settings
import logging
from django.db import transaction

logger = logging.getLogger(__name__)


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'public_id', 'is_primary']
        read_only_fields = ['id']
    
    def get_url(self, obj):
        if obj.image:
            # Return the complete Cloudinary URL
            return f"https://res.cloudinary.com/{settings.CLOUDINARY_STORAGE['CLOUD_NAME']}/image/upload/{obj.public_id}"
        return None


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']
    
    def validate_name(self, value):
        """
        Check that the category name is unique
        """
        if (
            Category.objects.filter(name__iexact=value)
            .exclude(id=getattr(self.instance, 'id', None))
            .exists()
        ):
            raise serializers.ValidationError("A category with this name already exists.")
        return value



class ProductListSerializer(serializers.ModelSerializer):
    """ Serializer for listing products with minimal data """
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    price_data = serializers.SerializerMethodField()


    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'price_data', 'is_featured', 'primary_image'
        ]


    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ProductImageSerializer(primary_image).data
        return None
    

    def get_price_data(self, obj):
        request = self.context.get('request', None)
        currency = request.GET.get('currency', 'USD') if request else 'USD'
        
        try:
            currencies = CurrencyConverter.get_active_currencies()
            if currency not in currencies:
                currency = 'USD'
            
            # Get the currency info
            currency_info = currencies[currency]

            # Convert the price to the requested currency
            regular_price = CurrencyConverter.convert_price(
                amount=obj.price,
                from_currency='USD',
                to_currency=currency
            )

            # Handle discount price
            discount_price = None
            if obj.discount_price:
                discount_price = CurrencyConverter.convert_price(
                    amount=obj.discount_price,
                    from_currency='USD',
                    to_currency=currency
                )
            
            data = {
                'amount': regular_price,
                'currency': currency,
                'formatted': CurrencyConverter.format_price(
                    amount=regular_price,
                    currency_code=currency,
                    include_symbol=True
                ),
                'is_discounted': bool(discount_price),
                'discount_amount': discount_price,
                'discount_formatted': (
                    CurrencyConverter.format_price(
                        amount=discount_price,
                        currency_code=currency,
                        include_symbol=True
                    ) if discount_price else None
                ),
                'savings_percentage': None
            }

            # Calculate savings percentage if discounted
            if discount_price:
                savings = ((regular_price - discount_price) / regular_price) * 100
                data['savings_percentage'] = round(savings, 2)
            
            return data
        
        except ValueError as e:
            logger.error(f"Price conversion failed: {str(e)}")

        # Return USD prices as fallback
        return {
            'amount': obj.price,
            'currency': 'USD',
            'formatted': CurrencyConverter.format_price(obj.price, 'USD'),
            'is_discounted': bool(obj.discount_price),
            'discount_amount': obj.discount_price,
            'discount_formatted': (
                CurrencyConverter.format_price(
                    obj.discount_price, 'USD') if obj.discount_price else None,
            ),
            'savings_percentage': None
        }


class ProductDetailsSerializer(ProductListSerializer):
    """ Serializer for detailed product view """
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    price_data = serializers.SerializerMethodField()
    available_currencies = serializers.SerializerMethodField()
    


    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'description',
            'hair_type', 'length', 'price_data',
            'stock', 'care_instructions', 'is_featured',
            'is_available', 'images', 'created_at', 'updated_at', 'available_currencies'
        ]
    

    def get_available_currencies(self, obj):
        """ Get list of currencies with their symbols and rates """
        try:
            currencies = CurrencyConverter.get_active_currencies()
            available_currencies = []

            for currency_code, currency_info in currencies.items():
                available_currencies.append({
                    'code': currency_code,
                    'symbol': currency_info.symbol,
                    'name': currency_info.name,
                    # Convert Decimal to float for JSON serialization
                    'rate': float(currency_info.rate),
                    'example': CurrencyConverter.format_price(
                        amount=100,  # Example amount
                        currency_code=currency_code,
                        include_symbol=True
                    )
                })

            return available_currencies

        except Exception as e:
            logger.error(f"Failed to get available currencies: {str(e)}")
            # Return at least USD as fallback
            return [{
                'code': 'USD',
                'symbol': '$',
                'name': 'US Dollar',
                'rate': 1.0,
                'example': '$100.00'
            }]



class ProductPriceSerializer(serializers.Serializer):
    """ Serializer for product price in different currencies """
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    formatted = serializers.CharField()
    is_discounted = serializers.BooleanField()
    discount_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        allow_null=True
    )
    discount_formatted = serializers.CharField(allow_null=True)
    savings_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        allow_null=True
    )


class StockHistorySerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    product = serializers.StringRelatedField()
    reference_order = serializers.StringRelatedField()

    class Meta:
        model = StockHistory
        fields = [
            'id', 'product', 'transaction_type', 'quantity_changed',
            'previous_stock', 'new_stock', 'reference_order',
            'notes', 'created_at', 'created_by'
        ]
        read_only_fields = [
            'product', 'previous_stock', 'new_stock', 
            'created_at', 'created_by'
        ]


class FlashSaleProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    original_price = serializers.DecimalField(
        source='product.price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    discounted_price = serializers.SerializerMethodField()
    stock = serializers.IntegerField(source='product.stock', read_only=True)

    class Meta:
        model = FlashSaleProduct
        fields = [
            'id', 'product', 'product_name', 'original_price',
            'discounted_price', 'quantity_limit', 'quantity_sold',
            'stock', 'created_at'
        ]
        read_only_fields = ['quantity_sold']
    

    def get_discounted_price(self, obj):
        return obj.flash_sale.calculate_discounted_price(obj.product.price)
    

class FlashSaleSerializer(serializers.ModelSerializer):
    products = FlashSaleProductSerializer(
        source='sale_products',
        many=True,
        read_only=True
    )
    products_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    status = serializers.CharField(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = FlashSale
        fields = [
            'id', 'name', 'description', 'start_time', 'end_time',
            'discount_type', 'discount_value', 'status',
            'max_quantity_per_customer', 'total_quantity_limit',
            'is_visible', 'created_at', 'updated_at', 'created_by',
            'products', 'products_data'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at', 'created_by']
    

    def validate(self, data):
        # Validate time range
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        logger.info(f"Validating flash sale data: {data}")

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time.")
        
        # Validate discount value
        if data.get('discount_type') == 'percentage' and data.get('discount_value', 0) > 100:
            raise serializers.ValidationError("Discount percentage cannot be more than 100%.")
        
        return data
    

    def create(self, validated_data):
        """
        Create a flash sale with associated products
        """
        logger.info(f"Creating flash sale with validated data: {validated_data}")  # Add logging
        
        products_data = validated_data.pop('products_data', [])
        
        try:
            with transaction.atomic():
                flash_sale = FlashSale.objects.create(**validated_data)
                
                for product_data in products_data:
                    product_id = product_data.get('product')
                    quantity_limit = product_data.get('quantity_limit')
                    
                    if not product_id:
                        raise serializers.ValidationError({
                            'products_data': 'Product ID is required'
                        })
                        
                    FlashSaleProduct.objects.create(
                        flash_sale=flash_sale,
                        product_id=product_id,
                        quantity_limit=quantity_limit
                    )
                
                return flash_sale
                
        except Exception as e:
            logger.error(f"Error creating flash sale: {str(e)}", exc_info=True)
            raise serializers.ValidationError(f"Failed to create flash sale: {str(e)}")
    

    def update(self, instance, validated_data):
        products_data = validated_data.pop('products_data', None)

        # Update flash sale instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update products if provided
        if products_data is not None:
            # Remove existing products not in the update data
            current_product_ids = {d['product'] for d in products_data}
            instance.sale_products.exclude(
                product_id__in=current_product_ids
            ).delete()

            # Update or create products
            for product_data in products_data:
                product_id = product_data.pop('product')
                FlashSaleProduct.objects.update_or_create(
                    flash_sale=instance,
                    product_id=product_id,
                    defaults=product_data
                )

        return instance
