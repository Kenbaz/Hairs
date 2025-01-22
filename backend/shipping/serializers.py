# shipping/serializers.py

from rest_framework import serializers
from .models import ShippingRate
from currencies.utils import CurrencyConverter
from decimal import Decimal


class ShippingRateSerializer(serializers.ModelSerializer):
    """Serializer for the ShippingRate model"""
    class Meta:
        model = ShippingRate
        fields = [
            'id',
            'currency_code',
            'flat_rate',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_currency_code(self, value):
        """Ensure currency code exists in supported currencies"""
        currencies = CurrencyConverter.get_active_currencies()
        if value not in currencies:
            raise serializers.ValidationError(f"Currency {value} is not supported")
        return value.upper()


class ShippingCalculationSerializer(serializers.Serializer):
    """Serializer for shipping calculation endpoint"""
    currency =serializers.CharField(max_length=3)
    order_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.00')
    )

    def validate_currency(self, value):
        currencies = CurrencyConverter.get_active_currencies()
        if value not in currencies:
            raise serializers.ValidationError(f"Currency {value} is not supported")
        return value.upper()