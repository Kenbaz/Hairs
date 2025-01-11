# customer_support/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import CustomerEmail, EmailTemplate, EmailAttachment, EmailMetrics


class EmailAttachmentInline(admin.TabularInline):
    model = EmailAttachment
    extra = 1
    readonly_fields = ['created_at']


class EmailMetricsInline(admin.StackedInline):
    model = EmailMetrics
    can_delete = True
    readonly_fields = ['opened_at', 'opened_count',
                       'response_time', 'bounced', 'bounce_reason']
    classes = ['collapse']


@admin.register(CustomerEmail)
class CustomerEmailAdmin(admin.ModelAdmin):
    list_display = [
        'subject',
        'customer_info',
        'status',
        'priority',
        'sent_at',
        'response_metrics'
    ]
    list_filter = [
        'status',
        'priority',
        'created_at',
        'sent_at'
    ]
    search_fields = [
        'subject',
        'body',
        'to_email',
        'customer__email',
        'customer__first_name',
        'customer__last_name',
        'thread_id'
    ]
    readonly_fields = ['created_at', 'sent_at']
    inlines = [EmailAttachmentInline, EmailMetricsInline]
    fieldsets = (
        ('Email Information', {
            'fields': (
                'subject',
                'body',
                'from_email',
                'to_email',
                'thread_id',
            )
        }),
        ('Status & Priority', {
            'fields': (
                'status',
                'priority',
            )
        }),
        ('Relations', {
            'fields': (
                'customer',
                'admin_user',
                'related_order',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'sent_at',
            ),
            'classes': ('collapse',)
        }),
    )

    def has_delete_permission(self, request, obj=None):
        return True

    def customer_info(self, obj):
        if obj.customer:
            return format_html(
                '<div>{} {}</div><div class="text-xs">{}</div>',
                obj.customer.first_name,
                obj.customer.last_name,
                obj.customer.email
            )
        return '-'
    customer_info.short_description = 'Customer'

    def response_metrics(self, obj):
        try:
            metrics = obj.metrics
            if metrics.response_time:
                hours = metrics.response_time.total_seconds() / 3600
                return f"{hours:.1f} hours"
            return '-'
        except EmailMetrics.DoesNotExist:
            return '-'
    response_metrics.short_description = 'Response Time'


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'subject',
        'created_by',
        'is_active',
        'updated_at'
    ]
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['name', 'subject', 'body']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Template Information', {
            'fields': (
                'name',
                'subject',
                'body',
                'variables',
                'is_active',
            )
        }),
        ('Metadata', {
            'fields': (
                'created_by',
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # If creating new template
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(EmailMetrics)
class EmailMetricsAdmin(admin.ModelAdmin):
    list_display = [
        'email',
        'opened_count',
        'opened_at',
        'response_time',
        'bounced'
    ]
    list_filter = ['bounced', 'opened_at']
    search_fields = [
        'email__subject',
        'email__to_email',
        'bounce_reason'
    ]
    readonly_fields = [
        'email',
        'opened_at',
        'opened_count',
        'response_time',
        'bounced',
        'bounce_reason'
    ]

    def has_add_permission(self, request):
        return False  # Metrics are created automatically

    def has_delete_permission(self, request, obj=None):
        return True  # Prevent manual deletion
