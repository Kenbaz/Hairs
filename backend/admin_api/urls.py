from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'dashboard', views.DashboardViewSet,
                basename='admin-dashboard')
router.register(r'products', views.AdminProductViewSet,
                basename='admin-products')
router.register(r'orders', views.AdminOrderViewSet, basename='admin-orders')
router.register(r'users', views.AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('', include(router.urls)),
]
