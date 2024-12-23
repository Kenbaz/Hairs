# reveiws/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator



class Review(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    product = models.ForeignKey(
        'products.Product',
        related_name='reviews',
        on_delete=models.CASCADE
    )
    rating = models.IntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )
    comment = models.TextField()
    verified_purchase = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'product']  # one review per user per product


    def __str__(self):
        return f"{self.user.username}'s review for {self.product.name}"


    def save(self, *args, **kwargs):
        # Check for verified purchase before saving
        if not self.pk:  # Only check on creation
            self.verified_purchase = self.user.order_set.filter(
                items__product=self.product,
                order_status='delivered'
            ).exists()
        super().save(*args, **kwargs)