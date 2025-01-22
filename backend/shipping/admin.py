# shipping/admin.py

from django.contrib import admin
from .models import ShippingRate


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = ['currency_code', 'flat_rate', 'is_active', 'created_at', 'updated_at']
    list_filter = ['currency_code', 'is_active', 'created_at']
    search_fields = ['currency_code']
    readonly_fields = ['created_at', 'updated_at']