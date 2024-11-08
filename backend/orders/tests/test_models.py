from django.test import TestCase
from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from products.models import Category, Product
from decimal import Decimal
from django.db import IntegrityError, transaction

User = get_user_model()

class OrderModelTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@gmail.com',
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
            price=Decimal('99.99'),
            stock=10
        )

        # Create test order
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('99.99'),
            shipping_address='Test Address',
        )

    def test_order_creation(self):
        """Test creating an order"""
        self.assertEqual(self.order.user, self.user)
        self.assertEqual(self.order.total_amount, Decimal('99.99'))
        self.assertEqual(self.order.shipping_address, 'Test Address')
        self.assertEqual(self.order.order_status, 'pending')
        self.assertFalse(self.order.payment_status)

    def test_order_str_representation(self):
        """Test order string representation"""
        # Based on the Meta ordering in Order model, orders are ordered by created_at descending
        expected_str = f"Order #{self.order.id}"
        self.assertEqual(str(self.order), expected_str)
        
    def test_order_status_choices(self):
        """Test order status choices"""
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        for status in valid_statuses:
            self.order.order_status = status
            self.order.save()
            self.assertEqual(self.order.order_status, status)


class OrderItemModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@gmail.com',
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
            shipping_address='Test Address',
        )

    def test_order_item_creation(self):
        """Test creating an order item"""
        order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            price=self.product.price
        )
        
        self.assertEqual(order_item.order, self.order)
        self.assertEqual(order_item.product, self.product)
        self.assertEqual(order_item.quantity, 2)
        self.assertEqual(order_item.price, self.product.price)

    def test_order_item_str_representation(self):
        """Test order item string representation"""
        order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            price=self.product.price
        )
        expected_str = f"{order_item.quantity}x {order_item.product.name} in Order #{order_item.order.id}"
        self.assertEqual(str(order_item), expected_str)
    
    
    def test_multiple_orders_same_product(self):
        """Test that the same product can be in different orders"""
        # Create first order's item
        first_order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=self.product.price
        )

        # Create second order and its item
        second_order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('99.99'),
            shipping_address='Test Address 2',
        )

        # This should work fine as it's a different order
        second_order_item = OrderItem.objects.create(
            order=second_order,
            product=self.product,
            quantity=1,
            price=self.product.price
        )

        self.assertNotEqual(first_order_item.order_id, second_order_item.order_id)
        self.assertEqual(first_order_item.product_id, second_order_item.product_id)


    def test_order_item_update_quantity(self):
        """Test updating order item quantity"""
        order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=self.product.price
        )
        
        # Update quantity
        order_item.quantity = 3
        order_item.save()
        
        # Refresh from database
        order_item.refresh_from_db()
        self.assertEqual(order_item.quantity, 3)