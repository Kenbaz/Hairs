from admin_api.routing import websocket_urlpatterns
from admin_api.middleware import TokenAuthMiddleware
from channels.security.websocket import AllowedHostsOriginValidator
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Core.settings')

django.setup()


django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
