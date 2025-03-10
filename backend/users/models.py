# users/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
from cloudinary_storage.storage import MediaCloudinaryStorage
from utils.cloudinary_utils import CloudinaryUploader

class CustomUserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        
        # Remove username from extra_fields if present
        extra_fields.pop('username', None)

        # Generate a unique username based on email
        username = self.generate_unique_username(email)
        
        user = self.model(
            email = self.normalize_email(email),
            username=username,
            first_name = first_name,
            last_name = last_name,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def generate_unique_username(self, email):
        # Create a base username from email
        base_username = email.split('@')[0]
        username = base_username

        # Ensure username is unique
        counter = 1
        while self.model.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        return username


    def create_superuser(self, first_name, last_name, email, password=None):
        user = self.create_user(
            email = self.normalize_email(email),
            password = password,
            first_name = first_name,
            last_name = last_name,
        )
        user.is_admin = True
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractUser):
    # Basic Information
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    username = models.CharField(
        max_length=150,
        unique=True,
        null=True,
        blank=True
    )
    email = models.EmailField(max_length=100, unique=True)
    phone_number = models.CharField(max_length=15, blank=True)
    verified_email = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(
        upload_to=settings.CLOUDINARY_STORAGE_FOLDERS['AVATARS'],
        storage=MediaCloudinaryStorage(),
        null=True,
        blank=True
    )
    avatar_public_id = models.CharField(max_length=200, blank=True, null=True)


    # Shipping Information
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    postal_code = models.CharField(max_length=20, blank=True)


    # always required when creating a custom user
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [ 'first_name', 'last_name']

    class Meta:
        ordering = ['-date_joined']

    
    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return True
    
    def delete_avatar(self):
        if self.avatar_public_id:
            CloudinaryUploader.delete_files(self.avatar_public_id)
            self.avatar = None
            self.avatar_public_id = ''
            self.save()
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
