from django.test import TestCase
from rest_framework.test import APIRequestFactory
from reviews.serializers import ReviewSerializer, ProductReviewsSerializer
from reviews.models import Review
from products.models import Product, Category
from users.models import User
from orders.models import Order, OrderItem
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from unittest.mock import patch

# Mock currency data
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class ReviewSerializerTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create test category and product
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            description='Test Description',
            price=Decimal('100.00'),
            stock=10
        )

        # Create verified purchase order
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('100.00'),
            shipping_address='Test Address',
            order_status='delivered'
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=Decimal('100.00')
        )

        # Valid review data
        self.review_data = {
            'product_id': self.product.id,
            'rating': 5,
            'comment': 'Great product!'
        }

        # Create request context
        self.request = self.factory.post('/')
        self.request.user = self.user

    @patch('products.serializers.get_active_currencies')
    def test_valid_review_serialization(self, mock_currencies):
        """Test serializing a valid review"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        serializer = ReviewSerializer(
            data=self.review_data,
            context={'request': self.request}
        )
        self.assertTrue(serializer.is_valid())
        review = serializer.save(user=self.user)  # Pass user explicitly here
        self.assertEqual(review.user, self.user)
        self.assertEqual(review.product, self.product)
        self.assertTrue(review.verified_purchase)

    def test_invalid_rating(self):
        """Test validation for invalid rating"""
        invalid_data = self.review_data.copy()
        invalid_data['rating'] = 6
        serializer = ReviewSerializer(
            data=invalid_data,
            context={'request': self.request}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('rating', serializer.errors)

    def test_duplicate_review_validation(self):
        """Test validation for duplicate reviews"""
        # Create first review
        Review.objects.create(
            user=self.user,
            product=self.product,
            rating=5,
            comment='First review'
        )

        # Try to create second review
        serializer = ReviewSerializer(
            data=self.review_data,
            context={'request': self.request}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    @patch('products.serializers.get_active_currencies')
    def test_verified_purchase_flag(self, mock_currencies):
        """Test verified purchase flag setting"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Test with product that has a delivered order
        serializer = ReviewSerializer(
            data=self.review_data,
            context={'request': self.request}
        )
        self.assertTrue(serializer.is_valid())
        review = serializer.save(user=self.user)  # Pass user explicitly here
        self.assertTrue(review.verified_purchase)

        # Test with product that has no order
        new_product = Product.objects.create(
            name='Another Product',
            category=self.category,
            description='Another Description',
            price=Decimal('100.00'),
            stock=10
        )
        
        new_review_data = self.review_data.copy()
        new_review_data['product_id'] = new_product.id
        
        serializer = ReviewSerializer(
            data=new_review_data,
            context={'request': self.request}
        )
        self.assertTrue(serializer.is_valid())
        review = serializer.save(user=self.user)  # Pass user explicitly here
        self.assertFalse(review.verified_purchase)


class ProductReviewsSerializerTest(TestCase):
    def setUp(self):
        # Create test category and product
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            description='Test Description',
            price=Decimal('100.00'),
            stock=10
        )

        # Create multiple users and reviews
        for i in range(5):
            user = User.objects.create_user(
                email=f'user{i}@example.com',
                username=f'user{i}',
                password='testpass123',
                first_name=f'User{i}',
                last_name='Test'
            )
            Review.objects.create(
                user=user,
                product=self.product,
                rating=i+1,  # Ratings from 1 to 5
                comment=f'Review {i+1}'
            )

    def test_product_review_statistics(self):
        """Test product review statistics serialization"""
        review_stats = {
            'total_reviews': 5,
            'average_rating': 3.0,  # (1+2+3+4+5)/5
            'rating_distribution': {
                '1': 1,
                '2': 1,
                '3': 1,
                '4': 1,
                '5': 1
            }
        }
        serializer = ProductReviewsSerializer(review_stats)
        self.assertEqual(serializer.data['total_reviews'], 5)
        self.assertEqual(serializer.data['average_rating'], 3.0)
        self.assertEqual(
            serializer.data['rating_distribution'],
            review_stats['rating_distribution']
        )