from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import F
from orders.models import Order
from products.models import Product
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import AdminNotification
import logging


logger = logging.getLogger(__name__)

class DashboardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Extract token from query parameters
        query_string = self.scope.get('query_string', b'').decode()
        token_param = [param for param in query_string.split(
            '&') if param.startswith('token=')]

        if not token_param:
            logger.error("No token provided")
            await self.close()
            return

        token = token_param[0].split('=')[1]

        try:
            # Validate the token
            access_token = AccessToken(token)
            user = await self.get_user(access_token['user_id'])

            if not user.is_staff:
                logger.warning(
                    f"Non-staff user {user.email} attempted to connect")
                await self.close()
                return

            # Store user in scope for later use
            self.scope['user'] = user

            # Accept the connection
            await self.accept()
            logger.info(f"WebSocket connected for admin user: {user.email}")

            # Send initial stats
            stats = await self.get_stats()
            await self.send_json({
                'type': 'stats_update',
                'data': stats
            })

        except (InvalidToken, TokenError) as e:
            logger.error(f"Invalid token: {str(e)}")
            await self.close()
        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            await self.close()

    @database_sync_to_async
    def get_user(self, user_id):
        User = get_user_model()
        return User.objects.get(id=user_id)


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