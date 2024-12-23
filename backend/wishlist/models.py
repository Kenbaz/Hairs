# wishlist/models.py

from django.db import models
from django.conf import settings


class Wishlist(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist'
    )
    products = models.ManyToManyField(
        'products.Product',
        through='WishlistItem',
        related_name='wishlists'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"Wishlist for {self.user.first_name} {self.user.last_name}"
    


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )
    added_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        unique_together = ['wishlist', 'product']
        ordering = ['-added_at']

    
    def __str__(self):
        return f"{self.product.name} in {self.wishlist.user.first_name} {self.wishlist.user.last_name}'s wishlist"
