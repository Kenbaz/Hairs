# admin_api/models.py

from django.db import models
from django.conf import settings


class AdminNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('order', 'New Order'),
        ('inventory', 'Low Stock Alert'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_notifications'
    )
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    reference_id = models.IntegerField(
        help_text="ID of the related order or product",
        null=True
    )
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} notification for {self.user.email}"
