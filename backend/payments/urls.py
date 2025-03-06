# payments/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'payments', views.PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'initialize/',
        views.InitializePaymentView.as_view(),
        name='initialize-payment'
    ),
    path(
        'verify/',
        views.VerifyPaymentView.as_view(),
        name='verify-payment'
    ),
    path(
        'webhook/',
        views.PaystackWebhookView.as_view(),
        name='paystack-webhook'
    ),
    path(
        'methods/',
        views.PaymentMethodView.as_view(),
        name='payment-methods'
    ),
    path(
        'refund/<int:payment_id>/',
        views.RefundPaymentView.as_view(),
        name='refund-payment'
    ),
]
