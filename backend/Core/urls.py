from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('products.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/', include('orders.urls')),
    path('api/v1/', include('reviews.urls')),
    path('api/v1/', include('currencies.urls')),
    path('api/v1/', include('returns.urls')),
    path('api/v1/', include('cart.urls')),
    path('api/v1/', include('wishlist.urls')),
    path('api/v1/admin/', include('admin_api.urls')),
    path('api/v1/support/', include('customer_support.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
