from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from ..models import AdminNotification


class AdminNotificationViewSetTest(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='userpass123',
            first_name='Regular',
            last_name='User'
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

        # Create test notifications
        self.notifications = [
            AdminNotification.objects.create(
                user=self.admin_user,
                type='order',
                title=f'Notification {i}',
                message=f'Test message {i}'
            ) for i in range(3)
        ]

    def test_list_notifications(self):
        """Test retrieving all notifications"""
        url = reverse('admin-notification-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check pagination structure
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        # Check number of notifications in results
        self.assertEqual(len(response.data['results']), 3)
        # Check total count
        self.assertEqual(response.data['count'], 3)

    def test_mark_notification_read(self):
        """Test marking a notification as read"""
        notification = self.notifications[0]
        url = reverse('admin-notification-mark-read',
                      kwargs={'pk': notification.pk})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_mark_all_read(self):
        """Test marking all notifications as read"""
        url = reverse('admin-notification-mark-all-read')
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread_count = AdminNotification.objects.filter(
            user=self.admin_user,
            is_read=False
        ).count()
        self.assertEqual(unread_count, 0)

    def test_get_unread_count(self):
        """Test getting unread notification count"""
        url = reverse('admin-notification-unread-count')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_unauthorized_access(self):
        """Test that non-admin users cannot access notifications"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('admin-notification-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_notification_detail(self):
        """Test retrieving a single notification"""
        notification = self.notifications[0]
        url = reverse('admin-notification-detail',
                      kwargs={'pk': notification.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], notification.id)
        self.assertEqual(response.data['title'], notification.title)
        self.assertEqual(response.data['type'], notification.type)
