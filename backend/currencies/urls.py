# currencies/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'currencies', views.CurrencyViewSet, basename='currency')

urlpatterns = [
    path('', include(router.urls)),
]
