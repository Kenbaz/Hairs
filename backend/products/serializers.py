from rest_framework import serializers
from .models import Category, Product, ProductImage


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


    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'price', 'discount_price', 'is_featured', 'primary_image'
        ]


    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ProductImageSerializer(primary_image).data
        return None
    

class ProductDetailsSerializer(serializers.ModelSerializer):
    """ Serializer for detailed product view """
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'description',
            'hair_type', 'length', 'price', 'discount_price',
            'stock', 'care_instructions', 'is_featured',
            'is_available', 'images', 'created_at', 'updated_at'
        ]