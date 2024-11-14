from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from decimal import Decimal
from reviews.models import Review
from products.models import Product, Category
from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

# Mock currency data for testing
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class ReviewViewSetTest(APITestCase):
    def setUp(self):
        # Create base test data
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create another user for testing
        self.other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='testpass123',
            first_name='Other',
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
            price=Decimal('199.99'),
            stock=50
        )

        # Create a review
        self.review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=5,
            comment='Great product!',
            verified_purchase=True
        )

        # URLs
        self.review_list_url = reverse('review-list')
        self.review_detail_url = reverse('review-detail', kwargs={'pk': self.review.pk})
        self.product_stats_url = reverse(
            'product-review-stats',
            kwargs={'product_id': self.product.id}
        )

        # Get token and authenticate client
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    @patch('products.serializers.get_active_currencies')
    def test_create_review(self, mock_currencies):
        """Test creating a new review"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Create a new product for testing
        new_product = Product.objects.create(
            name='New Product',
            category=self.category,
            price=Decimal('299.99'),
            stock=50
        )

        data = {
            'product_id': new_product.id,
            'rating': 4,
            'comment': 'Good product!'
        }

        response = self.client.post(self.review_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 2)
        self.assertEqual(response.data['rating'], 4)
        self.assertEqual(response.data['comment'], 'Good product!')

    @patch('products.serializers.get_active_currencies')
    def test_list_reviews(self, mock_currencies):
        """Test retrieving a list of reviews"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        response = self.client.get(self.review_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    @patch('products.serializers.get_active_currencies')
    def test_filter_reviews_by_product(self, mock_currencies):
        """Test filtering reviews by product"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        url = f"{self.review_list_url}?product_id={self.product.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['rating'], 5)

    @patch('products.serializers.get_active_currencies')
    def test_update_own_review(self, mock_currencies):
        """Test updating own review"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        data = {
            'rating': 4,
            'comment': 'Updated comment'
        }
        response = self.client.patch(self.review_detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 4)
        self.assertEqual(response.data['comment'], 'Updated comment')

    def test_update_other_user_review(self):
        """Test attempting to update another user's review"""
        # Authenticate as other user
        refresh = RefreshToken.for_user(self.other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        data = {
            'rating': 1,
            'comment': 'Trying to update'
        }
        response = self.client.patch(self.review_detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_own_review(self):
        """Test deleting own review"""
        response = self.client.delete(self.review_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Review.objects.count(), 0)

    def test_delete_other_user_review(self):
        """Test attempting to delete another user's review"""
        # Authenticate as other user
        refresh = RefreshToken.for_user(self.other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.delete(self.review_detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)