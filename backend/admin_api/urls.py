#admin_api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import AdminNotificationViewSet

router = DefaultRouter()
router.register(r'analytics', views.DashboardViewSet,
                basename='admin-analytics')
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
router.register(r'returns', views.AdminReturnViewSet, basename='admin-returns')
router.register(r'return-policies', views.AdminReturnPolicyViewset,
                basename='admin-return-policy')
router.register(r'emails', views.AdminEmailViewSet, basename='admin-email')
router.register(r'email-templates', views.AdminEmailTemplateViewSet,
                basename='admin-template')
router.register(r'flash-sales', views.AdminFlashSaleViewSet,
                basename='admin-flash-sales')

urlpatterns = [
    path('', include(router.urls)),
    path('upload-image/', views.upload_editor_image, name='upload-editor-image'),
]