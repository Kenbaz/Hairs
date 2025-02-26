# cart/serializers.py

from rest_framework import serializers
from .models import Cart, CartItem
from shipping.models import ShippingRate
from products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )


    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_id', 'quantity',
            'price_at_add', 'subtotal', 'created_at'
        ]
        read_only_fields = ['price_at_add']



class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    shipping_fee = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            'id', 'items', 'total_amount',
            'created_at', 'updated_at', 'shipping_fee'
        ]
    
    def get_shipping_fee(self, obj):
        # Default currency
        currency_code = 'USD'

        # Try to get currency from request
        request = self.context.get('request')
        if request:
            currency_code = request.query_params.get('currency', 'USD')

        # Get shipping rate for the currency
        try:
            shipping_rate = ShippingRate.objects.get(
                currency_code=currency_code,
                is_active=True
            )
            return shipping_rate.flat_rate
        except ShippingRate.DoesNotExist:
            return 0