from rest_framework import serializers
from .models import Wishlist, WishlistItem
from products.serializers import ProductListSerializer



class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)


    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'added_at']
        read_only_fields = ['added_at']



class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True, source='wishlistitem_set')
    total_items =serializers.SerializerMethodField()


    class Meta:
        models = Wishlist
        fields = ['id', 'items', 'total_items', 'created_at', 'updated_at']

    
    def get_total_items(self, obj):
        return obj.items.count()