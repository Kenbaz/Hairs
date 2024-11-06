from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UserRegisterSerializer, UserProfileSerializer, ChangePasswordSerializer, ResetPasswordEmailSerializer, ResetPasswordSerializer, EmailVerificationSerializer
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .models import User
from django.utils.crypto import get_random_string


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = (AllowAny,)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user
    

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = (IsAuthenticated,)


    def update(self, request, *args, **kwargs):
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
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"

            
            # Send email
            send_mail(
                'Password Reset Request',
                f'Please click the following link to reset your password: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )

            return Response(
                {"message": "Password reset email has been sent."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
             # Return the same message even if the email doesn't exist
            # This prevents email enumeration attacks
            return Response(
                {"message": "Password reset email has been sent."},
                status=status.HTTP_200_OK
            )
        


class ResetPasswordConfirmView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer

    def post(self, request, uidb64, token, *args, **kwargs):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            if default_token_generator.check_token(user, token):
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)

                user.set_password(serializer.validated_data.get('new_password'))
                user.save()

                return Response(
                    {"message": "Password has been reset successfully."},
                    status=status.HTTP_200_OK
                )
            return Response(
                {"error": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )


class SendVerificationEmailView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response(
                {"message": "Email already verified"},
                status=status.HTTP_200_OK
            )
        
        # Generate verification token
        token = get_random_string(64)
        user.email_verification_token = token
        user.save()

        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
        send_mail(
            'Verify your email',
            f'Please click the following link to verify your email: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False
        )

        return Response(
            {"message": "Verification email sent successfully."},
            status=status.HTTP_200_OK
        )


class VerifyEmailView(generics.GenericAPIView):
    serializer_class = EmailVerificationSerializer


    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.data['token']

        try:
            user = User.objects.get(email_verification_token=token)
            if not user.email_verified:
                user.email_verified = True
                user.email_verification_token = ''
                user.save()
                return Response(
                    {"message": "Email verified successfully."},
                    status=status.HTTP_200_OK
                )
            return Response(
                {"message": "Email is already verified."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid verification token."},
                status=status.HTTP_400_BAD_REQUEST
            )