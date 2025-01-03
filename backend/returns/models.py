# returns/models.py

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Return(models.Model):
    RETURN_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('received', 'Received'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed')
    ]

    REFUND_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='returns'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='returns'
    )

    items_received = models.BooleanField(default=False)

    reason = models.TextField()

    return_status = models.CharField(
        max_length=20,
        choices=RETURN_STATUS_CHOICES,
        default='pending'
    )

    refund_status = models.CharField(
        max_length=20,
        choices=REFUND_STATUS_CHOICES,
        default='pending'
    )
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='return_updates'
    )

    class Meta:
        ordering = ['-created_at']
    

    def approve_return(self, approved_by):
        if self.return_status != 'pending':
            raise ValueError("Can only approve pending returns")

        self.return_status = 'approved'
        self.save()

        ReturnHistory.objects.create(
            return_request=self,
            status='approved',
            notes="Return request approved",
            created_by=approved_by
        )


    def mark_items_recieved(self, recieved_by):
        if self.return_status != 'approved':
            raise ValueError("Return must be approved first")
        
        self.items_received = True
        self.return_status = 'received'
        self.save()

        ReturnHistory.objects.create(
            return_request=self,
            status='received',
            notes="Items received",
            created_by=recieved_by
        )
    
    
    def process_refund(self, amount, processed_by):
        if not self.items_received:
            raise ValueError("Cannot process refund before receiving items")

        self.refund_amount = amount
        self.refund_status = 'processing'
        self.save()

        ReturnHistory.objects.create(
            return_request=self,
            status='refund_processing',
            notes=f"Processing refund of ${amount}",
            created_by=processed_by
        )


    def __str__(self):
        return f'Return #{self.id} for Order #{self.order.id}'
    

class ReturnItem(models.Model):
    CONDITION_CHOICES = [
        ('unopened', 'Unopened'),
        ('opened', 'Opened'),
        ('damaged', 'Damaged')
    ]

    return_request = models.ForeignKey(
        Return,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField()
    reason = models.TextField()
    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES
    )

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in Return #{self.return_request.id}"


class ReturnImage(models.Model):
    return_item = models.ForeignKey(
        ReturnItem,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='returns/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class ReturnHistory(models.Model):
    return_request = models.ForeignKey(
        Return,
        on_delete=models.CASCADE,
        related_name='history'
    )
    status = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Return histories'

    def __str__(self):
        return f"Status change to {self.status} for Return #{self.return_request.id}"


class ReturnPolicy(models.Model):
    return_window_days = models.IntegerField(
        default=3,
        help_text="Number of days after delivery within which returns are accepted"
    )
    requires_receipt = models.BooleanField(
        default=True,
        help_text="Whether returns require original order confirmation"
    )
    allow_partial_returns = models.BooleanField(
        default=True,
        help_text="Allow returning part of an order"
    )
    restocking_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Percentage fee charged for returns"
    )
    free_returns = models.BooleanField(
        default=True,
        help_text="Whether return shipping is free"
    )
    shipping_paid_by = models.CharField(
        max_length=20,
        choices=[('customer', 'Customer'), ('store', 'Store')],
        default='store',
        help_text="Who pays for return shipping"
    )
    return_instructions = models.TextField(
        blank=True,
        help_text="Instructions provided to customers for returns"
    )

    class Meta:
        verbose_name_plural = 'Return policies'

    def __str__(self):
        return f"Return Policy (Window: {self.return_window_days} days)"
    
    def save(self, *args, **kwargs):
        # Ensure only one global policy exists
        if not self.pk and ReturnPolicy.objects.exists():
            raise ValidationError("Only one global return policy can exist")
        super().save(*args, **kwargs)


class ProductReturnPolicy(models.Model):
    """Product-specific return policy overrides"""
    product = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='return_policy'
    )
    is_returnable = models.BooleanField(
        default=True,
        help_text="Whether this product can be returned"
    )
    return_window_days = models.IntegerField(
        null=True,
        blank=True,
        help_text="Override global return window for this product"
    )
    restocking_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Override global restocking fee for this product"
    )
    special_instructions = models.TextField(
        blank=True,
        help_text="Special return instructions for this product"
    )

    class Meta:
        verbose_name_plural = "Product Return Policies"

    def __str__(self):
        return f"Return Policy for {self.product.name}"
