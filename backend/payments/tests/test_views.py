# payments/tests/test_views.py

from decimal import Decimal
import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from orders.models import Order
from payments.models import Payment
from payments.utils.webhook import verify_webhook_signature
from unittest.mock import patch
from django.conf import settings

User = get_user_model()


class PaymentViewsTests(APITestCase):
    def setUp(self):
        # Create test user with required fields
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create test order
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('100.00'),
            shipping_address='Test Address'
        )

        # Authenticate the client
        self.client.force_authenticate(user=self.user)

    def test_initialize_payment(self):
        """Test payment initialization endpoint"""
        url = reverse('initialize-payment')
        data = {
            'order_id': self.order.id,
            'payment_currency': 'USD',
            'payment_method': 'card',
            'email': self.user.email,
            'callback_url': 'https://example.com/callback'
        }

        # Mock Paystack initialization
        with patch('payments.services.PaystackService.initialize_payment') as mock_init:
            mock_init.return_value = ('https://paystack.com/test', 'TEST-REF')
            response = self.client.post(url, data, format='json')

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertIn('payment', response.data)
            self.assertIn('authorization_url', response.data)
            self.assertIn('reference', response.data)


    def test_verify_payment(self):
        """Test payment verification endpoint"""
        # Create a test payment
        payment = Payment.objects.create(
            order=self.order,
            amount=Decimal('100.00'),
            original_amount=Decimal('100.00'),
            payment_currency='USD',
            base_currency='USD',
            exchange_rate=Decimal('1.00'),
            reference='TEST-123',
            provider_reference='PSK-123',
            payment_method='card'
        )

        url = reverse('verify-payment')
        data = {'reference': payment.reference}

        # Mock payment verification
        with patch('payments.services.PaystackService.verify_payment') as mock_verify:
            mock_verify.return_value = {
                'status': 'success',
                'reference': payment.provider_reference
            }
            response = self.client.post(url, data, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('payment', response.data)
            self.assertIn('verified', response.data)


class PaymentWebhookTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.test_secret = 'test_secret_key'

        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('100.00'),
            shipping_address='Test Address'
        )

        self.payment = Payment.objects.create(
            order=self.order,
            amount=Decimal('100.00'),
            original_amount=Decimal('100.00'),
            payment_currency='USD',
            base_currency='USD',
            exchange_rate=Decimal('1.00'),
            reference='TEST-123',
            provider_reference='PSK-123',
            payment_method='card'
        )
    
    @patch('payments.views.verify_webhook_signature')
    def test_webhook_successful_payment(self, mock_verify):
        """Test webhook handling for successful payment"""
        # Set up the mock to return True
        mock_verify.return_value = True

        # Create webhook data
        webhook_data = {
            'event': 'charge.success',
            'data': {
                'reference': self.payment.provider_reference,
                'status': 'success',
                'gateway_response': 'Successful',
                'paid_at': '2024-01-17T10:00:00.000Z',
                # Convert to kobo/cents
                'amount': int(self.payment.amount * 100)
            }
        }

        # Convert data to JSON string and then to bytes
        payload = json.dumps(webhook_data).encode('utf-8')

        # Generate test signature
        test_signature = self.generate_test_signature(payload)

        # Make the request with proper headers
        response = self.client.post(
            reverse('paystack-webhook'),
            data=payload,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=test_signature
        )

        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {
                         "message": "Webhook processed successfully"})
        
        # Verify the mock was called
        mock_verify.assert_called_once()

        # Verify payment was updated
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'success')

    def generate_test_signature(self, payload: bytes) -> str:
        """Generate a valid test signature"""
        import hmac
        import hashlib

        return hmac.new(
            self.test_secret.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()

    def test_webhook_invalid_signature(self):
        """Test webhook with invalid signature"""
        response = self.client.post(
            reverse('paystack-webhook'),
            data=json.dumps({}),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
