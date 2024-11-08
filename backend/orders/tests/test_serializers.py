from django.test import TestCase
from unittest.mock import patch
from orders.serializers import (
    OrderItemSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
    CreateOrderSerializer
)
from orders.models import Order, OrderItem
from products.models import Category, Product
from decimal import Decimal
from django.contrib.auth import get_user_model

User = get_user_model()

# Mock currency data
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class OrderSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
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

    @patch('products.serializers.get_active_currencies')
    def test_order_list_serializer(self, mock_currencies):
        """Test order list serializer"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        serializer = OrderListSerializer(self.order)
        data = serializer.data
        
        expected_fields = {
            'id', 'total_amount', 'order_status', 
            'payment_status', 'created_at'
        }
        self.assertEqual(set(data.keys()), expected_fields)
        self.assertEqual(Decimal(data['total_amount']), self.order.total_amount)


    @patch('products.serializers.get_active_currencies')
    def test_order_detail_serializer(self, mock_currencies):
        """Test order detail serializer"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        serializer = OrderDetailSerializer(self.order)
        data = serializer.data
        
        expected_fields = {
            'id', 'user', 'total_amount', 'shipping_address',
            'order_status', 'payment_status', 'tracking_number',
            'items', 'created_at', 'updated_at'
        }
        self.assertEqual(set(data.keys()), expected_fields)
        self.assertEqual(len(data['items']), 1)


    @patch('products.serializers.get_active_currencies')
    def test_create_order_serializer(self, mock_currencies):
        """Test create order serializer"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        data = {
            'shipping_address': 'New Test Address',
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 2
                }
            ]
        }
        
        serializer = CreateOrderSerializer(
            data=data,
            context={'request': type('Request', (), {'user': self.user})}
        )
        
        self.assertTrue(serializer.is_valid())
        
        # Save the order
        order = serializer.save()
        
        # Verify order was created correctly
        self.assertEqual(order.shipping_address, data['shipping_address'])
        self.assertEqual(order.user, self.user)
        
        # Verify order items
        self.assertEqual(order.items.count(), 1)
        order_item = order.items.first()
        self.assertEqual(order_item.product, self.product)
        self.assertEqual(order_item.quantity, 2)
        self.assertEqual(order_item.price, self.product.price)
        
        # Verify total amount
        expected_total = self.product.price * 2
        self.assertEqual(order.total_amount, expected_total)
