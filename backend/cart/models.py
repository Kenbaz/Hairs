# cart/models.py

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Cart(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    session_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Session ID for anonymous users"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(user__isnull=False) |
                    models.Q(session_id__isnull=False)
                ),
                name="cart_must_have_user_or_session"
            )
        ]

    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.items.all())

    def __str__(self):
        return f"Cart {self.id} - {'User' if self.user else 'Session'}: {self.user or self.session_id}"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        related_name='items',
        on_delete=models.CASCADE
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    price_at_add = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price of the product when added to cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['cart', 'product']

    @property
    def subtotal(self):
        return self.quantity * self.price_at_add

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in Cart {self.cart.id}"
