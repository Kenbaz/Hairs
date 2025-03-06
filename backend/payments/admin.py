# payments/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Payment, PaymentTransaction


class PaymentTransactionInline(admin.TabularInline):
    model = PaymentTransaction
    extra = 0
    readonly_fields = [
        'transaction_type',
        'amount',
        'status',
        'provider_reference',
        'response_data',
        'response_message',
        'created_by',
        'created_at'
    ]
    can_delete = False
    max_num = 0
    ordering = ['-created_at']

    def has_add_permission(self, request, obj):
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'reference',
        'order_link',
        'customer_info',
        'amount_display',
        'payment_currency',
        'status_badge',
        'payment_method',
        'created_at'
    ]
    list_filter = [
        'status',
        'payment_method',
        'payment_currency',
        'created_at',
    ]
    search_fields = [
        'reference',
        'provider_reference',
        'order__id',
        'order__user__email',
        'order__user__first_name',
        'order__user__last_name'
    ]
    readonly_fields = [
        'reference',
        'provider_reference',
        'paid_at',
        'expires_at',
        'created_at',
        'updated_at'
    ]
    inlines = [PaymentTransactionInline]
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Payment Information', {
            'fields': (
                'reference',
                'provider_reference',
                'order',
                'status',
                'payment_method',
                'error_message',
            )
        }),
        ('Amount Details', {
            'fields': (
                'amount',
                'original_amount',
                'payment_currency',
                'base_currency',
                'exchange_rate',
            )
        }),
        ('Timestamps', {
            'fields': (
                'paid_at',
                'expires_at',
                'created_at',
                'updated_at'
            )
        }),
        ('Additional Information', {
            'fields': ('meta_data',),
            'classes': ('collapse',)
        })
    )

    def order_link(self, obj):
        url = reverse('admin:orders_order_change', args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, f'Order #{obj.order.id}')
    order_link.short_description = 'Order'

    def customer_info(self, obj):
        customer = obj.order.user
        url = reverse('admin:users_user_change', args=[customer.id])
        return format_html(
            '<a href="{}">{}</a><br/><small>{}</small>',
            url,
            customer.get_full_name(),
            customer.email
        )
    customer_info.short_description = 'Customer'

    def amount_display(self, obj):
        amount = f"{obj.payment_currency} {obj.amount:,.2f}"
        if obj.original_amount != obj.amount:
            original = f"USD {obj.original_amount:,.2f}"
            return format_html(
                '{}<br/><small class="text-muted">({})</small>',
                amount,
                original
            )
        return amount
    amount_display.short_description = 'Amount'

    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'processing': 'blue',
            'success': 'green',
            'failed': 'red',
            'cancelled': 'gray',
            'refunded': 'purple'
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 10px; '
            'border-radius: 10px;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            # Create transaction record for status change
            PaymentTransaction.objects.create(
                payment=obj,
                transaction_type='status_change',
                status=obj.status,
                response_message=f'Status manually changed to {obj.status}',
                created_by=request.user
            )
        super().save_model(request, obj, form, change)

    class Media:
        css = {
            'all': ['admin/css/payment_admin.css']
        }


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'payment_reference',
        'transaction_type',
        'amount',
        'status',
        'created_by',
        'created_at'
    ]
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = [
        'payment__reference',
        'provider_reference',
        'response_message'
    ]
    readonly_fields = [
        'payment',
        'transaction_type',
        'amount',
        'status',
        'provider_reference',
        'response_data',
        'response_message',
        'created_by',
        'created_at'
    ]
    date_hierarchy = 'created_at'

    def payment_reference(self, obj):
        url = reverse('admin:payments_payment_change', args=[obj.payment.id])
        return format_html(
            '<a href="{}">{}</a>',
            url,
            obj.payment.reference
        )
    payment_reference.short_description = 'Payment'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
