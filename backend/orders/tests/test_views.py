from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from orders.models import Order, OrderItem
from products.models import Category, Product
from decimal import Decimal
from django.contrib.auth import get_user_model
from unittest.mock import patch

User = get_user_model()

# Define mock currencies
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class OrderViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create user and authenticate
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test data
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
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('99.99'),
            shipping_address='Test Address'
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=self.product.price
        )

        # Setup URLs
        self.orders_list_url = reverse('order-list')
        self.order_detail_url = reverse('order-detail', kwargs={'pk': self.order.pk})
        self.update_status_url = reverse('order-update-status', kwargs={'pk': self.order.pk})
        self.cancel_url = reverse('order-cancel', kwargs={'pk': self.order.pk})

        # Setup currency mock
        self.currency_patcher = patch(
            'products.serializers.get_active_currencies',
            return_value=MOCK_CURRENCIES
        )
        self.mock_currencies = self.currency_patcher.start()

    def tearDown(self):
        self.currency_patcher.stop()

    def test_list_orders(self):
        """Test listing user's orders"""
        response = self.client.get(self.orders_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_order(self):
        """Test creating a new order"""
        data = {
            'shipping_address': 'New Test Address',
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 2
                }
            ]
        }
        response = self.client.post(self.orders_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 2)

    def test_get_order_detail(self):
        """Test retrieving order detail"""
        response = self.client.get(self.order_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.order.id)

    def test_update_order_status_admin(self):
        """Test updating order status by admin"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'status': 'processing',
            'tracking_number': '123456'
        }
        response = self.client.post(self.update_status_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.order_status, 'processing')
        self.assertEqual(self.order.tracking_number, '123456')

    def test_update_order_status_non_admin(self):
        """Test updating order status by non-admin user"""
        data = {'status': 'processing'}
        response = self.client.post(self.update_status_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cancel_order(self):
        """Test cancelling a pending order"""
        response = self.client.post(self.cancel_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.order_status, 'cancelled')

    def test_cancel_non_pending_order(self):
        """Test attempting to cancel a non-pending order"""
        self.order.order_status = 'processing'
        self.order.save()
        response = self.client.post(self.cancel_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_orders_unauthorized(self):
        """Test listing orders without authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.orders_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_order_with_invalid_product(self):
        """Test creating order with non-existent product"""
        data = {
            'shipping_address': 'New Test Address',
            'items': [
                {
                    'product_id': 99999,  # Non-existent product
                    'quantity': 2
                }
            ]
        }
        response = self.client.post(self.orders_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('items', response.data)  # Error message should be in response
        self.assertTrue(any('does not exist' in str(err) for err in response.data['items']))

    def test_create_order_with_out_of_stock_product(self):
        """Test creating order with out of stock product"""
        # Set stock to lower than requested quantity
        self.product.stock = 1
        self.product.save()
    
        data = {
            'shipping_address': 'New Test Address',
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 2  # Requesting more than available
                }
            ]
        }
        response = self.client.post(self.orders_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('items', response.data)
        self.assertTrue(any('Not enough stock' in str(err) for err in response.data['items']))

    def test_filter_orders_by_status(self):
        """Test filtering orders by status"""
        # Create an additional order with different status
        Order.objects.create(
            user=self.user,
            total_amount=Decimal('199.99'),
            shipping_address='Test Address 2',
            order_status='delivered'
        )
        
        response = self.client.get(f"{self.orders_list_url}?order_status=pending")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['order_status'], 'pending')

    def test_create_order_with_multiple_items(self):
        """Test creating order with multiple items"""
        # Create another product
        product2 = Product.objects.create(
            name='Test Product 2',
            category=self.category,
            price=Decimal('149.99'),
            stock=5
        )
        
        data = {
            'shipping_address': 'New Test Address',
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 2
                },
                {
                    'product_id': product2.id,
                    'quantity': 1
                }
            ]
        }
        response = self.client.post(self.orders_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify order was created with correct items
        order = Order.objects.get(id=response.data['id'])
        self.assertEqual(order.items.count(), 2)
        
        # Verify total amount
        expected_total = (self.product.price * 2) + product2.price
        self.assertEqual(order.total_amount, expected_total) 
