from django.db import models
from django.core.cache import cache
from django.core.validators import MinValueValidator



class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True) # e.g., USD, NGN
    name = models.CharField(max_length=50) # eg., Naira
    symbol = models.CharField(max_length=5) # eg., $
    exchange_rate = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        validators=[MinValueValidator(0)],
        help_text="Exchange rate relative to USD (base currency)"
    )
    is_active = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name_plural = 'Currencies'
        ordering = ['code']
    

    def __str__(self):
        return f"{self.code} - {self.name}"
    

    def save(self, *args, **kwargs):
        # clear cache when exchange rate is updated
        cache.delete('active_currencies')
        super().save(*args, **kwargs)
