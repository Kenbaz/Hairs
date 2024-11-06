from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from .models import Review
from .serializers import ReviewSerializer, ProductReviewsSerializer
from products.models import Product


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    

    def get_queryset(self):
        queryset = Review.objects.all()

        # Filter by product if product_id is provided
        product_id = self.request.query_params.get('product_id', None)
        if product_id is not None:
            queryset = queryset.filter(product_id=product_id)

        # Filter by verified purchases
        verified_only = self.request.query_params.get('verified_only', False)
        if verified_only:
            queryset = queryset.filter(verified_purchase=True)

        # Filter by rating
        rating = self.request.query_params.get('rating', None)
        if rating is not None:
            queryset = queryset.filter(rating=rating)

        return queryset.order_by('-created_at')
    

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {'error': 'You can only edit your own reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {"error": "You can only delete your own reviews"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    

class ProductReviewStatsView(generics.RetrieveAPIView):
    serializer_class = ProductReviewsSerializer

    def get_object(self):
        product_id = self.kwargs['product_id']
        product = get_object_or_404(Product, id=product_id)


        # Get reveiw statistics
        reviews = Review.objects.filter(product=product)
        total_reviews = reviews.count()
        average_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0


        # Get rating distribution
        rating_distribution = {
            str(i): reviews.filter(rating=i).count()
            for i in range(1, 6)
        }

        return {
            'total_reviews': total_reviews,
            'average_rating': round(average_rating, 1),
            'rating_distribution': rating_distribution
        }