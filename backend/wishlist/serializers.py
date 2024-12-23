# wishlist/serializers.py

from rest_framework import serializers
from .models import Wishlist, WishlistItem
from products.serializers import ProductListSerializer
from products.models import Product


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'added_at']
        read_only_fields = ['added_at']

    def validate_product_id(self, value):
        """Validate product exists and is available"""
        try:
            product = Product.objects.get(id=value)
            
            # Validate that product is available
            if not product.is_available:
                raise serializers.ValidationError(
                    "This product is currently not available"
                )
            
            # Check if product is in stock
            if product.stock <= 0:
                raise serializers.ValidationError(
                    "This product is out of stock"
                )
            
            # Check if product already in user's wishlist
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                if WishlistItem.objects.filter(
                    wishlist__user=request.user,
                    product_id=value
                ).exists():
                    raise serializers.ValidationError(
                        "This product is already in your wishlist"
                    )
            
            return value
            
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product does not exist")


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = ['id', 'items', 'total_items', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_total_items(self, obj):
        return obj.items.count()