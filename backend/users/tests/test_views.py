from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from ..models import User
from rest_framework_simplejwt.tokens import RefreshToken


class AuthenticationViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password_repeat': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '1234567890'
        }
    

    def test_user_registration(self):
        """ Test user registration endpoint """
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())
    

    def test_user_registration_without_required_fields(self):
        """ Test registration with missing required fields """
        invalid_data = self.user_data.copy()
        del invalid_data['email']
        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    

    def test_user_login(self):
        """ Test user login endpoint """
        # First create a user
        user = User.objects.create_user(
            email=self.user_data['email'],
            username=self.user_data['username'],
            password=self.user_data['password'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name']
        )

        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        login_data = {
            'email': 'wrong@example.com',
            'password': 'WrongPass123!'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)



class ProfileViewTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            first_name='Test',
            last_name='User'
        )
        self.profile_url = reverse('profile')
        
        # Get token and authenticate client
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


    def test_get_profile(self):
        """Test retrieving user profile"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertEqual(response.data['username'], self.user.username)


    def test_update_profile(self):
        """Test updating user profile"""
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone_number': '9876543210'
        }
        response = self.client.patch(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, update_data['first_name'])
        self.assertEqual(self.user.last_name, update_data['last_name'])
        self.assertEqual(self.user.phone_number, update_data['phone_number'])


    def test_profile_unauthorized(self):
        """Test profile access without authentication"""
        self.client.credentials()  # Remove authentication
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)



class PasswordManagementTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            first_name='Test',
            last_name='User'
        )
        self.change_password_url = reverse('change-password')
        self.reset_password_url = reverse('reset-password')
        
        # Authenticate client
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


    def test_change_password(self):
        """Test password change endpoint"""
        data = {
            'old_password': 'TestPass123!',
            'new_password': 'NewPass123!',
            'new_password_repeat': 'NewPass123!'
        }
        response = self.client.post(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass123!'))


    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password"""
        data = {
            'old_password': 'WrongPass123!',
            'new_password': 'NewPass123!',
            'new_password_repeat': 'NewPass123!'
        }
        response = self.client.post(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_request_password_reset(self):
        """Test password reset request endpoint"""
        self.client.credentials()  # Remove authentication as this is a public endpoint
        data = {'email': self.user.email}
        response = self.client.post(self.reset_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)



class EmailVerificationTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@gmail.com',
            username='testuser',
            password='TestPass123!',
            first_name='Test',
            last_name='User'
        )
        self.send_verification_url = reverse('send-verification-email')
        self.verify_email_url = reverse('verify-email')
        
        # Authenticate client
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


    def test_send_verification_email(self):
        """Test sending verification email"""
        response = self.client.post(self.send_verification_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verification_token)


    def test_verify_email(self):
        """Test email verification"""
        # First send verification email to get token
        self.client.post(self.send_verification_url)
        self.user.refresh_from_db()
        token = self.user.email_verification_token

        data = {'token': token}
        response = self.client.post(self.verify_email_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.verified_email)