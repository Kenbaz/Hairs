# customer_support/signals.py

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import CustomerEmail, EmailMetrics
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=CustomerEmail)
def create_email_metrics(sender, instance, created, **kwargs):
    """Create EmailMetrics instance when a new CustomerEmail is created"""
    if created:
        try:
            EmailMetrics.objects.create(email=instance)
        except Exception as e:
            logger.error(f"Failed to create email metrics for email {
                         instance.id}: {str(e)}")


@receiver(pre_delete, sender=CustomerEmail)
def delete_email_metrics(sender, instance, **kwargs):
    """Ensure metrics are deleted before email"""
    try:
        if hasattr(instance, 'metrics'):
            instance.metrics.delete()
    except EmailMetrics.DoesNotExist:
        pass  # If metrics don't exist, continue with deletion
