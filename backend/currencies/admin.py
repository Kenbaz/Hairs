# currencies/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.core.cache import cache
from .models import Currency


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = (
        'code',
        'name',
        'symbol_preview',
        'exchange_rate_display',
        'usd_conversion_preview',
        'is_active',
        'last_updated'
    )
    list_filter = ('is_active', 'last_updated')
    search_fields = ('code', 'name')
    readonly_fields = ('last_updated',)
    ordering = ('code',)
    
    fieldsets = (
        ('Currency Information', {
            'fields': (
                'code',
                'name',
                'symbol',
                'exchange_rate',
                'is_active',
            )
        }),
        ('Timestamp', {
            'fields': ('last_updated',),
            'classes': ('collapse',)
        }),
    )
    

    def symbol_preview(self, obj):
        """Display currency symbol with example"""
        return format_html(
            '<span style="font-size: 1.2em;">{} <small style="color: #666;">({}100)</small></span>',
            obj.symbol,
            obj.symbol
        )
    symbol_preview.short_description = 'Symbol'


    def exchange_rate_display(self, obj):
        """Display exchange rate with USD reference"""
        if obj.code == 'USD':
            return 'Base Currency (1.00)'
        return format_html(
            '1 USD = {} {}',
            obj.exchange_rate,
            obj.code
        )
    exchange_rate_display.short_description = 'Exchange Rate'


    def usd_conversion_preview(self, obj):
        """Show example conversion from USD"""
        if obj.code == 'USD':
            return '-'
        amount = 100  # Example amount
        converted = amount * obj.exchange_rate
        return format_html(
            'USD ${} = {} {}<br><small style="color: #666;">({} {})</small>',
            amount,
            obj.symbol,
            round(converted, 2),
            obj.code,
            obj.name
        )
    usd_conversion_preview.short_description = 'Example (USD $100)'


    def save_model(self, request, obj, form, change):
        """Override save_model to clear cache when currency is updated"""
        super().save_model(request, obj, form, change)
        # Clear currency cache
        cache.delete('active_currencies')


    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of USD (base currency)"""
        if obj and obj.code == 'USD':
            return False
        return super().has_delete_permission(request, obj)
    

    def get_readonly_fields(self, request, obj=None):
        """Make code field readonly after creation"""
        if obj:  # editing an existing object
            return self.readonly_fields + ('code',)
        return self.readonly_fields
    

    class Media:
        css = {
            'all': (
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
            )
        }
        js = (
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js',
        )