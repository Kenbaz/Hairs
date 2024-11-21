from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from orders.models import Order
from products.models import Product
from .utils.notifications import create_admin_notification
from django.contrib.auth import get_user_model


@receiver(post_save, sender=Order)
def order_saved(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()

    # Prepare order data 
    order_data = {
        'id': instance.id,
        'total_amount': str(instance.total_amount),
        'status': instance.order_status,
        'customer': f"{instance.user.first_name} {instance.user.last_name}",
        'created_at': instance.created_at.isoformat()
    }

    # Send to websocket group
    async_to_sync(channel_layer.group_send)(
        'admin_dashboard',
        {
            'type': 'order_update',
            'data': order_data
        }
    )


@receiver(post_save, sender=Product)
def product_saved(sender, instance, **kwargs):
    channel_layer = get_channel_layer()

    # Check if stock is low 
    if instance.stock <= instance.low_stock_threshold:
        stock_data = {
            'id': instance.id,
            'name': instance.name,
            'current_stock': instance.stock,
            'threshold': instance.low_stock_threshold
        }

        # Send to websocket group
        async_to_sync(channel_layer.group_send)(
            'admin_dashboard',
            {
                'type': 'stock_update',
                'data': stock_data
            }
        )


@receiver(post_save, sender=Order)
def order_notification(sender, instance, created, **kwargs):
    if created:
        # Get all admin users
        User = get_user_model()
        admin_users = User.objects.filter(is_staff=True)

        # Create notification for each admin
        for admin in admin_users:
            create_admin_notification(
                user=admin,
                type='order',
                title='New Order Received',
                message=f'Order #{instance.id} has been placed',
                link=f'/admin/orders/{instance.id}'
            )

@receiver(post_save, sender=Product)
def product_stock_notification(sender, instance, **kwargs):
    if instance.stock <= instance.low_stock_threshold:
        # Get all admin users
        User = get_user_model()
        admin_users = User.objects.filter(is_staff=True)

        # Create notification for each admin
        for admin in admin_users:
            create_admin_notification(
                user=admin,
                type='inventory',
                title='Low Stock Alert',
                message=f'Product {instance.name} is running low on stock (currently {instance.stock})',
                link=f'/admin/products/{instance.id}'
            )