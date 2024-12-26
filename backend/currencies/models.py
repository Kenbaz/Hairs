# currencies/models.py

from django.db import models
from django.core.cache import cache
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.core.exceptions import ValidationError


class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True, help_text="Currency code (e.g., 'USD, NGN)") # e.g., USD, NGN
    name = models.CharField(max_length=50) # eg., Naira
    symbol = models.CharField(max_length=5) # eg., $
    exchange_rate = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        validators=[MinValueValidator(Decimal('0.000001'))],
        help_text="Exchange rate relative to USD (base currency)"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this currency is available for use")
    last_updated = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name_plural = 'Currencies'
        ordering = ['code']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active'])
        ]
    

    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def clean(self):
        """Validate the model"""
        super().clean()

        # Convert code to uppercase
        self.code = self.code.upper()

        # Validate code format
        if len(self.code) != 3:
            raise ValidationError(
                {'code': 'Currency code must be exactly 3 characters'})

        # USD is always active and has exchange rate 1.0
        if self.code == 'USD':
            self.is_active = True
            self.exchange_rate = Decimal('1.0')

        # Validate exchange rate
        if self.exchange_rate <= 0:
            raise ValidationError(
                {'exchange_rate': 'Exchange rate must be greater than 0'}
            )

        if self.exchange_rate < Decimal('0.000001'):
            raise ValidationError(
                {'exchange_rate': 'Exchange rate is too small'}
            )

        if self.exchange_rate > Decimal('999999'):
            raise ValidationError(
                {'exchange_rate': 'Exchange rate is too large'}
            )


    def save(self, *args, **kwargs):
        """Override save to handle cache invalidation"""
        self.full_clean()  # Run validation

        # Clear cache when currency is updated
        cache.delete('active_currencies')

        super().save(*args, **kwargs)
