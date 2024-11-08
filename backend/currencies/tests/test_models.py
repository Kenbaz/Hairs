from django.test import TestCase
from django.core.cache import cache
from decimal import Decimal
from ..models import Currency

class CurrencyModelTest(TestCase):
    def setUp(self):
        self.currency_data = {
            'code': 'NGN',
            'name': 'Nigerian Naira',
            'symbol': '₦',
            'exchange_rate': Decimal('750.00'),
            'is_active': True
        }
        # Create base currency (USD)
        Currency.objects.create(
            code='USD',
            name='US Dollar',
            symbol='$',
            exchange_rate=Decimal('1.00'),
            is_active=True
        )

    def test_currency_creation(self):
        """Test creating a new currency"""
        currency = Currency.objects.create(**self.currency_data)
        self.assertEqual(currency.code, self.currency_data['code'])
        self.assertEqual(currency.name, self.currency_data['name'])
        self.assertEqual(currency.symbol, self.currency_data['symbol'])
        self.assertEqual(currency.exchange_rate, self.currency_data['exchange_rate'])
        self.assertTrue(currency.is_active)

    def test_currency_str_representation(self):
        """Test string representation of currency"""
        currency = Currency.objects.create(**self.currency_data)
        expected_str = f"NGN - Nigerian Naira"
        self.assertEqual(str(currency), expected_str)

    def test_currency_code_unique(self):
        """Test that currency code must be unique"""
        Currency.objects.create(**self.currency_data)
        duplicate_data = self.currency_data.copy()
        duplicate_data['name'] = 'Duplicate Currency'
        
        with self.assertRaises(Exception):
            Currency.objects.create(**duplicate_data)

    def test_exchange_rate_validation(self):
        """Test that exchange rate cannot be negative"""
        invalid_data = self.currency_data.copy()
        invalid_data['exchange_rate'] = Decimal('-1.00')
        
        with self.assertRaises(Exception):
            currency = Currency(**invalid_data)
            currency.full_clean()

    def test_cache_invalidation_on_save(self):
        """Test that cache is invalidated when currency is saved"""
        # Set something in cache
        cache.set('active_currencies', {'test': 'data'})
        
        # Save currency
        currency = Currency.objects.create(**self.currency_data)
        
        # Check cache was cleared
        self.assertIsNone(cache.get('active_currencies'))

    def test_cache_invalidation_on_update(self):
        """Test that cache is invalidated when currency is updated"""
        currency = Currency.objects.create(**self.currency_data)
        cache.set('active_currencies', {'test': 'data'})
        
        # Update currency
        currency.exchange_rate = Decimal('760.00')
        currency.save()
        
        # Check cache was cleared
        self.assertIsNone(cache.get('active_currencies'))