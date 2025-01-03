# returns/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'customer/returns', views.CustomerReturnViewset,
                basename='customer-return')
router.register(r'return-policies', views.ReturnPolicyViewSet,
                basename='return-policy')

urlpatterns = [
    path('', include(router.urls)),
]
