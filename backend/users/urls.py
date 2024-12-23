# users/urls.py

from django.urls import path
from rest_framework_simplejwt.views import (TokenObtainPairView, TokenRefreshView)
from . import views


urlpatterns = [
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
     path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('reset-password/', views.ResetPasswordEmailView.as_view(), name='reset-password'),
    path('reset-password-confirm/', 
         views.ResetPasswordConfirmView.as_view(), 
         name='reset-password-confirm'),
    path('send-verification-email/', 
         views.SendVerificationEmailView.as_view(), 
         name='send-verification-email'),
    path('verify-email/', 
         views.VerifyEmailView.as_view(), 
         name='verify-email'),

    # Profile endpoints 
    path('profile/', views.ProfileView.as_view(), name='profile')
]