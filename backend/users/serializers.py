# users/serializers.py

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from utils.cloudinary_utils import CloudinaryUploader
from django.conf import settings


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_repeat = serializers.CharField(write_only=True, required=True)


    class Meta:
        model = User
        fields = (
            'email', 'username', 'password', 'password_repeat',
            'first_name', 'last_name', 'phone_number',
            'address', 'city',
            'state', 'country', 'postal_code',
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_repeat']:
            raise serializers.ValidationError({"password": "password fields didn't match."})
        return attrs
    

    def create(self, validated_data):
        validated_data.pop('password_repeat')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class BaseUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)

    def get_avatar_url(self, obj):
        """Get the Cloudinary URL for the avatar"""
        if obj.avatar_public_id:
            try:
                return CloudinaryUploader.get_image_url(
                    obj.avatar_public_id,
                    width=200,
                    height=200,
                    crop='fill',
                    gravity='face'
                )
            except Exception as e:
                print(f"Error getting avatar URL: {e}")
                return None
        return None
    

class UserProfileSerializer(BaseUserSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 
            'first_name', 'last_name', 
            'phone_number', 'address', 'city', 'state',
            'country', 'postal_code', 'full_name', 'avatar', 'avatar_url'
        )
        read_only_fields = ('email', 'avatar_url')


class ShippingAddressSerializer(serializers.ModelSerializer):
    """ Serializer for updating shipping address only """
    class Meta:
        model = User
        fields = (
            'country', 'state', 'city', 'address', 'postal_code'
        )


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_repeat = serializers.CharField(required=True)


    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_repeat']:
            raise serializers.ValidationError({"new password": "password field didn't match."})
        return attrs
    

class ResetPasswordEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        write_only=True,
        min_length=8
    )
    password_confirmation = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        write_only=True
    )

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        # Remove password_confirmation from validated data
        validated_data.pop('password_confirmation', None)
        return validated_data
    

class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()


class AdminProfileSerializer(BaseUserSerializer):
    """Serializer for admin profile updates"""
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'avatar', 'avatar_url', 'full_name'
        ]
        read_only_fields = ['email', 'username']


    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def update(self, instance, validated_data):
        try:
            # Handle avatar upload
            avatar_file = self.context['request'].FILES.get('avatar')

            if avatar_file:
                # Delete old avatar if exists
                if instance.avatar_public_id:
                    instance.delete_avatar()

                # Upload new avatar to Cloudinary
                result = CloudinaryUploader.upload_image(
                    avatar_file,
                    folder=settings.CLOUDINARY_STORAGE_FOLDERS['AVATARS'],
                    transformation=[
                        {'width': 400, 'height': 400, 'crop': 'fill'},
                        {'quality': 'auto'},
                        {'fetch_format': 'auto'}
                    ]
                )

                if result:
                    instance.avatar = result['url']
                    instance.avatar_public_id = result['public_id']
                else:
                    raise serializers.ValidationError(
                        "Failed to upload avatar")

            # Update other fields
            for attr, value in validated_data.items():
                if attr != 'avatar':  # Skip avatar as we handled it above
                    setattr(instance, attr, value)

            instance.save()
            return instance

        except Exception as e:
            raise serializers.ValidationError(str(e))
