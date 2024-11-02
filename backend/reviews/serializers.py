from rest_framework import serializers
from .models import Review
from users.serializers import UserProfileSerializer


class ReviewSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'product_id', 'rating',
            'comment', 'verified_purchase',
            'created_at'
        ]
        read_only_fields = ['verified_purchase']


    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    

    def validate(self, attrs):
        user = self.context['request'].user
        product_id = attrs['product_id']

        # Check if user has already reviewed this product
        if self.context['request'].method == 'POST':
            if Review.objects.filter(user=user, product_id=product_id).exists():
                raise serializers.ValidationError(
                    "You have already reviewed this product"
                )
            
        # Check if this a verified purchase
        has_purchased = user.order_set.filter(
            items__product_id=product_id,
            order_status = 'delivered'
        ).exists()

        if has_purchased:
            attrs['verified_purchase'] = True

        return attrs
    

class ProductReviewsSerializer(serializers.Serializer):
    """Serializer for product review statistics"""
    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()
    rating_distribution = serializers.DictField()