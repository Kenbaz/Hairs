from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from decimal import Decimal
from wishlist.models import Wishlist, WishlistItem
from products.models import Product, Category
from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

# Mock currency data
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class WishlistViewSetTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create another test user
        self.other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='testpass123',
            first_name='Other',
            last_name='User'
        )

        # Create test category and products
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )
        self.product1 = Product.objects.create(
            name='Test Product 1',
            category=self.category,
            price=Decimal('99.99'),
            stock=10,
            is_available=True
        )
        self.product2 = Product.objects.create(
            name='Test Product 2',
            category=self.category,
            price=Decimal('149.99'),
            stock=5,
            is_available=True
        )

        # Create wishlist
        self.wishlist = Wishlist.objects.create(user=self.user)

        # Get authentication token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    @patch('products.serializers.get_active_currencies')
    def test_list_wishlist(self, mock_currencies):
        """Test retrieving user's wishlist"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        
        url = reverse('wishlist-list')  # Changed URL name
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)

    @patch('products.serializers.get_active_currencies')
    def test_add_item_to_wishlist(self, mock_currencies):
        """Test adding item to wishlist"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        url = reverse('wishlist-add-item')
        data = {'product_id': self.product1.id}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.count(), 1)

    @patch('products.serializers.get_active_currencies')
    def test_remove_item_from_wishlist(self, mock_currencies):
        """Test removing item from wishlist"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Add item first
        wishlist_item = WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        
        url = reverse('wishlist-remove-item')
        data = {'product_id': self.product1.id}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.count(), 0)

    @patch('products.serializers.get_active_currencies')
    def test_clear_wishlist(self, mock_currencies):
        """Test clearing all items from wishlist"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Add multiple items
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product2
        )
        
        url = reverse('wishlist-clear')  # Changed URL name
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.count(), 0)

    @patch('products.serializers.get_active_currencies')
    def test_check_product_in_wishlist(self, mock_currencies):
        """Test checking if product is in wishlist"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        
        url = reverse('wishlist-check-product')
        response = self.client.get(url, {'product_id': self.product1.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_in_wishlist'])

    def test_unauthorized_access(self):
        """Test unauthorized access to wishlist"""
        # Remove authentication
        self.client.credentials()
        
        url = reverse('wishlist-list')  # Changed URL name
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('products.serializers.get_active_currencies')
    def test_add_duplicate_item(self, mock_currencies):
        """Test adding duplicate item to wishlist"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Add item first time
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        
        # Try to add same item again
        url = reverse('wishlist-add-item')
        data = {'product_id': self.product1.id}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(WishlistItem.objects.count(), 1)