from rest_framework import serializers
from .models import Review
from users.serializers import UserProfileSerializer
from products.serializers import ProductListSerializer
from products.models import Product


class SimpleProductSerializer(serializers.ModelSerializer):
    """A simplified product serializer that doesn't depend on currency conversion"""
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price']


class ReviewSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'product', 'product_id', 'rating',
            'comment', 'verified_purchase',
            'created_at'
        ]
        read_only_fields = ['verified_purchase']


    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    

    def validate(self, attrs):
        # Only validate user and unique review for authenticated users during creation
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if self.instance is None:  # Create operation
                if 'product_id' not in attrs:
                    raise serializers.ValidationError(
                        {"product_id": "Product ID is required for creating a review"}
                    )
                
                # Check if user has already reviewed this product
                if Review.objects.filter(
                    user=request.user,
                    product_id=attrs['product_id']
                ).exists():
                    raise serializers.ValidationError(
                        "You have already reviewed this product"
                    )
                
                #Check if product exits
                try:
                    product = Product.objects.get(id=attrs['product_id'])
                except product.DoesNotExist:
                    raise serializers.ValidationError(
                        {"product_id": "Product does not exists"}
                    )

        return attrs

    def create(self, validated_data):
       product_id = validated_data.pop('product_id')
       try:
           product = Product.objects.get(id=product_id)
           return Review.objects.create(
               product=product, **validated_data
           )
       except Product.DoesNotExist:
           raise serializers.ValidationError(
               {'product_id': 'Product does not exists'}
           )
    

class ProductReviewsSerializer(serializers.Serializer):
    """Serializer for product review statistics"""
    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()
    rating_distribution = serializers.DictField()