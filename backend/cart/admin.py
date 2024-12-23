# cart/admin.py

from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1
    readonly_fields = ('price_at_add', 'subtotal', 'created_at', 'updated_at')
    fields = ('product', 'quantity', 'price_at_add', 'subtotal', 'created_at', 'updated_at')
    can_delete = True
    show_change_link = True


    def subtotal(self, obj):
        return obj.subtotal if obj.pk else '-'
    subtotal.short_description = 'Subtotal'



@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'user_info', 
        'item_count', 
        'total_amount', 
        'created_at', 
        'updated_at'
    )
    list_filter = ('created_at', 'updated_at')
    search_fields = (
        'user__email', 
        'user__username', 
        'session_id',
        'items__product__name'
    )
    readonly_fields = ('created_at', 'updated_at', 'total_amount')
    inlines = [CartItemInline]
    fieldsets = (
        ('Cart Information', {
            'fields': (
                'user',
                'session_id',
                'total_amount',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )

    def user_info(self, obj):
        if obj.user:
            return f"{obj.user.email} (User)"
        return f"{obj.session_id} (Session)"
    user_info.short_description = 'User/Session'

    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Number of Items'



@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'cart_info',
        'product',
        'quantity',
        'price_at_add',
        'subtotal',
        'created_at'
    )
    list_filter = (
        'created_at',
        'updated_at',
        'product'
    )
    search_fields = (
        'cart__user__email',
        'cart__session_id',
        'product__name'
    )
    readonly_fields = ('subtotal', 'created_at', 'updated_at')
    fieldsets = (
        ('Item Information', {
            'fields': (
                'cart',
                'product',
                'quantity',
                'price_at_add',
                'subtotal',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )


    def cart_info(self, obj):
        if obj.cart.user:
            return f"Cart #{obj.cart.id} - {obj.cart.user.email}"
        return f"Cart #{obj.cart.id} - Session: {obj.cart.session_id}"
    cart_info.short_description = 'Cart'


    def subtotal(self, obj):
        return obj.subtotal if obj.pk else '-'
    subtotal.short_description = 'Subtotal'
