from django.apps import AppConfig


class CustomerSupportConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'customer_support'


    def ready(self):
        """Import signals when app is ready"""
        import customer_support.signals
