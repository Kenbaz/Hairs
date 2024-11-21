from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ..models import AdminNotification
from ..serializers import AdminNotificationSerializer


def create_admin_notification(user, type, title, message, link=None):
    """
    Create an admin notification and send it through WebSocket
    """
    # Verify user is admin
    if not user.is_staff:
        raise ValueError("Notifications can only be created for admin users")

    notification = AdminNotification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        link=link
    )

    # Serialize the notification
    serializer = AdminNotificationSerializer(notification)
    notification_data = serializer.data

    # Send through WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"admin_notifications_{user.id}",
        {
            "type": "notification_message",
            "data": {
                "type": "notification",
                "notification": notification_data
            }
        }
    )

    return notification
