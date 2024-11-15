from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework import serializers
from decimal import Decimal
from wishlist.models import Wishlist, WishlistItem
from wishlist.serializers import WishlistSerializer, WishlistItemSerializer
from products.models import Product, Category
from users.models import User
from unittest.mock import patch

# Mock currency data
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class WishlistSerializerTest(TestCase):
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
            is_available=True  # Make sure product is available
        )
        self.product2 = Product.objects.create(
            name='Test Product 2',
            category=self.category,
            price=Decimal('149.99'),
            stock=5,
            is_available=True  # Make sure product is available
        )

        # Create wishlist
        self.wishlist = Wishlist.objects.create(user=self.user)
        
        # Create request
        self.request = self.factory.get('/')
        self.request.user = self.user

    @patch('products.serializers.get_active_currencies')
    def test_wishlist_serialization(self, mock_currencies):
        """Test serializing a wishlist"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Add items to wishlist
        item1 = WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        item2 = WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product2
        )

        serializer = WishlistSerializer(
            instance=self.wishlist,
            context={'request': self.request}
        )
        data = serializer.data

        self.assertEqual(len(data['items']), 2)
        self.assertEqual(data['total_items'], 2)
        self.assertTrue('created_at' in data)
        self.assertTrue('updated_at' in data)

    @patch('products.serializers.get_active_currencies')
    def test_wishlist_item_serialization(self, mock_currencies):
        """Test serializing a wishlist item"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Create wishlist item
        wishlist_item = WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )

        serializer = WishlistItemSerializer(
            wishlist_item,
            context={'request': self.request}
        )
        data = serializer.data

        self.assertTrue('id' in data)
        self.assertEqual(data['product']['id'], self.product1.id)
        self.assertEqual(data['product']['name'], self.product1.name)
        self.assertTrue('added_at' in data)

    @patch('products.serializers.get_active_currencies')
    def test_wishlist_item_create_validation(self, mock_currencies):
        """Test validation when creating wishlist item"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Valid data
        valid_data = {'product_id': self.product1.id}
        serializer = WishlistItemSerializer(
            data=valid_data,
            context={'request': self.request}
        )
        self.assertTrue(serializer.is_valid())

        # Invalid product ID
        invalid_data = {'product_id': 99999}  # Non-existent product ID
        serializer = WishlistItemSerializer(
            data=invalid_data,
            context={'request': self.request}
        )
        with self.assertRaises(serializers.ValidationError):  # Changed this line
            serializer.is_valid(raise_exception=True)

    @patch('products.serializers.get_active_currencies')
    def test_duplicate_item_validation(self, mock_currencies):
        """Test validation for duplicate items"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Add item to wishlist
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )

        # Try to add same product again
        data = {'product_id': self.product1.id}
        serializer = WishlistItemSerializer(
            data=data,
            context={'request': self.request}
        )
        with self.assertRaises(serializers.ValidationError):  # Changed this line
            serializer.is_valid(raise_exception=True)

    @patch('products.serializers.get_active_currencies')
    def test_unavailable_product_validation(self, mock_currencies):
        """Test validation for unavailable product"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Make product unavailable
        self.product1.is_available = False
        self.product1.save()

        data = {'product_id': self.product1.id}
        serializer = WishlistItemSerializer(
            data=data,
            context={'request': self.request}
        )
        with self.assertRaises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

    @patch('products.serializers.get_active_currencies')
    def test_out_of_stock_product_validation(self, mock_currencies):
        """Test validation for out of stock product"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Set product stock to 0
        self.product1.stock = 0
        self.product1.save()

        data = {'product_id': self.product1.id}
        serializer = WishlistItemSerializer(
            data=data,
            context={'request': self.request}
        )
        with self.assertRaises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)