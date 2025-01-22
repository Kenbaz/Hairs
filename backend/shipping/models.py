# shipping/models.py

from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class ShippingRate(models.Model):
    """Store shipping rate for each currency/region"""
    currency_code = models.CharField(
        max_length=3,
        unique=True,
        help_text="Currency code representing the region (e.g. USD, NGN)"
    )
    flat_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Flat shipping rate in the region's currency"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this shipping rate is active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['currency_code']
        verbose_name = "Shipping Rate"
        verbose_name_plural = "Shipping Rates"
    
    def __str__(self):
        return f'Shipping Rate for {self.currency_code}'