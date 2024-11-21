from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import AdminNotification


class AdminNotificationModelTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.notification = AdminNotification.objects.create(
            user=self.admin_user,
            type='order',
            title='New Order',
            message='Order #123 has been placed',
            link='/admin/orders/123'
        )

    def test_notification_creation(self):
        """Test creating a notification"""
        self.assertEqual(self.notification.type, 'order')
        self.assertEqual(self.notification.title, 'New Order')
        self.assertFalse(self.notification.is_read)
        self.assertTrue(self.notification.created_at)

    def test_notification_str_representation(self):
        """Test string representation of notification"""
        expected = f"order notification for {self.admin_user.email}"
        self.assertEqual(str(self.notification), expected)

    def test_notification_ordering(self):
        """Test notifications are ordered by created_at in descending order"""
        notification2 = AdminNotification.objects.create(
            user=self.admin_user,
            type='inventory',
            title='Low Stock',
            message='Product X is low on stock'
        )
        notifications = AdminNotification.objects.all()
        self.assertEqual(notifications[0], notification2)
        self.assertEqual(notifications[1], self.notification)
