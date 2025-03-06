# payments/tests/conftest.py

import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from orders.models import Order
from payments.models import Payment

User = get_user_model()


@pytest.fixture
def test_user():
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )


@pytest.fixture
def test_order(test_user):
    return Order.objects.create(
        user=test_user,
        total_amount=Decimal('100.00'),
        shipping_address='Test Address'
    )


@pytest.fixture
def test_payment(test_order):
    return Payment.objects.create(
        order=test_order,
        amount=Decimal('100.00'),
        original_amount=Decimal('100.00'),
        payment_currency='USD',
        base_currency='USD',
        exchange_rate=Decimal('1.00'),
        reference='TEST-123',
        payment_method='card'
    )


@pytest.fixture
def paystack_success_payload():
    return {
        'event': 'charge.success',
        'data': {
            'reference': 'TEST-123',
            'status': 'success',
            'gateway_response': 'Successful',
            'amount': 10000,  # Amount in kobo (100.00 NGN)
            'currency': 'NGN',
            'channel': 'card',
            'paid_at': '2024-01-17T10:00:00.000Z'
        }
    }


@pytest.fixture
def paystack_failed_payload():
    return {
        'event': 'charge.failed',
        'data': {
            'reference': 'TEST-123',
            'status': 'failed',
            'gateway_response': 'Insufficient funds',
            'amount': 10000,
            'currency': 'NGN',
            'channel': 'card'
        }
    }
