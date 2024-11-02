from rest_framework import serializers
from .models import Cart, CartItem
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


    class Meta:
        model = Cart
        fields = [
            'id', 'items', 'total_amount',
            'created_at', 'updated_at'
        ]