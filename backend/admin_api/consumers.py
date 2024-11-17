import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Sum, Count, F
from orders.models import Order
from products.models import Product
from django.utils import timezone


class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Verify admin user
        if not self.scope['user'].is_staff:
            await self.close()
            return
        
        await self.channel_layer.group_add(
            "admin_dashboard",
            self.channel_name
        )
        await self.accept()
    
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            'admin_dashboard',
            self.channel_name
        )
    
    
    async def recieve(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'subscribe_sales':
            await self.send_sales_data()
            action = data.get('action')
        elif action == 'subscribe_stock':
            await self.send_stock_alerts()
    
    @database_sync_to_async
    def get_real_time_stats(self):
        today = timezone.now()
        today_start = today.replace(hour=0, minute=0, second=0)

        return {
            'today_sales': Order.objects.filter(
                created_at__gte=today_start,
                payment_status=True
            ).aggregate(
                total=Sum('total_amount'),
                count=Count('id')
            ),
            'low_stock_count': Product.objects.filter(
                stock__lte=F('low_stock_threshold')
            ).count(),
            'active_orders': Order.objects.exclude(
                order_status__in=['delivered', 'cancelled']
            ).count()
        }
    

    async def send_sales_data(self):
        stats = await self.get_real_time_stats()
        await self.send(json.dumps({
            'type': 'sales_update',
            'data': stats
        }))
    

    async def order_updates(self, event):
        """ Handle new orders updates """
        await self.send(json.dumps({
            'type': 'order_update',
            'data': event['data']
        }))
    

    async def stock_update(self, event):
        """ Handle stock updates """
        await self.send(json.dumps({
            'type': 'stock_update',
            'data': event['data']
        }))
    