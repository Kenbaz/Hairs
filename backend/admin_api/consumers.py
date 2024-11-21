# admin_api/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Sum, Count, F
from orders.models import Order
from products.models import Product
from django.utils import timezone
from .models import AdminNotification


class DashboardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Verify admin user
        if not self.scope['user'].is_staff:
            await self.close()
            return

        await self.channel_layer.group_add(
            'admin_dashboard',
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            'admin_dashboard',
            self.channel_name
        )

    async def receive_json(self, content):
        """Handle incoming WebSocket messages"""
        command = content.get('command')

        if command == 'get_stats':
            stats = await self.get_stats()
            await self.send_json({
                'type': 'stats_update',
                'data': stats
            })

    @database_sync_to_async
    def get_stats(self):
        """Get dashboard statistics"""
        today = timezone.now()
        today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)

        return {
            'orders': {
                'total': Order.objects.count(),
                'today': Order.objects.filter(created_at__gte=today_start).count(),
                'pending': Order.objects.filter(order_status='pending').count()
            },
            'products': {
                'total': Product.objects.count(),
                'low_stock': Product.objects.filter(
                    stock__lte=F('low_stock_threshold')
                ).count()
            }
        }

    async def order_update(self, event):
        """Handle order updates"""
        await self.send_json(event)

    async def stock_update(self, event):
        """Handle stock updates"""
        await self.send_json(event)


class DashboardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if not self.scope['user'].is_staff:
            await self.close()
            return

        # Add user to their notification group
        await self.channel_layer.group_add(
            f"admin_notifications_{self.scope['user'].id}",
            self.channel_name
        )

        # Add to dashboard group (existing functionality)
        await self.channel_layer.group_add(
            'admin_dashboard',
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Remove from notification group
        if hasattr(self, 'scope') and 'user' in self.scope and self.scope['user'].is_authenticated:
            await self.channel_layer.group_discard(
                f"admin_notifications_{self.scope['user'].id}",
                self.channel_name
            )

        # Remove from dashboard group (existing functionality)
        await self.channel_layer.group_discard(
            'admin_dashboard',
            self.channel_name
        )

    async def notification_message(self, event):
        """Handle sending notifications to the client"""
        await self.send_json(event['data'])

    @database_sync_to_async
    def get_unread_count(self):
        return AdminNotification.objects.filter(
            user=self.scope['user'],
            is_read=False
        ).count()
