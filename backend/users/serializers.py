from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


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
    

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 
            'first_name', 'last_name', 
            'phone_number', 'address', 'city', 'state',
            'country', 'postal_code', 'full_name',
        )
        read_only_fields = ('email',)


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