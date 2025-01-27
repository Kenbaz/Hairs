# users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    list_display = (
        'email',  
        'get_full_name',
        'country',
        'city',
        'is_active',
        'date_joined'
    )

    readonly_fields = ('last_login', 'date_joined')

    list_display_links = ('email', 'get_full_name')
    
    list_filter = (
        'is_active',
        'is_staff',
        'is_superuser',
        'country',
        'city',
        'date_joined'
    )
    
    search_fields = (
        'email',
        'first_name',
        'last_name',
        'phone_number',
        'city',
        'country'
    )
    
    ordering = ('-date_joined',)
    
    fieldsets = (
        ('Login Information', {
            'fields': ('email', 'password')
        }),
        ('Personal Information', {
            'fields': (
                'first_name', 
                'last_name',
                'phone_number',
                'avatar',
                'avatar_public_id'
            )
        }),
        ('Address Information', {
            'fields': (
                'country',
                'city',
                'state',
                'address',
                'postal_code',
            )
        }),
        ('Account Verification', {
            'fields': (
                'verified_email',
                'email_verification_token',
            )
        }),
        ('Permissions', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'is_admin',
                'groups',
                'user_permissions'
            )
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'first_name',
                'last_name',
                'password1',
                'password2',
                'is_staff',
                'is_active',
                'is_superuser'
            ),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    get_full_name.short_description = 'Full Name'

admin.site.register(User, CustomUserAdmin)
admin.site.site_header = 'Miz Viv Hairs'
admin.site.site_title = 'Miz Viv Hairs Admin Portal'
admin.site.index_title = 'Welcome to Miz Viv Hairs Admin Portal'