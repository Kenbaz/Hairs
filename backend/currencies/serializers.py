# currencies/serializers.py

from rest_framework import serializers
from .models import Currency



class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['code', 'name', 'symbol', 'exchange_rate', 'is_active', 'last_updated']

        def validate_code(self, value):
            return value.upper()


class CurrencyConversionSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    from_currency = serializers.CharField(max_length=3)
    to_currency = serializers.CharField(max_length=3)