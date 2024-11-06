from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json


def generate_cache_key(prefix, *args, **kwargs):
    """ Generate a cache key based on prefix and parameters """
    # Convert kwargs to sorted list of tuples to ensure consistent ordering
    kwargs_str = json.dumps(sorted(kwargs.items()), sort_keys=True)

    # Create a string combining all arguments
    key_input = f"{prefix}:{':'.join(map(str, args))}:{kwargs_str}"

    # Generate MDS has of the input string
    hash_obj = hashlib.md5(key_input.encode())
    hash_str = hash_obj.hexdigest()

    return f"{prefix}:{hash_str}"


def cache_response(timeout=None, key_prefix=None):
    """ Decorator for caching DRF view responses """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_views(self, request, *args, **kwargs):
            # Generate cache key
            if key_prefix:
                prefix = key_prefix
            else:
                prefix = f"{self.__class__.__name__}:{view_func.__name__}"
            
            # Include query parameters in cache key
            cache_key = generate_cache_key(
                prefix,
                request.get_full_path(),
                request.user.is_authenticated
            )

            # Try to get cached response 
            cache_response = cache.get(cache_key)
            if cache_response is not None:
                return cache_response
            
            # Generate response if not cached
            response = view_func(self, request, *args, **kwargs)

            # Cache the response 
            cache.set(cache_key, response, timeout or settings.CACHE_TIMEOUTS['PRODUCT'])

            return response
        return _wrapped_views
    return decorator


def invalidate_product_cache(product_id):
    """ Invalidate all caches related to a product """
    # Clear product list caches
    for key in cache.keys('product_list_*'):
        cache.delete(key)
    
    # Clear featured products cache
    cache.delete(settings.CACHE_KEYS['FEATURED_PRODUCTS'])


def invalidate_category_cache(category_id=None):
    """ Invalidate category-related caches """
    # Clear specific category cache if ID provided
    if category_id:
        cache.delete(settings.CACHE_KEYS['CATEGORY_DETAIL'].format(category_id))
    
    # Clear category list cache
    cache.delete(settings.CACHE_KEYS['CATEGORY_LIST'])

    # Clear product list caches as they might be filtered by category
    for key in cache.keys('product_lists_*'):
        cache.delete(key)