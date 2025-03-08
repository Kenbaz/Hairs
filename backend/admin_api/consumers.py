from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import F
from orders.models import Order
from products.models import Product
from django.utils import timezone
from .models import AdminNotification
import logging


logger = logging.getLogger(__name__)

class DashboardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        print("Attempting WebSocket connection...")
        
        user = self.scope["user"]
        if not user.is_authenticated or not user.is_staff:
            print("Rejecting connection - authentication failed")
            await self.close()
            return

        # Accept the connection first
        await self.accept()
        print(f"WebSocket connected for user: {user.email}")

        # Send initial stats
        try:
            stats = await self.get_stats()
            await self.send_json({
                'type': 'stats_update',
                'data': stats
            })
            print("Initial stats sent successfully")

            # Send test notification
            await self.send_json({
                'type': 'notification',
                'data': {
                    'id': 1,
                    'type': 'system',
                    'title': 'Connection Successful',
                    'message': 'WebSocket connection established successfully',
                    'is_read': False,
                    'created_at': timezone.now().isoformat()
                }
            })
        except Exception as e:
            logger.error(f"Error in connect: {str(e)}")


    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                print(f"Removed from group: {self.group_name}")
        except Exception as e:
            logger.error(f"Error in disconnect: {str(e)}")
        print(f"WebSocket disconnected with code: {close_code}")


    async def receive_json(self, content):
        """Handle incoming WebSocket messages"""
        try:
            message_type = content.get('type')

            if message_type == 'ping':
                # Respond to ping with pong
                await self.send_json({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                })
            elif message_type == 'get_stats':
                stats = await self.get_stats()
                await self.send_json({
                    'type': 'stats_update',
                    'data': stats
                })

        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await self.send_json({
                'type': 'error',
                'message': str(e)
            })


    async def stats_update(self, event):
        """Handle stats update messages"""
        try:
            await self.send_json(event)
            print("Stats update sent to client")
        except Exception as e:
            logger.error(f"Error sending stats update: {str(e)}")


    @database_sync_to_async
    def get_stats(self):
        """Get dashboard statistics"""
        try:
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
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            return {'error': 'Failed to get stats'}


    async def notification_message(self, event):
        """Handle sending notifications to the client"""
        try:
            await self.send_json(event['data'])
            print("Notification sent successfully")
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")


# async def order_update(self, event):
#         """Handle order updates"""
#         await self.send_json(event)

#     async def stock_update(self, event):
#         """Handle stock updates"""
#         await self.send_json(event)

#     async def notification_message(self, event):
#         """Handle sending notifications to the client"""
#         print(f"Sending notification: {event}")  # Debug print
#         await self.send_json(event['data'])

#     @database_sync_to_async
#     def get_unread_count(self):
#         """Get count of unread notifications"""
#         return AdminNotification.objects.filter(
#             user=self.scope['user'],
#             is_read=False
#         ).count()