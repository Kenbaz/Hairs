from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .models import User


class UserModelTest(TestCase):
    def setUp(self):
        """ Set up test data """
        self.user_data = {
            'email': 'test@gmail.com',
            'username': 'testuser',
            'password': 'TestPass1234',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '1234567890',
            'country': 'Nigeria',
            'city': 'Uyo',
            'address': '123 Test street'
        }

    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(
            email=self.user_data['email'],
            username=self.user_data['username'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name'],
            password=self.user_data['password']
        )
        
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.username, self.user_data['username'])
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password(self.user_data['password']))

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            first_name='Admin',
            last_name='User',
            password='AdminPass123!'
        )
        
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertEqual(admin_user.username, 'admin')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.is_admin)
        self.assertTrue(admin_user.check_password('AdminPass123!'))


    def test_user_str_method(self):
        """Test the string representation of User model"""
        user = User.objects.create_user(
            email=self.user_data['email'],
            username=self.user_data['username'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name'],
            password=self.user_data['password']
        )
        self.assertEqual(str(user), self.user_data['email'])

    def test_user_full_name_property(self):
        """Test the full_name property"""
        user = User.objects.create_user(
            email=self.user_data['email'],
            username=self.user_data['username'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name'],
            password=self.user_data['password']
        )
        expected_full_name = f"{self.user_data['first_name']} {self.user_data['last_name']}"
        self.assertEqual(user.full_name, expected_full_name)
    

    def test_create_user_without_email(self):
        """ Test creating a user without an email to see if it raises an error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email='',
                username=self.user_data['username'],
                first_name=self.user_data['first_name'],
                last_name=self.user_data['last_name'],
                password=self.user_data['password']
            )
    

    def test_email_is_unique(self):
        """Test that users cannot be created with duplicate emails"""
        User.objects.create_user(
            email=self.user_data['email'],
            username='user1',
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name'],
            password=self.user_data['password']
        )
        
        with self.assertRaises(Exception):
            User.objects.create_user(
                email=self.user_data['email'],  # Same email
                username='user2',
                first_name=self.user_data['first_name'],
                last_name=self.user_data['last_name'],
                password=self.user_data['password']
            )


    def test_username_is_unique(self):
        """Test that users cannot be created with duplicate usernames"""
        User.objects.create_user(
            email='user1@example.com',
            username=self.user_data['username'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name'],
            password=self.user_data['password']
        )
        
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='user2@example.com',
                username=self.user_data['username'],  # Same username
                first_name=self.user_data['first_name'],
                last_name=self.user_data['last_name'],
                password=self.user_data['password']
            )
    

    def test_user_permissions(self):
        """Test user permissions"""
        regular_user = User.objects.create_user(
            email='regular@example.com',
            username='regular',
            first_name='Regular',
            last_name='User',
            password='RegularPass123!'
        )
        
        admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            first_name='Admin',
            last_name='User',
            password='AdminPass123!'
        )

        # Test regular user permissions
        self.assertFalse(regular_user.has_perm('any_permission'))
        self.assertFalse(regular_user.is_staff)
        self.assertFalse(regular_user.is_superuser)

        # Test admin user permissions
        self.assertTrue(admin_user.has_perm('any_permission'))
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)