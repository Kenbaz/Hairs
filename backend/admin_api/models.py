from django.db import models
from django.conf import settings


class AdminNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('order', 'Order Update'),
        ('inventory', 'Inventory Alert'),
        ('user', 'User Activity'),
        ('system', 'System Update'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_notifications'
    )
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} notification for {self.user.email}"
