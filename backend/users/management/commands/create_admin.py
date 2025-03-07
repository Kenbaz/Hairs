import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Create a superuser if it does not exist'

    def handle(self, *args, **options):
        User = get_user_model()

        # Get credentials from environment variables
        email = os.getenv('SUPERUSER_EMAIL')
        password = os.getenv('SUPERUSER_PASSWORD')

        if not email or not password:
            self.stdout.write(self.style.WARNING(
                'Superuser email or password not set in environment variables'))
            return

        # Check if superuser already exists
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                email=email,
                password=password,
            )
            self.stdout.write(self.style.SUCCESS(
                f'Superuser {email} created successfully'))
        else:
            self.stdout.write(self.style.WARNING(
                f'Superuser {email} already exists'))
