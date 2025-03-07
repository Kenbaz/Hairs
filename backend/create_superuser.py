from django.contrib.auth import get_user_model
import os
import django
from django.core.management import call_command

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Core.settings')
django.setup()


def create_superuser():
    User = get_user_model()
    email = os.getenv('SUPERUSER_EMAIL')
    password = os.getenv('SUPERUSER_PASSWORD')

    if not User.objects.filter(email=email).exists():
        User.objects.create_superuser(
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True
        )
        print(f"Superuser {email} created successfully")
    else:
        print(f"Superuser {email} already exists")


if __name__ == '__main__':
    create_superuser()
