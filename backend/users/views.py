# users/views.py

from rest_framework import status, generics, serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UserRegisterSerializer, UserProfileSerializer, ChangePasswordSerializer, ResetPasswordEmailSerializer, ResetPasswordSerializer, EmailVerificationSerializer, AdminProfileSerializer
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .models import User
from rest_framework.permissions import IsAdminUser
from django.db import transaction
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from django.template.loader import render_to_string
from utils.cloudinary_utils import CloudinaryUploader
from django.template.loader import render_to_string
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = (AllowAny,)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user
    

class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = (IsAuthenticated,)

    def post(self, request):  # Changed from update to post
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check old password
        user = request.user
        if not user.check_password(serializer.validated_data.get('old_password')):
            return Response(
                {"old_password": "Wrong password."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data.get('new_password'))
        user.save()
        return Response(
            {"message": "Password updated successfully"},
            status=status.HTTP_200_OK
        )


class ResetPasswordEmailView(generics.GenericAPIView):
    serializer_class = ResetPasswordEmailSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            # Generate raw token without '-' since we'll add it later
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Create reset token
            reset_token = f"{uid}-{token}"  # Format: uid-token

            # Check is user is admin
            is_admin = user.is_staff or user.is_superuser
            base_path = 'admin' if is_admin else 'auth'

            # Construct reset URL with the combined token
            reset_url = f"{
                settings.FRONTEND_URL}/{base_path}/password-reset/{reset_token}"

            print(f"Debug - Reset URL: {reset_url}")  # Debug log

            # email context
            context = {
                'reset_url': reset_url,
                'year': timezone.now().year,
            }

            html_message = render_to_string('emails/password_reset.html', context)

            # Send email
            send_mail(
                subject='Reset your password - Miz Viv Hairs',
                message='',
                recipient_list=[email],
                from_email=settings.DEFAULT_FROM_EMAIL,
                html_message=html_message,
                fail_silently=False,
            )

            return Response(
                {"message": "Password reset email has been sent."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"message": "Password reset email has been sent."},
                status=status.HTTP_200_OK
            )
        


class ResetPasswordConfirmView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Invalid data provided.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get data from request
            uidb64 = request.data.get('uidb64')
            token = request.data.get('token')

            # Decode the uid
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            if default_token_generator.check_token(user, token):
                # Set the new password
                user.set_password(serializer.validated_data.get('password'))
                user.save()

                return Response(
                    {"message": "Password has been reset successfully."},
                    status=status.HTTP_200_OK
                )

            return Response(
                {"error": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            print(f"Password reset error: {str(e)}")  # Debug log
            return Response(
                {"error": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )


class SendVerificationEmailView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = request.user

        # Check if email is already verified
        if user.verified_email:
            return Response(
                {"message": "Email is already verified"},
                status=status.HTTP_200_OK
            )

        # Generate new verification token
        verification_token = get_random_string(64)
        user.email_verification_token = verification_token
        user.save()

        # Prepare email context
        verification_url = f"{
            settings.FRONTEND_URL}/verify-email/{verification_token}"
        context = {
            'user': user,
            'verification_url': verification_url,
            'site_name': 'Miz Viv Hairs',
            'valid_hours': 24  # Token valid for 24 hours
        }

        try:
            # Render both HTML and plain text versions
            html_message = render_to_string(
                'emails/verify_email.html', context)

            # Send email
            send_mail(
                subject='Verify your email address',
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

            return Response({
                "message": "Verification email sent successfully"
            })

        except Exception as e:
            # Log the error
            print(f"Failed to send verification email: {str(e)}")
            return Response(
                {"error": "Failed to send verification email"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyEmailView(generics.GenericAPIView):
    serializer_class = EmailVerificationSerializer


    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']

        try:
            # Find user with the token
            user = User.objects.get(
                email_verification_token=token,
                verified_email=False
            )

            # Check token expiry (24 hours)
            token_age = timezone.now() - user.date_joined
            if token_age > timedelta(hours=24):
                return Response(
                    {"error": "Verification link has expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark email as verified and clear token
            user.verified_email = True
            user.email_verification_token = ''
            user.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Email verified successfully.',
                'verified': True,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'verified_email': user.verified_email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            })
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid verification token."},
                status=status.HTTP_400_BAD_REQUEST
            )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Get avatar URL if it exists
        avatar_url = None
        if self.user.avatar_public_id:
            try:
                avatar_url = CloudinaryUploader.get_image_url(
                    self.user.avatar_public_id,
                    width=200,
                    height=200,
                    crop='fill',
                    gravity='face'
                )
            except Exception as e:
                print(f"Error getting avatar URL: {e}")

        # Add user data to response
        user = self.user
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'verified_email': user.verified_email,
            'avatar': avatar_url
        }

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class AdminProfileView(generics.RetrieveUpdateAPIView):
    """
    View for retrieving and updating admin profile
    """
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_serializer_class(self):
        # Use AdminProfileSerializer for staff/admin users
        if self.request.user.is_staff:
            return AdminProfileSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data

        # Always include avatar URL for admin users
        if request.user.is_staff and instance.avatar_public_id:
            data['avatar'] = CloudinaryUploader.get_image_url(
                instance.avatar_public_id,
                width=200,
                height=200,
                crop='fill',
                gravity='face'
            )

        return Response(data)

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                serializer.save()
        except Exception as e:
            raise serializers.ValidationError(str(e))
