from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Product, Category
from utils.cache import invalidate_product_cache, invalidate_category_cache


@receiver([post_save, post_delete], sender=Product)
def invalidate_product_caches(sender, instance, **Kwargs):
    """ Invalidate caches when a product is saved or deleted """
    invalidate_product_cache(instance.id)
    if instance.category:
        invalidate_category_cache(instance.category.id)


@receiver([post_save, post_delete], sender=Category)
def invalidate_category_caches(sender, instance, **kwargs):
    """ Invalidate caches when a category is saved or deleted """
    invalidate_category_cache(instance.id)
    # Also invalidate product caches as they might display category info
    for product in instance.products.all():
        invalidate_product_cache(product.id)