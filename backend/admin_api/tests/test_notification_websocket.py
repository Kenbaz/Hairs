from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import connections
from ..consumers import DashboardConsumer
from ..utils.notifications import create_admin_notification
import json
import asyncio


class NotificationWebsocketTest(TransactionTestCase):
    def setUp(self):
        self.User = get_user_model()
        self.admin_user = self.User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.regular_user = self.User.objects.create_user(
            email='user@example.com',
            username='user',
            password='userpass123',
            first_name='Regular',
            last_name='User'
        )

    async def test_admin_connection(self):
        """Test admin user can connect to notification websocket"""
        communicator = await self.get_communicator(self.admin_user)
        try:
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
        finally:
            await communicator.disconnect()

    async def test_non_admin_connection_rejected(self):
        """Test non-admin user cannot connect to notification websocket"""
        communicator = await self.get_communicator(self.regular_user)
        try:
            # Try to connect first, then verify it's rejected
            connected, _ = await communicator.connect()
            self.assertFalse(connected)
        finally:
            # Clean up
            if communicator.output_queue is not None:
                await communicator.disconnect()

    async def test_receive_notification(self):
        """Test receiving notification through websocket"""
        communicator = await self.get_communicator(self.admin_user)
        try:
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            # Create a notification
            notification = await self.create_test_notification()

            try:
                # Set a reasonable timeout for receiving the message
                response = await communicator.receive_json_from(timeout=2)

                # The response structure should match what our consumer sends
                self.assertEqual(response['type'], 'notification')
                self.assertIn('notification', response)
                self.assertEqual(
                    response['notification']['title'],
                    'Test Notification'
                )
            except asyncio.TimeoutError:
                self.fail("Didn't receive notification message in time")

        finally:
            await communicator.disconnect()

    async def get_communicator(self, user):
        """Helper method to create websocket communicator"""
        application = AuthMiddlewareStack(
            URLRouter([
                re_path(r'ws/admin/dashboard/$', DashboardConsumer.as_asgi()),
            ])
        )
        communicator = WebsocketCommunicator(
            application=application,
            path='/ws/admin/dashboard/'
        )
        # Set the user in the scope
        communicator.scope['user'] = user
        return communicator

    async def create_test_notification(self):
        """Helper method to create test notification"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            create_admin_notification,
            self.admin_user,
            'test',
            'Test Notification',
            'Test message'
        )

    def test_websocket_connection_sync(self):
        """Synchronous wrapper for websocket tests"""
        async def run_tests():
            try:
                await self.test_admin_connection()
                await self.test_non_admin_connection_rejected()
                await self.test_receive_notification()
            except Exception as e:
                self.fail(f"Tests failed with error: {str(e)}")

        # Create and set a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(run_tests())
        finally:
            # Clean up the loop
            pending = asyncio.all_tasks(loop)
            for task in pending:
                task.cancel()
            loop.run_until_complete(asyncio.gather(
                *pending, return_exceptions=True))
            loop.close()

    def tearDown(self):
        """Clean up after each test"""
        # Close database connections
        for conn in connections.all():
            conn.close()
        super().tearDown()

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests"""
        try:
            # Close all database connections
            for conn in connections.all():
                conn.close()
        finally:
            super().tearDownClass()
