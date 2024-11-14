from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from decimal import Decimal
from reviews.models import Review
from products.models import Product, Category
from users.models import User
from orders.models import Order, OrderItem
from datetime import datetime, timedelta
from django.utils import timezone

class ReviewModelTest(TestCase):
    def setUp(self):
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

        # Create a delivered order with the product (for verified purchase tests)
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('100.00'),
            shipping_address='Test Address',
            order_status='delivered'  # This is important for verified purchase
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=Decimal('100.00')
        )

        # Base review data
        self.review_data = {
            'user': self.user,
            'product': self.product,
            'rating': 5,
            'comment': 'Great product!',
        }

    def test_review_creation(self):
        """Test creating a review"""
        # Save the review
        review = Review.objects.create(**self.review_data)
        
        # Refresh from database to ensure all fields are updated
        review.refresh_from_db()
        
        self.assertEqual(review.user, self.user)
        self.assertEqual(review.product, self.product)
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, 'Great product!')
        self.assertTrue(review.verified_purchase)  # Should be True due to existing delivered order

    def test_review_str_representation(self):
        """Test the string representation of a review"""
        review = Review.objects.create(**self.review_data)
        expected_str = f"testuser's review for Test Product"
        self.assertEqual(str(review), expected_str)

    def test_rating_validation(self):
        """Test rating validation (1-5)"""
        invalid_ratings = [0, 6, -1, 10]
        for rating in invalid_ratings:
            review_data = self.review_data.copy()
            review_data['rating'] = rating
            with self.assertRaises(ValidationError):
                review = Review(**review_data)
                review.full_clean()

    def test_one_review_per_user_per_product(self):
        """Test that a user can only review a product once"""
        # Create first review
        Review.objects.create(**self.review_data)
        
        # Attempt to create second review
        with self.assertRaises(IntegrityError):
            Review.objects.create(**self.review_data)

    def test_verified_purchase_status(self):
        """Test verified purchase status based on order history"""
        # Create a review for a product with a delivered order
        review_with_order = Review.objects.create(**self.review_data)
        self.assertTrue(review_with_order.verified_purchase)

        # Create another product without an order
        product_without_order = Product.objects.create(
            name='Product Without Order',
            category=self.category,
            description='Another Description',
            price=Decimal('100.00'),
            stock=10
        )
        
        # Create review for product without order
        review_data = self.review_data.copy()
        review_data['product'] = product_without_order
        review_without_order = Review.objects.create(**review_data)
        self.assertFalse(review_without_order.verified_purchase)

        # Create third product for pending order test
        product_pending_order = Product.objects.create(
            name='Product With Pending Order',
            category=self.category,
            description='Third Product',
            price=Decimal('100.00'),
            stock=10
        )

        # Create pending order
        pending_order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('100.00'),
            shipping_address='Test Address',
            order_status='pending'  # Order not delivered yet
        )
        OrderItem.objects.create(
            order=pending_order,
            product=product_pending_order,
            quantity=1,
            price=Decimal('100.00')
        )

        # Create review for product with pending order
        review_with_pending = Review.objects.create(
            user=self.user,
            product=product_pending_order,
            rating=4,
            comment='Good product'
        )
        self.assertFalse(review_with_pending.verified_purchase)

    def test_review_ordering(self):
        """Test that reviews are ordered by created_at in descending order"""
        # Create another product
        product2 = Product.objects.create(
            name='Product 2',
            category=self.category,
            description='Description 2',
            price=Decimal('100.00'),
            stock=10
        )

        # Create reviews at different times
        older_review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=4,
            comment='First review'
        )
        
        # Ensure second review has a later timestamp
        newer_review = Review.objects.create(
            user=self.user,
            product=product2,
            rating=5,
            comment='Second review'
        )

        # Get ordered reviews
        reviews = Review.objects.all()
        
        # Verify ordering
        self.assertEqual(reviews.first(), newer_review)
        self.assertEqual(reviews.last(), older_review)