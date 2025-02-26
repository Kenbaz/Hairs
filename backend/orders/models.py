# orders/models.py

from django.db import models
from django.utils import timezone
from django.conf import settings


class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    REFUND_STATUS_CHOICES = [
        ('none', 'No Refund'),
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]

    refund_status = models.CharField(
        max_length=20,
        choices=REFUND_STATUS_CHOICES,
        default='none'
    )
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)

    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    order_status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        default='pending'
    )
    payment_status = models.BooleanField(default=False)
    tracking_number = models.CharField(max_length=100, blank=True)
    shipping_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Shipping fee at the time of order"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order #{self.id}"
    

    def cancel_order(self, user):
        if self.order_status not in ['pending', 'processing']:
            raise ValueError("Order cannot be cancelled")
        
        self.order_status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.refund_status = 'pending'
        self.refund_amount = self.total_amount
        self.save()

        # Create order history entry
        OrderHistory.objects.create(
            order=self,
            status='cancelled',
            notes=f"Order cancelled by {user.email}",
            created_by=user
        )
    

    def update_stock_on_status_change(self):
        """ Update product stock based on order status change """
        if self.order_status == 'cancelled' and self.original_status != 'cancelled':
            # Restore stock for cancelled orders
            for item in self.items.all():
                item.product.update_stock(
                    quantity_changed=item.quantity,
                    transaction_type='cancel',
                    order=self,
                    notes=f"Stock restored from cancelled order #{self.id}"
                )
        elif self._origignal_status == 'cancelled' and self.order_status != 'cancelled':
            # Reduce stock if order is not cancelled
            for item in self.items.all():
                item.product.update_stock(
                    quantity_changed=item.quantity,
                    transaction_type='order',
                    order=self,
                    notes=f"Stock reduced from reactivated order #{self.id}"
                )


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        related_name='items',
        on_delete=models.CASCADE
    )
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ['order', 'product']


    def __str__(self):
        return f"{self.quantity}x {self.product.name} in Order #{self.order.id}"


class OrderHistory(models.Model):
    order = models.ForeignKey(
        'Order',
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
        verbose_name_plural = 'Order histories'

    def __str__(self):
        return f"Status change to {self.status} for Order #{self.order.id}"