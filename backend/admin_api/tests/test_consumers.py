# admin_api/tests/test_consumers.py
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.urls import re_path
from django.test import TransactionTestCase
from ..consumers import DashboardConsumer
from django.contrib.auth import get_user_model
from products.models import Product, Category
from orders.models import Order
import asyncio
import json


class DashboardConsumerTests(TransactionTestCase):
    async def asyncSetUp(self):
        """Async setup - creates basic test data"""
        self.user = await self.create_regular_user()
        self.admin_user = await self.create_admin_user()
        await self.create_test_data()

    @database_sync_to_async
    def create_admin_user(self):
        User = get_user_model()
        return User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )

    @database_sync_to_async
    def create_regular_user(self):
        User = get_user_model()
        return User.objects.create_user(
            email='user@example.com',
            username='user',
            password='userpass123',
            first_name='Regular',
            last_name='User'
        )

    @database_sync_to_async
    def create_test_data(self):
        # Create category
        category = Category.objects.create(name='Test Category')

        # Create products
        Product.objects.create(
            name='Test Product 1',
            category=category,
            price=99.99,
            stock=10,
            low_stock_threshold=5
        )
        Product.objects.create(
            name='Test Product 2',
            category=category,
            price=149.99,
            stock=3,
            low_stock_threshold=5
        )

        # Create orders
        Order.objects.create(
            user=self.user,
            total_amount=99.99,
            shipping_address='Test Address',
            order_status='pending'
        )

    async def get_communicator(self, user=None):
        """Helper method to create a communicator"""
        application = AuthMiddlewareStack(
            URLRouter([
                re_path(r'ws/admin/dashboard/$', DashboardConsumer.as_asgi()),
            ])
        )
        communicator = WebsocketCommunicator(
            application=application,
            path='/ws/admin/dashboard/'
        )
        if user:
            communicator.scope['user'] = user
        return communicator

    async def test_connect(self):
        """Test connecting to the WebSocket as admin"""
        communicator = await self.get_communicator(self.admin_user)
        try:
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
        finally:
            await communicator.disconnect()

    async def test_unauthorized_connect(self):
        """Test connecting to the WebSocket as non-admin"""
        communicator = await self.get_communicator(self.user)
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_receive_stats(self):
        """Test receiving stats through WebSocket"""
        communicator = await self.get_communicator(self.admin_user)

        try:
            # Connect
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            # Request stats
            await communicator.send_json_to({
                'command': 'get_stats'
            })

            # Wait for response with timeout
            response = await communicator.receive_json_from(timeout=1)

            # Verify response structure
            self.assertEqual(response['type'], 'stats_update')
            self.assertIn('data', response)
            self.assertIn('orders', response['data'])
            self.assertIn('products', response['data'])

            # Verify the actual data
            orders_data = response['data']['orders']
            products_data = response['data']['products']

            self.assertEqual(orders_data['total'], 1)  # We created 1 order
            # It was a pending order
            self.assertEqual(orders_data['pending'], 1)
            # We created 2 products
            self.assertEqual(products_data['total'], 2)
            # 1 product is below threshold
            self.assertEqual(products_data['low_stock'], 1)

        finally:
            await communicator.disconnect()

    def setUp(self):
        """Synchronous setup"""
        super().setUp()
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        # Run async setup
        self.loop.run_until_complete(self.asyncSetUp())

    def tearDown(self):
        """Cleanup"""
        self.loop.close()
        super().tearDown()

    def test_connect_sync(self):
        self.loop.run_until_complete(self.test_connect())

    def test_unauthorized_connect_sync(self):
        self.loop.run_until_complete(self.test_unauthorized_connect())

    def test_receive_stats_sync(self):
        self.loop.run_until_complete(self.test_receive_stats())
