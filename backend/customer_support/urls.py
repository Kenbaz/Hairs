# customer_support/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'emails', views.CustomerEmailViewSet,
                basename='customer-email')
router.register(r'email-templates', views.EmailTemplateViewSet,
                basename='email-template')

urlpatterns = [
    path('', include(router.urls)),
]
