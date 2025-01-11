# products/serializers.py
from rest_framework import serializers
from .models import Category, Product, ProductImage, StockHistory
from currencies.utils import CurrencyConverter
from django.conf import settings
import logging

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