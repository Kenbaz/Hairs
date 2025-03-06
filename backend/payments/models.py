# payments/models.py

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded')
    ]

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    original_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount in original currency before conversion"
    )
    base_currency = models.CharField(
        max_length=3,
        default='USD',
        help_text="Base currency (USD)"
    )
    payment_currency = models.CharField(
        max_length=3,
        help_text="Currency used for payment"
    )
    exchange_rate = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        help_text="Exchange rate to USD"
    )
    reference = models.CharField(
        max_length=200,
        unique=True,
        help_text="internal payment reference"
    )
    provider_reference = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="payment provider's reference"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    payment_method = models.CharField(
        max_length=50,
        default='card',
    )
    meta_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Additional payment metadata"
    )
    error_message = models.TextField(
        null=True,
        blank=True
    )
    paid_at = models.DateTimeField(
        null=True,
        blank=True
    )
    expires_at = models.DateTimeField(
        help_text="Payment validity period"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reference']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['order', 'status']),
        ]


    def __str__(self):
        return f"Payment {self.reference} - {self.status}"


    def save(self, *args, **kwargs):
        # Set expiry time on creation
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(
                minutes=settings.PAYMENT_EXPIRY_MINUTES
            )
        super().save(*args, **kwargs)


class PaymentTransaction(models.Model):
    """Log of all payment-related transactions and events"""

    TRANSACTION_TYPES = [
        ('initialize', 'Payment Initialized'),
        ('verify', 'Payment Verification'),
        ('success', 'Payment Successful'),
        ('failure', 'Payment Failed'),
        ('refund', 'Payment Refunded'),
        ('webhook', 'Webhook Received'),
        ('retry', 'Payment Retry'),
        ('expire', 'Payment Expired'),
    ]

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=50,
        help_text="Status returned by payment provider"
    )
    provider_reference = models.CharField(
        max_length=200,
        null=True,
        blank=True
    )
    response_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Full response from payment provider"
    )
    response_message = models.TextField(
        null=True,
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering = ['-created_at']


    def __str__(self):
        return f"{self.transaction_type} - {self.payment.reference}"
