from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r'reviews', views.ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'products/<int:product_id>/review-stats/',
        views.ProductReviewStatsView.as_view(),
        name='product-review-stats'
    ),
]