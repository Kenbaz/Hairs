from django.test import TestCase
from django.contrib.auth import get_user_model
from products.models import Product, Category
from orders.models import Order
from ..models import AdminNotification
from decimal import Decimal


class NotificationSignalsTest(TestCase):
    def setUp(self):
        User = get_user_model()

        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )

        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='userpass123',
            first_name='Regular',    # Added required field
            last_name='User'         # Added required field
        )

        # Create category and product
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=10,
            low_stock_threshold=5
        )

    def test_new_order_notification(self):
        """Test notification is created when new order is placed"""
        order = Order.objects.create(
            user=self.regular_user,
            total_amount=Decimal('99.99'),
            shipping_address='Test Address'
        )

        # Check if notification was created for admin
        notification = AdminNotification.objects.filter(
            user=self.admin_user,
            type='order'
        ).first()

        self.assertIsNotNone(notification)
        self.assertIn(str(order.id), notification.message)
        self.assertFalse(notification.is_read)

    def test_low_stock_notification(self):
        """Test notification is created when product stock is low"""
        # Update product stock to below threshold
        self.product.stock = 3
        self.product.save()

        # Check if notification was created
        notification = AdminNotification.objects.filter(
            user=self.admin_user,
            type='inventory'
        ).first()

        self.assertIsNotNone(notification)
        self.assertIn(self.product.name, notification.message)
        self.assertFalse(notification.is_read)
        self.assertIn('/admin/products/', notification.link)

    def test_multiple_admin_notifications(self):
        """Test notifications are created for all admin users"""
        # Create another admin user
        User = get_user_model()
        another_admin = User.objects.create_superuser(
            email='admin2@example.com',
            username='admin2',
            password='adminpass123',
            first_name='Admin',    # Added required field
            last_name='Two'        # Added required field
        )

        # Create a new order
        Order.objects.create(
            user=self.regular_user,
            total_amount=Decimal('99.99'),
            shipping_address='Test Address'
        )

        # Check notifications were created for both admins
        notifications = AdminNotification.objects.filter(type='order')
        self.assertEqual(notifications.count(), 2)

        # Verify each admin got a notification
        admin_users_with_notifications = set(
            notifications.values_list('user_id', flat=True)
        )
        self.assertIn(self.admin_user.id, admin_users_with_notifications)
        self.assertIn(another_admin.id, admin_users_with_notifications)

    def tearDown(self):
        """Clean up after tests"""
        # Delete all notifications
        AdminNotification.objects.all().delete()
        # Delete all users
        get_user_model().objects.all().delete()
        # Delete all products
        Product.objects.all().delete()
        # Delete all categories
        Category.objects.all().delete()
