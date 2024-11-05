from rest_framework import serializers
from .models import Category, Product, ProductImage, StockHistory
from currencies.utils import get_active_currencies



class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary']



class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']



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
        request = self.context.get('request')
        currency = request.GET.get('currency', 'USD')
        currencies = get_active_currencies()

        if currency not in currencies:
            currency = 'USD'

        regular_price = obj.get_price_in_currency(currency)
        discount_price = obj.get_discount_price_in_currency(currency)
        symbol = currencies[currency]['symbol']

        data = {
            'amount': regular_price,
            'currency': currency,
            'formatted': f"{symbol}{regular_price}",
            'is_discounted': bool(discount_price),
            'discount_amount': discount_price,
            'discount_formatted': f"{symbol}{discount_price}" if discount_price else None,
            'saving_percentage': None
        }

        # Calculate savings percentage if discounted
        if discount_price:
            savings = ((regular_price - discount_price) / regular_price) * 100
            data['savings_percentage'] = round(savings, 2)

        return data
    


class ProductDetailsSerializer(serializers.ModelSerializer):
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
            'is_available', 'images', 'created_at', 'updated_at'
        ]
    


    def get_price_data(self, obj):
        request = self.context.get('request')
        currency = request.GET.get('currency', 'USD')
        currencies = get_active_currencies()
        
        if currency not in currencies:
            currency = 'USD'
            
        regular_price = obj.get_price_in_currency(currency)
        discount_price = obj.get_discount_price_in_currency(currency)
        symbol = currencies[currency]['symbol']
        
        data = {
            'amount': regular_price,
            'currency': currency,
            'formatted': f"{symbol}{regular_price}",
            'is_discounted': bool(discount_price),
            'discount_amount': discount_price,
            'discount_formatted': f"{symbol}{discount_price}" if discount_price else None,
            'savings_percentage': None
        }
        
        if discount_price:
            savings = ((regular_price - discount_price) / regular_price) * 100
            data['savings_percentage'] = round(savings, 2)
        
        return data
    


    def get_available_currencies(self, obj):
        """ Get list of currencies with thier symbols """
        currencies = get_active_currencies()
        return [
            {
                'code': code,
                'symbol': data['symbol'],
                'name': data['name']
            }
            for code, data in currencies.items()
        ]



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