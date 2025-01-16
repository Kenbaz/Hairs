# products/admin.py

from django.contrib import admin
from .models import Category, Product, ProductImage, StockHistory, FlashSale, FlashSaleProduct, FlashSalePurchase
from django.utils import timezone
from django.db.models import Sum, Count
from django.utils.html import format_html


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class StockHistoryInline(admin.TabularInline):
    model = StockHistory
    extra = 0
    readonly_fields = [
        'transaction_type', 'quantity_changed', 'previous_stock',
        'new_stock', 'reference_order', 'created_at', 'created_by'
    ]
    can_delete = False
    max_num = 0
    ordering = ['-created_at']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'is_featured', 'created_at']
    list_filter = ['category', 'price', 'is_featured', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
    list_editable = ['price', 'stock', 'is_featured']
    inlines = [ProductImageInline, StockHistoryInline]


    def save_model(self, request, obj, form, change):
        if change and 'stock' in form.changed_data:
            # Get the original product before changes
            old_product = Product.objects.get(pk=obj.pk)
            old_stock = old_product.stock
            new_stock = obj.stock
            stock_change = new_stock - old_stock

            super().save_model(request, obj, form, change)

            # Create stock history record for manual adjustment
            StockHistory.objects.create(
                product=obj,
                transaction_type='adjustment',
                quantity_changed=stock_change,
                previous_stock=old_stock,
                new_stock=new_stock,
                notes='Manual stock adjustment for admin panel',
                created_by=request.user
            )
        else:
            super().save_model(request, obj, form, change)
    

    def delete_model(self, request, obj):
        # Clean up associated images before deleting the product
        for image in obj.images.all():
            if image.image:
                image.image.close()
        super().delete_model(request, obj)


@admin.register(StockHistory)
class StockHistoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'transaction_type', 'quantity_changed', 
                   'previous_stock', 'new_stock', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['product__name', 'notes']
    readonly_fields = ['product', 'transaction_type', 'quantity_changed',
                      'previous_stock', 'new_stock', 'reference_order',
                      'created_at', 'created_by']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class FlashSaleProductInline(admin.TabularInline):
    model = FlashSaleProduct
    min_num = 1
    extra = 0
    fields = ['product', 'quantity_limit', 'quantity_sold', 'original_price']
    readonly_fields = ['quantity_sold', 'original_price']
    autocomplete_fields = ['product']

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        # Only show products not in other active flash sales
        if obj is None:
            used_products = FlashSaleProduct.objects.filter(
                flash_sale__status='active'
            ).values_list('product_id', flat=True)
            formset.form.base_fields['product'].queryset = (
                formset.form.base_fields['product'].queryset
                .exclude(id__in=used_products)
            )
        return formset


class FlashSalePurchaseInline(admin.TabularInline):
    model = FlashSalePurchase
    readonly_fields = ['user', 'product', 'quantity',
                       'price_at_purchase', 'order', 'created_at']
    can_delete = False
    max_num = 0
    extra = 0
    ordering = ['-created_at']

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'status_badge',
        'discount_display',
        'start_time',
        'end_time',
        'total_sales',
        'created_by',
        'is_visible'
    ]
    list_filter = ['status', 'discount_type', 'is_visible']
    search_fields = ['name', 'description']
    readonly_fields = ['status', 'created_at', 'updated_at', 'created_by']
    inlines = [FlashSaleProductInline, FlashSalePurchaseInline]
    actions = ['activate_sales', 'deactivate_sales', 'cancel_sales']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_visible')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time')
        }),
        ('Discount Settings', {
            'fields': (
                'discount_type',
                'discount_value',
                'max_quantity_per_customer',
                'total_quantity_limit'
            )
        }),
        ('Status Information', {
            'fields': ('status', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            total_quantity_sold=Sum('sale_products__quantity_sold'),
            total_products=Count('products')
        )


    def status_badge(self, obj):
        colors = {
            'scheduled': 'blue',
            'active': 'green',
            'ended': 'gray',
            'cancelled': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 10px; border-radius: 10px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'


    def discount_display(self, obj):
        if obj.discount_type == 'percentage':
            return f'{obj.discount_value}% off'
        return f'${obj.discount_value} off'
    discount_display.short_description = 'Discount'


    def total_sales(self, obj):
        if hasattr(obj, 'total_quantity_sold'):
            return obj.total_quantity_sold or 0
        return 0
    total_sales.short_description = 'Total Items Sold'


    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)

        # Handle deletions
        for obj in formset.deleted_objects:
            obj.delete()

        # Handle additions/updates
        for instance in instances:
            if isinstance(instance, FlashSaleProduct):
                if not instance.pk:  # New instance
                    if not instance.quantity_limit:
                        instance.quantity_limit = instance.product.stock
            instance.save()
        formset.save_m2m()


    @admin.action(description='Activate selected flash sales')
    def activate_sales(self, request, queryset):
        now = timezone.now()
        valid_sales = queryset.filter(
            start_time__lte=now,
            end_time__gt=now,
            status='scheduled'
        )
        updated = valid_sales.update(status='active')

        if updated:
            self.message_user(
                request,
                f'Successfully activated {updated} flash sales.'
            )
        else:
            self.message_user(
                request,
                'No flash sales were eligible for activation.',
                level='WARNING'
            )


    @admin.action(description='Deactivate selected flash sales')
    def deactivate_sales(self, request, queryset):
        updated = queryset.filter(status='active').update(status='ended')
        if updated:
            self.message_user(
                request,
                f'Successfully ended {updated} flash sales.'
            )


    @admin.action(description='Cancel selected flash sales')
    def cancel_sales(self, request, queryset):
        non_ended = queryset.exclude(status='ended')
        updated = non_ended.update(status='cancelled')
        if updated:
            self.message_user(
                request,
                f'Successfully cancelled {updated} flash sales.'
            )

    class Media:
        css = {
            'all': ['admin/css/widgets.css']
        }
        js = ['admin/js/vendor/jquery/jquery.js', 'admin/js/jquery.init.js']
