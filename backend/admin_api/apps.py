from django.apps import AppConfig


class AdminApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_api'


    def ready(self):
        """ Import signals when app is ready """
        import admin_api.signals