# shipping/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from .models import ShippingRate
from .serializers import ShippingRateSerializer, ShippingCalculationSerializer
from decimal import Decimal
from django.conf import settings


class ShippingRateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for shipping rates
    """
    serializer_class = ShippingRateSerializer
    permission_classes = [AllowAny]  # Public endpoint, no auth required

    def get_queryset(self):
        return ShippingRate.objects.filter(is_active=True)

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate shipping fee for given currency and order amount"""
        serializer = ShippingCalculationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        currency = serializer.validated_data['currency']
        order_amount = serializer.validated_data['order_amount']

        # Get shipping rate for the currency
        try:
            shipping_rate = ShippingRate.objects.get(
                currency_code=currency,
                is_active=True
            )
            shipping_fee = shipping_rate.flat_rate
        except ShippingRate.DoesNotExist:
            # Default shipping fee if rate not found
            shipping_fee = 0

        response_data = {
        'currency': currency,
        'order_amount': order_amount,
        'shipping_fee': shipping_fee,
        'total_amount': order_amount + shipping_fee,
        }
    
        return Response(response_data)
