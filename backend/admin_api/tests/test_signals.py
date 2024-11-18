# admin_api/tests/test_signals.py
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from ..consumers import DashboardConsumer
from products.models import Product, Category
from orders.models import Order
from decimal import Decimal
import asyncio
import json


class SignalTests(TransactionTestCase):
    def setUp(self):
        # Create test users
        User = get_user_model()
        self.user = User.objects.create_user(
            email='user@example.com',
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

        # Create test category and product
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=10,
            low_stock_threshold=5
        )

        # Set up async loop
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

    def tearDown(self):
        self.loop.close()

    async def test_order_saved_signal(self):
        """Test that order creation sends proper WebSocket message"""
        # Connect admin to WebSocket
        communicator = await self.get_communicator(self.admin_user)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        try:
            # Create a new order (this should trigger the signal)
            order = await self.create_order()

            # Receive WebSocket message
            response = await communicator.receive_json_from()

            # Verify the message structure
            self.assertEqual(response['type'], 'order_update')
            self.assertIn('data', response)
            self.assertEqual(response['data']['id'], order.id)
            self.assertEqual(response['data']['status'], 'pending')
            self.assertEqual(
                response['data']['customer'],
                f"{self.user.first_name} {self.user.last_name}"
            )
        finally:
            await communicator.disconnect()

    async def test_product_stock_update_signal(self):
        """Test that product stock updates send proper WebSocket message"""
        # Connect admin to WebSocket
        communicator = await self.get_communicator(self.admin_user)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        try:
            # Update product stock below threshold
            self.product.stock = 3  # Below low_stock_threshold of 5
            await self.update_product_stock(self.product)

            # Receive WebSocket message
            response = await communicator.receive_json_from()

            # Verify the message structure
            self.assertEqual(response['type'], 'stock_update')
            self.assertIn('data', response)
            self.assertEqual(response['data']['id'], self.product.id)
            self.assertEqual(response['data']['name'], self.product.name)
            self.assertEqual(response['data']['current_stock'], 3)
            self.assertEqual(response['data']['threshold'], 5)
        finally:
            await communicator.disconnect()

    async def test_multiple_stock_updates(self):
        """Test multiple stock updates are properly handled"""
        # Connect admin to WebSocket
        communicator = await self.get_communicator(self.admin_user)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        try:
            # Make multiple stock updates
            updates = [8, 6, 4]  # Last one should trigger low stock alert
            for stock in updates:
                self.product.stock = stock
                await self.update_product_stock(self.product)

            # Should receive message only for the last update (below threshold)
            response = await communicator.receive_json_from()
            self.assertEqual(response['type'], 'stock_update')
            self.assertEqual(response['data']['current_stock'], 4)
        finally:
            await communicator.disconnect()

    async def test_order_status_change_signal(self):
        """Test that order status changes send proper WebSocket message"""
        # Create initial order
        order = await self.create_order()

        # Connect admin to WebSocket
        communicator = await self.get_communicator(self.admin_user)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        try:
            # Update order status
            order.order_status = 'processing'
            await self.update_order(order)

            # Receive WebSocket message
            response = await communicator.receive_json_from()

            # Verify the message structure
            self.assertEqual(response['type'], 'order_update')
            self.assertEqual(response['data']['id'], order.id)
            self.assertEqual(response['data']['status'], 'processing')
        finally:
            await communicator.disconnect()

    def test_order_saved_signal_sync(self):
        self.loop.run_until_complete(self.test_order_saved_signal())

    def test_product_stock_update_signal_sync(self):
        self.loop.run_until_complete(self.test_product_stock_update_signal())

    def test_multiple_stock_updates_sync(self):
        self.loop.run_until_complete(self.test_multiple_stock_updates())

    def test_order_status_change_signal_sync(self):
        self.loop.run_until_complete(self.test_order_status_change_signal())

    # Helper methods
    async def get_communicator(self, user):
        """Create a WebSocket communicator"""
        application = AuthMiddlewareStack(
            URLRouter([
                re_path(r'ws/admin/dashboard/$', DashboardConsumer.as_asgi()),
            ])
        )
        communicator = WebsocketCommunicator(
            application=application,
            path='/ws/admin/dashboard/'
        )
        communicator.scope['user'] = user
        return communicator

    async def create_order(self):
        """Create a test order"""
        order = await self.async_create_order(
            user=self.user,
            total_amount=Decimal('99.99'),
            shipping_address='Test Address',
            order_status='pending'
        )
        return order

    @staticmethod
    async def async_create_order(**kwargs):
        """Helper method to create order asynchronously"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: Order.objects.create(**kwargs)
        )

    @staticmethod
    async def update_product_stock(product):
        """Helper method to update product stock asynchronously"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: product.save()
        )

    @staticmethod
    async def update_order(order):
        """Helper method to update order asynchronously"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: order.save()
        )
