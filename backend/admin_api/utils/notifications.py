from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ..models import AdminNotification
from ..serializers import AdminNotificationSerializer


def create_admin_notification(user, type, title, message, reference_id=None, link=None):
    """
    Create an admin notification and send it through WebSocket

     Args:
        user: The admin user to receive the notification
        type: Type of notification ('order' or 'inventory')
        title: Notification title
        message: Notification message
        reference_id: ID of the related order or product (optional)
        link: URL to navigate to when notification is clicked (optional)

    Returns:
        The created notification instance
    """
    # Verify user is admin
    if not user.is_staff:
        raise ValueError("Notifications can only be created for admin users")

    notification = AdminNotification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        reference_id=reference_id,
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
