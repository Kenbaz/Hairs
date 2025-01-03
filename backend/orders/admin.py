# orders/admin.py

from django.contrib import admin
from .models import Order, OrderItem, OrderHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1


class OrderHistoryInline(admin.TabularInline):
    model = OrderHistory
    extra = 0
    readonly_fields = ['created_at', 'created_by']
    can_delete = False
    ordering = ['-created_at']


@admin.register(OrderHistory)
class OrderHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'order',
        'status',
        'created_by',
        'created_at'
    ]
    list_filter = [
        'status',
        'created_at'
    ]
    search_fields = [
        'order__id',
        'notes'
    ]
    readonly_fields = [
        'created_at',
        'created_by'
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_amount', 'order_status', 'payment_status', 'created_at']
    list_filter = ['order_status', 'payment_status', 'created_at']
    search_fields = ['user__username', 'user__email', 'tracking_number']
    inlines = [OrderItemInline]
