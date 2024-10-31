from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product
from .serializers import (CategorySerializer, ProductListSerializer, ProductDetailsSerializer)
from .pagination import ProductPagination


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ Viewset for listing and retrieving product categories """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'


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
        'price': ['gte', 'lte'],
        'is_featured': ['exact']
    }
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']
    ordering = ['-created_at']


    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailsSerializer
    
    
    @action(detail=False)
    def featured(self, request):
        """ Endpoint for fetching featured products """

        featured_products = self.get_queryset().filter(is_featured=True)
        page = self.paginate_queryset(featured_products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(featured_products, many=True)
        return Response(serializer.data)