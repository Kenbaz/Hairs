# payments/tests/test_models.py

from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from orders.models import Order
from payments.models import Payment, PaymentTransaction

User = get_user_model()


class PaymentModelTests(TestCase):
    def setUp(self):
        # Create test user
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

        # Create test payment
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

    def test_payment_creation(self):
        """Test payment instance creation"""
        self.assertEqual(self.payment.status, 'pending')
        self.assertEqual(self.payment.amount, Decimal('100.00'))
        self.assertTrue(self.payment.expires_at > timezone.now())
        self.assertEqual(str(self.payment), f"Payment {
                         self.payment.reference} - {self.payment.status}")

    def test_payment_transaction_creation(self):
        """Test creating a payment transaction"""
        transaction = PaymentTransaction.objects.create(
            payment=self.payment,
            transaction_type='initialize',
            status='success',
            provider_reference='PSK-123'
        )

        self.assertEqual(transaction.payment, self.payment)
        self.assertEqual(transaction.transaction_type, 'initialize')
        self.assertEqual(transaction.status, 'success')
        self.assertIsNotNone(transaction.created_at)
