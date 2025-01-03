from django.contrib import admin
from .models import Return, ReturnItem, ReturnImage, ReturnHistory, ReturnPolicy, ProductReturnPolicy


class ReturnImageInline(admin.TabularInline):
    model = ReturnImage
    extra = 1
    readonly_fields = ['created_at']


class ReturnItemInline(admin.TabularInline):
    model = ReturnItem
    extra = 1
    inlines = [ReturnImageInline]


class ReturnHistoryInline(admin.TabularInline):
    model = ReturnHistory
    extra = 0
    readonly_fields = ['created_at', 'created_by']
    can_delete = False
    ordering = ['-created_at']


@admin.register(Return)
class ReturnAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'order',
        'user',
        'return_status',
        'refund_status',
        'refund_amount',
        'created_at'
    ]
    list_filter = [
        'return_status',
        'refund_status',
        'created_at'
    ]
    search_fields = [
        'order__id',
        'user__email',
        'user__first_name',
        'user__last_name'
    ]
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ReturnItemInline, ReturnHistoryInline]
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'order',
                'user',
                'reason',
                'return_status',
            )
        }),
        ('Refund Information', {
            'fields': (
                'refund_status',
                'refund_amount',
            )
        }),
        ('Notes & Timestamps', {
            'fields': (
                'admin_notes',
                'created_at',
                'updated_at',
            )
        }),
    )

    def save_model(self, request, obj, form, change):
        if change and ('return_status' in form.changed_data or 'refund_status' in form.changed_data):
            # Create history entry for status changes
            notes = []
            if 'return_status' in form.changed_data:
                notes.append(f"Return status changed to: {obj.return_status}")
            if 'refund_status' in form.changed_data:
                notes.append(f"Refund status changed to: {obj.refund_status}")

            ReturnHistory.objects.create(
                return_request=obj,
                status=obj.return_status,
                notes='. '.join(notes),
                created_by=request.user
            )

        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ReturnItem)
class ReturnItemAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'return_request',
        'product',
        'quantity',
        'condition'
    ]
    list_filter = ['condition']
    search_fields = [
        'return_request__order__id',
        'product__name'
    ]
    inlines = [ReturnImageInline]


@admin.register(ReturnImage)
class ReturnImageAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'return_item',
        'created_at'
    ]
    list_filter = ['created_at']
    search_fields = [
        'return_item__return_request__order__id'
    ]
    readonly_fields = ['created_at']


@admin.register(ReturnHistory)
class ReturnHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'return_request',
        'status',
        'created_by',
        'created_at'
    ]
    list_filter = [
        'status',
        'created_at'
    ]
    search_fields = [
        'return_request__order__id',
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


@admin.register(ReturnPolicy)
class ReturnPolicyAdmin(admin.ModelAdmin):
    list_display = [
        'return_window_days',
        'free_returns',
        'shipping_paid_by',
        'restocking_fee_percentage'
    ]

    fieldsets = (
        ('Basic Settings', {
            'fields': (
                'return_window_days',
                'requires_receipt',
                'allow_partial_returns'
            )
        }),
        ('Cost Settings', {
            'fields': (
                'free_returns',
                'shipping_paid_by',
                'restocking_fee_percentage'
            )
        }),
        ('Instructions', {
            'fields': ('return_instructions',)
        })
    )


@admin.register(ProductReturnPolicy)
class ProductReturnPolicyAdmin(admin.ModelAdmin):
    list_display = ['product', 'is_returnable', 'return_window_days']
    list_filter = ['is_returnable']
    search_fields = ['product__name']
