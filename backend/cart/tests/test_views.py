from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from cart.models import Cart, CartItem
from products.models import Category, Product
from decimal import Decimal
from django.contrib.auth import get_user_model
from unittest.mock import patch

User = get_user_model()

# Mock currency data
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class CartViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create user and authenticate
        self.user = User.objects.create_user(
            email='test@gmail.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create product
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=10
        )
        
        # URLs
        self.cart_url = reverse('cart-list')
        self.add_item_url = reverse('cart-add-item')
        self.update_quantity_url = reverse('cart-update-quantity')
        self.remove_item_url = reverse('cart-remove-item')
        self.clear_url = reverse('cart-clear')
        self.merge_url = reverse('cart-merge')

        # Create mock patcher
        self.currency_patcher = patch('products.serializers.get_active_currencies', return_value=MOCK_CURRENCIES)
        self.mock_currencies = self.currency_patcher.start()

    def tearDown(self):
        self.currency_patcher.stop()

    def test_get_cart(self):
        """Test retrieving the user's cart"""
        response = self.client.get(self.cart_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('items', response.data)
        self.assertIn('total_amount', response.data)

    def test_add_item_to_cart(self):
        """Test adding an item to the cart"""
        data = {
            'product_id': self.product.id,
            'quantity': 2
        }
        response = self.client.post(self.add_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['quantity'], 2)

    def test_update_item_quantity(self):
        """Test updating item quantity in cart"""
        # First add item to cart
        cart = Cart.objects.create(user=self.user)
        cart_item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=1,
            price_at_add=self.product.price
        )
        
        data = {
            'item_id': cart_item.id,
            'quantity': 3
        }
        response = self.client.post(self.update_quantity_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 3)

    def test_remove_item_from_cart(self):
        """Test removing an item from cart"""
        cart = Cart.objects.create(user=self.user)
        cart_item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=1,
            price_at_add=self.product.price
        )
        
        data = {'item_id': cart_item.id}
        response = self.client.post(self.remove_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 0)

    def test_clear_cart(self):
        """Test clearing all items from cart"""
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=1,
            price_at_add=self.product.price
        )
        
        response = self.client.post(self.clear_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 0)

    def test_add_out_of_stock_item(self):
        """Test adding an out-of-stock item to cart"""
        self.product.stock = 0
        self.product.save()
        
        data = {
            'product_id': self.product.id,
            'quantity': 1
        }
        response = self.client.post(self.add_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_add_quantity_exceeding_stock(self):
        """Test adding quantity that exceeds available stock"""
        data = {
            'product_id': self.product.id,
            'quantity': self.product.stock + 1
        }
        response = self.client.post(self.add_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_anonymous_user_cart(self):
        """Test cart functionality for anonymous user"""
        self.client.logout()
        response = self.client.get(self.cart_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Add item to anonymous cart
        data = {
            'product_id': self.product.id,
            'quantity': 1
        }
        response = self.client.post(self.add_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)

    def test_merge_carts(self):
        """Test merging anonymous cart with user cart after login"""
        # First create an anonymous cart with an item
        self.client.logout()
        
        # Add item to anonymous cart
        anon_data = {
            'product_id': self.product.id,
            'quantity': 2
        }
        anon_response = self.client.post(self.add_item_url, anon_data)
        self.assertEqual(anon_response.status_code, status.HTTP_200_OK)

        # Create a user cart with a different item or quantity
        self.client.force_authenticate(user=self.user)
        user_data = {
            'product_id': self.product.id,
            'quantity': 1
        }
        user_response = self.client.post(self.add_item_url, user_data)
        self.assertEqual(user_response.status_code, status.HTTP_200_OK)

        # Now merge the carts
        merge_response = self.client.post(self.merge_url)
        self.assertEqual(merge_response.status_code, status.HTTP_200_OK)

        # Get the final cart state
        final_cart_response = self.client.get(self.cart_url)
        self.assertEqual(final_cart_response.status_code, status.HTTP_200_OK)
        
        # Verify the merged cart contains combined quantities
        items = final_cart_response.data['items']
        self.assertEqual(len(items), 1)  # Should only have one item type
        self.assertEqual(items[0]['quantity'], 3)  # 2 from anon cart + 1 from user cart
        
        # Verify the anonymous cart was deleted
        self.client.logout()
        anon_cart_response = self.client.get(self.cart_url)
        self.assertEqual(len(anon_cart_response.data['items']), 0)
    
    def test_merge_empty_carts(self):
        """Test merging when either cart is empty"""
        # Try merging when no anonymous cart exists
        merge_response = self.client.post(self.merge_url)
        self.assertEqual(merge_response.status_code, status.HTTP_200_OK)
        self.assertIn('message', merge_response.data)  # Should contain a message about no cart to merge

    def test_unauthenticated_merge_attempt(self):
        """Test attempting to merge carts when not logged in"""
        self.client.logout()
        response = self.client.post(self.merge_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)