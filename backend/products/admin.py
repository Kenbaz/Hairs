from django.contrib import admin
from .models import Category, Product, ProductImage, StockHistory


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