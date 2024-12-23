#admin_api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import AdminNotificationViewSet

router = DefaultRouter()
router.register(r'dashboard', views.DashboardViewSet,
                basename='admin-dashboard')
router.register(r'products', views.AdminProductViewSet,
                basename='admin-products')
router.register(r'orders', views.AdminOrderViewSet, basename='admin-orders')
router.register(r'categories', views.AdminCategoryViewSet,
                basename='admin-categories')
router.register(r'users', views.AdminUserViewSet, basename='admin-users')
router.register(r'notifications', AdminNotificationViewSet,
                basename='admin-notifications')
router.register(r'currencies', views.AdminCurrencyViewSet,
                basename='admin-currency')

urlpatterns = [
    path('', include(router.urls)),
]