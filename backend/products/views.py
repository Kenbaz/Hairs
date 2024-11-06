from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product
from .serializers import (CategorySerializer, ProductListSerializer, ProductDetailsSerializer)
from .pagination import ProductPagination
from currencies.utils import convert_price
from decimal import Decimal
from django.conf import settings
from utils.cache import cache_response
from rest_framework.decorators import action


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ Viewset for listing and retrieving product categories """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    @cache_response(
        timeout=settings.CACHE_TIMEOUTS['CATEGORY'],
        key_prefix='category_list'
    )
    def list_cached(self, request, *args, **kwargs):
        return super().list_cached(request, *args, **kwargs)
    
    @cache_response(
        timeout=settings.CACHE_TIMEOUTS['CATEGORY'],
        key_prefix='category_detail'
    )
    def retrieve_cached(self, request, *args, **kwargs):
        return super().retrieve_cached(request, *args, **kwargs)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """ View set for listing and retrieving products """
    queryset = Product.objects.filter(is_available=True)
    pagination_class = ProductPagination
    lookup_field = 'slug'
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_fields = {
        'category__slug': ['exact'],
        'hair_type': ['exact'],
        'length': ['gte', 'lte'],
        'is_featured': ['exact']
    }
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']
    ordering = ['-created_at']


    @cache_response(timeout=settings.CACHE_TIMEOUTS['PRODUCT'])
    def retrieve_cache_products(self, request, *args, **kwargs):
        return super().retrieve_cache_products(request, *args, **kwargs)
    

    @cache_response(
            timeout=settings.CACHE_TIMEOUTS['PRODUCT'],
            key_prefix='product_list'
    )
    def list_cached(self, request, *args, **kwargs):
        return super().list_cached(request, *args, **kwargs)
    

    @action(detail=False)
    @cache_response(
        timeout=settings.CACHE_TIMEOUTS['SEARCH'],
        key_prefix='instant_search'
    )
    def instant_search(self, request):
        """ Endpoint for instant search with minimal data """
        query = request.query_params.get('query', '')
        if len(query) < 3:
            return Response([])
        
        queryset = self.get_queryset().filter(name__icontains=query)[:10] # Limit to 10 results

        # Using a minimal serializer for performance
        data = [{
            'id': product.id,
            'name': product.name,
            'slug': product.slug,
            'primary_image': {
                'image': product.images.filter(is_primary=True).first().image.url if product.images.filter(is_primary=True).exists() else None
            }
        } for product in queryset]

        return Response(data)


    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailsSerializer
    

    def get_queryset(self):
        queryset = super().get_queryset()

        # Handle price filtering in the requested currency
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        currency = self.request.query_params.get('currency', 'USD')

        if min_price or max_price:
            # Convert filter prices from requested currency to USD for database filtering
            if min_price:
                min_priced_usd = convert_price(
                    Decimal(min_price),
                    from_currency=currency,
                    to_currency='USD'
                )
                queryset = queryset.filter(price__gte=min_priced_usd)
            

            if max_price:
                max_price_usd = convert_price(
                    Decimal(max_price), 
                    from_currency=currency, 
                    to_currency='USD'
                )
                queryset = queryset.filter(price__lte=max_price_usd)
        
        return queryset
    
    
    @action(detail=False)
    @cache_response(
        timeout=settings.CACHE_TIMEOUTS['FEATURED'],
        key_prefix='featured_products'
    )
    def featured(self, request):
        """ Endpoint for fetching featured products """

        featured_products = self.get_queryset().filter(is_featured=True)
        page = self.paginate_queryset(featured_products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(featured_products, many=True)
        return Response(serializer.data)