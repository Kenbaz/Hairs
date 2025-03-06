# payments/tests/test_services.py

from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from orders.models import Order
from payments.models import Payment
from payments.services import PaymentService, PaystackService
from payments.exceptions import PaymentError, PaymentGatewayError

User = get_user_model()


class PaystackServiceTests(TestCase):
    def setUp(self):
        self.service = PaystackService()

        # Create test data with required first_name and last_name
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
            payment_method='card'
        )

    @patch('requests.request')
    def test_initialize_payment(self, mock_request):
        """Test payment initialization with Paystack"""
        # Mock successful response
        mock_request.return_value.json.return_value = {
            'status': True,
            'data': {
                'authorization_url': 'https://checkout.paystack.com/test',
                'reference': 'PSK-123'
            }
        }
        mock_request.return_value.raise_for_status = MagicMock()

        url, ref = self.service.initialize_payment(
            payment=self.payment,
            email='test@example.com',
            callback_url='http://testserver/callback'
        )

        self.assertIsNotNone(url)
        self.assertIsNotNone(ref)
        self.assertTrue(url.startswith('https://checkout.paystack.com'))

    @patch('requests.request')
    def test_verify_payment(self, mock_request):
        """Test payment verification with Paystack"""
        mock_request.return_value.json.return_value = {
            'status': True,
            'data': {
                'reference': 'PSK-123',
                'status': 'success',
                'gateway_response': 'Successful'
            }
        }
        mock_request.return_value.raise_for_status = MagicMock()

        result = self.service.verify_payment('PSK-123')
        self.assertEqual(result['status'], 'success')


class PaymentServiceTests(TestCase):
    def setUp(self):
        self.service = PaymentService()

        # Create test data with required first_name and last_name
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

    def test_create_payment(self):
        """Test payment creation"""
        payment = self.service.create_payment(
            order=self.order,
            payment_currency='USD'
        )

        self.assertIsNotNone(payment)
        self.assertEqual(payment.amount, Decimal('100.00'))
        self.assertEqual(payment.status, 'pending')
        self.assertEqual(payment.payment_currency, 'USD')

    def test_handle_successful_payment(self):
        """Test handling successful payment"""
        # Create a payment
        payment = self.service.create_payment(
            order=self.order,
            payment_currency='USD'
        )
        # Set provider reference
        payment.provider_reference = 'PSK-TEST-123'
        payment.save()

        # Mock webhook data
        webhook_data = {
                'data': {
                    'reference': payment.provider_reference or payment.reference,
                    'status': 'success',
                    'gateway_response': 'Successful',
                    'paid_at': '2024-01-17T10:00:00.000Z',
                    'amount': int(payment.amount * 100)  # Convert to kobo/cents
                },
                'event': 'charge.success'
            }

        # Process webhook
        self.service.handle_successful_payment(webhook_data)

        # Refresh models from database
        payment.refresh_from_db()
        self.order.refresh_from_db()

        # Verify updates
        self.assertEqual(payment.status, 'success')
        self.assertTrue(payment.paid_at)
        self.assertTrue(self.order.payment_status)
        self.assertEqual(self.order.order_status, 'processing')
