from django.db import models


class Review(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    product = models.ForeignKey(
        'products.Product',
        related_name='reviews',
        on_delete=models.CASCADE
    )
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)]
    )
    comment = models.TextField()
    verified_purchase = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'product'] # one review per user per product
