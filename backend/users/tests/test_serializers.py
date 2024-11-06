from django.test import TestCase
from django.core.exceptions import ValidationError
from ..models import User
from ..serializers import (
    UserRegisterSerializer,
    UserProfileSerializer,
    ShippingAddressSerializer,
    ChangePasswordSerializer,
    ResetPasswordEmailSerializer,
    ResetPasswordSerializer
)


class UserRegisterSerializerTest(TestCase):
    def setUp(self):
        self.valid_data = {
            'email': 'test@gmail.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password_repeat': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '1234567890',
            'address': '123 Test St',
            'city': 'Test City',
            'state': 'Test State',
            'country': 'Test Country',
            'postal_code': '12345'
        }

        # Create user with only required fields
        self.user = User.objects.create_user(
            email='existing@gmail.com',
            username='existing',
            password='ExistingPass123!',
            first_name='Existing',
            last_name='User'
        )
    

    def test_valid_registration(self):
        serializer = UserRegisterSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.email, self.valid_data['email'])
        self.assertEqual(user.username, self.valid_data['username'])
        self.assertTrue(user.check_password(self.valid_data['password']))
    

    def test_passwords_must_match(self):
        data = self.valid_data.copy()
        data['password_repeat'] = 'DifferentPass123!'
        serializer = UserRegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_email_must_be_unique(self):
        data = self.valid_data.copy()
        data['email'] = 'existing@gmail.com'
        serializer = UserRegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_username_must_be_unique(self):
        data = self.valid_data.copy()
        data['username'] = 'existing'
        serializer = UserRegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)



class UserProfileSerializerTest(TestCase):
    def setUp(self):
        # Create user with required fields first
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            first_name='Test',
            last_name='User'
        )
        # Then update additional fields
        self.user.phone_number = '1234567890'
        self.user.address = '123 Test St'
        self.user.city = 'Test City'
        self.user.state = 'Test State'
        self.user.country = 'Test Country'
        self.user.postal_code = '12345'
        self.user.save()

    def test_serialize_user(self):
        serializer = UserProfileSerializer(self.user)
        data = serializer.data
        
        self.assertEqual(data['email'], self.user.email)
        self.assertEqual(data['username'], self.user.username)
        self.assertEqual(data['first_name'], self.user.first_name)
        self.assertEqual(data['last_name'], self.user.last_name)
        self.assertEqual(data['full_name'], f"{self.user.first_name} {self.user.last_name}")
        self.assertEqual(data['phone_number'], self.user.phone_number)

    def test_update_profile(self):
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone_number': '9876543210'
        }
        
        serializer = UserProfileSerializer(self.user, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        
        self.assertEqual(updated_user.first_name, update_data['first_name'])
        self.assertEqual(updated_user.last_name, update_data['last_name'])
        self.assertEqual(updated_user.phone_number, update_data['phone_number'])



class ShippingAddressSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@gmail.com',
            username='testuser',
            password='TestPass123!',
            first_name='Test',
            last_name='User'
        )
        
        self.valid_address_data = {
            'country': 'Test Country',
            'state': 'Test State',
            'city': 'Test City',
            'address': '123 Test St',
            'postal_code': '12345'
        }

    def test_update_shipping_address(self):
        serializer = ShippingAddressSerializer(self.user, data=self.valid_address_data)
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        
        self.assertEqual(updated_user.country, self.valid_address_data['country'])
        self.assertEqual(updated_user.state, self.valid_address_data['state'])
        self.assertEqual(updated_user.city, self.valid_address_data['city'])
        self.assertEqual(updated_user.address, self.valid_address_data['address'])
        self.assertEqual(updated_user.postal_code, self.valid_address_data['postal_code'])



class ChangePasswordSerializerTest(TestCase):
    def test_passwords_must_match(self):
        data = {
            'old_password': 'OldPass123!',
            'new_password': 'NewPass123!',
            'new_password_repeat': 'DifferentPass123!'
        }
        serializer = ChangePasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new password', serializer.errors)

    def test_valid_password_change(self):
        data = {
            'old_password': 'OldPass123!',
            'new_password': 'NewPass123!',
            'new_password_repeat': 'NewPass123!'
        }
        serializer = ChangePasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())

class ResetPasswordSerializerTest(TestCase):
    def test_passwords_must_match(self):
        data = {
            'token': 'valid-token',
            'new_password': 'NewPass123!',
            'new_password_repeat': 'DifferentPass123!'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new password', serializer.errors)

    def test_valid_reset_password(self):
        data = {
            'token': 'valid-token',
            'new_password': 'NewPass123!',
            'new_password_repeat': 'NewPass123!'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())



class ResetPasswordEmailSerializerTest(TestCase):
    def test_valid_email(self):
        data = {'email': 'test@gmail.com'}
        serializer = ResetPasswordEmailSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_invalid_email(self):
        data = {'email': 'invalid-email'}
        serializer = ResetPasswordEmailSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)