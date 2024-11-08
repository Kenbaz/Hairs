from django.test import TestCase
from django.core.cache import cache
from decimal import Decimal
from django.db import connection
from ..models import Currency
from ..utils import get_active_currencies, convert_price

class CurrencyUtilsTest(TestCase):
    def setUp(self):
        # Create base currency (USD)
        self.usd = Currency.objects.create(
            code='USD',
            name='US Dollar',
            symbol='$',
            exchange_rate=Decimal('1.00'),
            is_active=True
        )
        
        # Create Nigerian Naira
        self.ngn = Currency.objects.create(
            code='NGN',
            name='Nigerian Naira',
            symbol='₦',
            exchange_rate=Decimal('750.00'),
            is_active=True
        )
        
        # Create an inactive currency
        self.inactive = Currency.objects.create(
            code='EUR',
            name='Euro',
            symbol='€',
            exchange_rate=Decimal('0.85'),
            is_active=False
        )

        # Clear cache before each test
        cache.clear()

    def test_get_active_currencies(self):
        """Test retrieving active currencies"""
        currencies = get_active_currencies()
        
        # Check structure and content
        self.assertEqual(len(currencies), 2)  # Only USD and NGN should be active
        self.assertIn('USD', currencies)
        self.assertIn('NGN', currencies)
        self.assertNotIn('EUR', currencies)
        
        # Check currency data structure
        ngn_data = currencies['NGN']
        self.assertEqual(ngn_data['symbol'], '₦')
        self.assertEqual(ngn_data['rate'], Decimal('750.00'))
        self.assertEqual(ngn_data['name'], 'Nigerian Naira')

    def test_get_active_currencies_caching(self):
        """Test that active currencies are cached"""
        # First call to get_active_currencies - should hit database
        with self.assertNumQueries(1):
            currencies_first_call = get_active_currencies()

        # Second call should use cache and not hit database
        with self.assertNumQueries(0):
            currencies_second_call = get_active_currencies()

        # Verify both calls return the same data
        self.assertEqual(currencies_first_call, currencies_second_call)

        # Modify currency in database
        self.ngn.exchange_rate = Decimal('760.00')
        self.ngn.save()

        # After save, cache should be invalidated and new call should hit database
        with self.assertNumQueries(1):
            currencies_after_update = get_active_currencies()

        # Verify we get updated data
        self.assertEqual(
            currencies_after_update['NGN']['rate'],
            Decimal('760.00')
        )

    def test_convert_price_usd_to_ngn(self):
        """Test converting price from USD to NGN"""
        amount_usd = Decimal('100.00')
        amount_ngn = convert_price(amount_usd, 'USD', 'NGN')
        expected_ngn = Decimal('75000.00')  # 100 * 750
        self.assertEqual(amount_ngn, expected_ngn)

    def test_convert_price_ngn_to_usd(self):
        """Test converting price from NGN to USD"""
        amount_ngn = Decimal('75000.00')
        amount_usd = convert_price(amount_ngn, 'NGN', 'USD')
        expected_usd = Decimal('100.00')  # 75000 / 750
        self.assertEqual(amount_usd, expected_usd)

    def test_convert_price_same_currency(self):
        """Test converting price to same currency"""
        amount = Decimal('100.00')
        converted = convert_price(amount, 'USD', 'USD')
        self.assertEqual(converted, None)  # Should return None for same currency

    def test_convert_price_invalid_currency(self):
        """Test converting price with invalid currency"""
        amount = Decimal('100.00')
        with self.assertRaises(ValueError):
            convert_price(amount, 'USD', 'INVALID')

    def test_convert_price_inactive_currency(self):
        """Test converting price with inactive currency"""
        amount = Decimal('100.00')
        with self.assertRaises(ValueError):
            convert_price(amount, 'USD', 'EUR')

    def test_convert_price_rounding(self):
        """Test that converted prices are rounded correctly"""
        amount_usd = Decimal('100.33')
        amount_ngn = convert_price(amount_usd, 'USD', 'NGN')
        self.assertEqual(amount_ngn.as_tuple().exponent, -2)  # Check 2 decimal places