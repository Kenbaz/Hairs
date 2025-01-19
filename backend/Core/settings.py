from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta
import sys
from decimal import Decimal


# Load environment variables
load_dotenv()


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG') == 'True'


ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')


# Application definition
INSTALLED_APPS = [
    'daphne',  # At the top for ASGI
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    'channels',
    'cloudinary_storage',
    'cloudinary',

    # Local apps
    'users',
    'products',
    'orders',
    'reviews',
    'cart',
    'currencies',
    'wishlist',
    'admin_api.apps.AdminApiConfig',
    'returns',
    'customer_support.apps.CustomerSupportConfig',
    'payments.apps.PaymentsConfig',
]


# Cloudinary Configuration
# CLOUDINARY_STORAGE = os.getenv('CLOUDINARY_URL')

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

# Media settings
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# Cloudinary folders configuration
CLOUDINARY_STORAGE_FOLDERS = {
    'PRODUCT_IMAGES': 'products',
    'EDITOR_IMAGES': 'editor_images',
    'EMAIL_ATTACHMENTS': 'email_attachments',
    'RETURN_IMAGES': 'returns',
}

# Paystack Configuration
PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY')

# Payment Configuration
PAYMENT_WEBHOOK_DOMAIN = os.getenv('PAYMENT_WEBHOOK_DOMAIN')


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development frontend
    os.getenv('FRONTEND_URL', 'https://yourdomain.com'),  # Production frontend
    "https://checkout.paystack.com",
    "https://standard.paystack.co",
]


CORS_ALLOW_CREDENTIALS = True


CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
]


CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


ROOT_URLCONF = 'Core.urls'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# WSGI/ASGI Configuration
WSGI_APPLICATION = 'Core.wsgi.application'
ASGI_APPLICATION = 'Core.asgi.application'


# Channel Layers Configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    } if 'test' in sys.argv else {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
        # "CONFIG": {
        #     "hosts": [(os.getenv('REDIS_HOST', 'localhost'), 6379)],
        #     "capacity": 1500,
        #     "expiry": 60,
        #     "channel_capacity": {
        #         "http.request": 100,
        #         "http.response!*": 100,
        #         "websocket.send!*": 100,
        #     },
        # }
    }
}


# Cache Configuration
if 'test' in sys.argv:
    PAYSTACK_SECRET_KEY = 'test_secret_key'
    # Use local memory cache for testing
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }
    SESSION_ENGINE = 'django.contrib.sessions.backends.db'
else:
    # Use Redis cache for development and production
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'PASSWORD': os.getenv('REDIS_PASSWORD', None),
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                'CONNECTION_POOL_CLASS': 'redis.BlockingConnectionPool',
                'CONNECTION_POOL_CLASS_KWARGS': {
                    'max_connections': 50,
                    'timeout': 20,
                }
            },
            'TIMEOUT': 3600,
        },
        'session': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/2'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'PASSWORD': os.getenv('REDIS_PASSWORD', None),
            }
        }
    }
    SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_CACHE_ALIAS = 'session'


# Cache Keys and Timeouts
CACHE_KEYS = {
    'PRODUCT_DETAIL': 'product_detail_{}',
    'PRODUCT_LIST': 'product_list_{}',
    'CATEGORY_DETAIL': 'category_detail_{}',
    'CATEGORY_LIST': 'category_list_{}',
    'FEATURED_PRODUCTS': 'featured_products',
}


CACHE_TIMEOUTS = {
    'PRODUCT': 3600,      # 1 hour
    'CATEGORY': 86400,    # 24 hours
    'FEATURED': 1800,     # 30 minutes
    'SEARCH': 300,        # 5 minutes
}


# Database Configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5433'),
    }
}


# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
    'DEFAULT_VERSION': 'v1',
    'ALLOWED_VERSIONS': ['v1'],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
    },
}


# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL')


# URLs and Admin
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
ADMIN_EMAIL = 'affiong32@gmail.com'


# Authentication
AUTH_USER_MODEL = 'users.User'


# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Supported Currencies Configuration
SUPPORTED_CURRENCIES = {
    'USD': {
        'name': 'US Dollar',
        'symbol': '$',
        'is_base': True
    },
    'NGN': {
        'name': 'Nigerian Naira',
        'symbol': '₦',
        'is_base': False
    },
    'GHS': {
        'name': 'Ghanaian Cedis',
        'symbol': 'GH₵',
        'is_base': False
    },
    'ZAR': {
        'name': 'South African Rand',
        'symbol': 'R',
        'is_base': False
    },
    'KES': {
        'name': 'Kenyan Shillings',
        'symbol': 'KSh',
        'is_base': False
    }
}


# Payment Settings
# Minimum amount in base currency (USD)
MINIMUM_PAYMENT_AMOUNT = Decimal('100.00')
PAYMENT_EXPIRY_MINUTES = 30  # Payment expires after 30 minutes
PAYMENT_RETRY_LIMIT = 3  # Maximum payment retry attempts

# Webhook Configuration
WEBHOOK_TOLERANCE_SECONDS = 300  # 5 minutes tolerance for webhook timestamps

# Payment URLs (update with your frontend routes)
PAYMENT_SUCCESS_URL = f"{PAYMENT_WEBHOOK_DOMAIN}/payment/success"
PAYMENT_ERROR_URL = f"{PAYMENT_WEBHOOK_DOMAIN}/payment/error"
PAYMENT_CANCEL_URL = f"{PAYMENT_WEBHOOK_DOMAIN}/payment/cancel"


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static and Media Files
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static')
]

EDITOR_IMAGES_PATH = os.path.join(MEDIA_ROOT, 'editor_images')
os.makedirs(EDITOR_IMAGES_PATH, exist_ok=True)


# File upload settings
FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]


# Maximum upload size (5MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880

# Allowed image types
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']


# Default Auto Field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'channels': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
