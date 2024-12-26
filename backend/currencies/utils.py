from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from django.core.cache import cache
from .models import Currency
from typing import Union, Dict, Optional, List
from dataclasses import dataclass
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)


class CurrencyConversionError(Exception):
    """ Base exception for currency conversion errors """
    pass


class InvalidExchangeRate(CurrencyConversionError):
    """ Exception for invalid exchange rate """
    pass


class CurrencyNotFound(CurrencyConversionError):
    """ Exception for invalid currency code """
    pass


NumericType = Union[Decimal, float, int]


@dataclass
class CurrencyInfo:
    code: str
    symbol: str
    rate: Decimal
    name: str


class CurrencyConverter:
    """ Handle currency conversion operations """
    CACHE_KEY = 'active_currencies'
    CACHE_TIMEOUT = 60 * 60 * 24
    BASE_CURRENCY = 'USD'


    @classmethod
    def validate_exchange_rate(cls, rate: Decimal) -> None:
        """
            Validate exchange rate value
            
            Args:
                rate: Exchange rate to validate
                
            Raises:
                InvalidExchangeRate: If rate is invalid
        """
        try:
            rate = Decimal(str(rate))
            if rate <= Decimal('0'):
                raise InvalidExchangeRate("Exchange rate must be greated than 0")
            if rate < Decimal('0.000001'):
                raise InvalidExchangeRate("Exchange rate is too small")
            if rate > Decimal('999999'):
                raise InvalidExchangeRate("Exchange rate is too large")
        except (InvalidOperation, TypeError) as e:
            raise InvalidExchangeRate(f"Invalid exchange rate: {e}")


    @classmethod
    def get_active_currencies(cls) -> Dict[str, CurrencyInfo]:
        """
            Get all active currencies with their exchange rates
            
            Returns:
                Dict mapping currency codes to CurrencyInfo objects
            
            Note:
                Always includes USD as base currency with rate 1.0
        """
        # Try to get from cache first
        currencies = cache.get(cls.CACHE_KEY)

        if currencies is None:
                try:
                    # Get fresh data from database
                    currencies = {}
                    for currency in Currency.objects.filter(is_active=True):
                        try:
                           # Validate exchange rate
                           cls.validate_exchange_rate(currency.exchange_rate)

                           currencies[currency.code] = CurrencyInfo(
                                 code=currency.code,
                                 symbol=currency.symbol,
                                 rate=Decimal(str(currency.exchange_rate)),
                                 name=currency.name
                           )
                        except InvalidExchangeRate as e:
                           logger.error(
                                 f"Invalid exchange rate for {currency.code}: {e}"
                           )
                           continue
                    
                    # Ensure base currency is always present with rate 1.0
                    if cls.BASE_CURRENCY not in currencies:
                        currencies[cls.BASE_CURRENCY] = CurrencyInfo(
                            code=cls.BASE_CURRENCY,
                            symbol='$',
                            rate=Decimal('1.0'),
                            name='US Dollar'
                        )
                    
                    # Cache the results
                    cache.set(cls.CACHE_KEY, currencies, cls.CACHE_TIMEOUT)
                except Exception as e:
                    logger.error(f"Failed to get active currencies: {e}")
                    # Return at least USD as fallback
                    currencies = {
                        cls.BASE_CURRENCY: CurrencyInfo(
                            code=cls.BASE_CURRENCY,
                            symbol='$',
                            rate=Decimal('1.0'),
                            name='US Dollar'
                        )
                    }

        return currencies
                            

    @classmethod
    def convert_price(
        cls,
        amount: NumericType,
        from_currency: str = 'USD',
        to_currency: str = 'USD',
        round_digits: int = 2
    ) -> Decimal:
        """
          Convert price between currencies

            Args:
            amount: Amount to convert
            from_currency: Source currency code
            to_currency: Target currency code
            round_digits: Number of decimal places to round to
            
         Returns:
            Converted amount as Decimal or None if currencies match
        
         Raises:
            ValueError: If currency codes are invalid or conversion fails

        """
        try:
            # Return early if currencies match
            if from_currency == to_currency:
                return Decimal(str(amount))
            
            # Validate amount
            amount = Decimal(str(amount))
            if amount < 0:
                raise ValueError("Amount cannot be negative")
            
            currencies = cls.get_active_currencies()

            # Validate currencies exists and are active
            if from_currency not in currencies:
                raise ValueError(f"Source currency not found: {from_currency}")
            if to_currency not in currencies:
                raise ValueError(f"Target currency not found: {to_currency}")
            
            from_rate = currencies[from_currency].rate
            to_rate = currencies[to_currency].rate
            
            # Convert to base currency (USD) first
            if from_currency != cls.BASE_CURRENCY:
                amount = amount / from_rate
            
            # Convert to target currency
            if to_currency != cls.BASE_CURRENCY:
                amount = amount * to_rate
            
            # Round to specified decimal places
            return amount.quantize(
                Decimal(f"0.{'0' * round_digits}"),
                rounding=ROUND_HALF_UP
            )
        except (InvalidOperation, TypeError) as e:
            raise ValueError(f"Invalid amount or conversion error: {e}")
        except Exception as e:
            logger.error(f"Failed to convert price: {e}")
            raise CurrencyConversionError(f"Failed to convert price: {e}")
    

    @classmethod
    def bulk_convert(
        cls,
        amounts: List[NumericType],
        from_currency: str,
        to_currency: str,
    ) -> List[Decimal]:
        """
          Conver multiple amounts between currencies

          Returns List of converted amounts
        """
        return [
            cls.convert_price(amount, from_currency, to_currency) for amount in amounts
        ]


    @classmethod
    def format_price(
        cls,
        amount: NumericType,
        currency_code: str,
        include_symbol: bool = True
    ) -> str:
        """
            Format price with currency symbol and proper decimals
            
            Returns:
                Formatted price string
        """
        currencies = cls.get_active_currencies()
        if currency_code not in currencies:
            raise CurrencyNotFound(f"Invalid currency code: {currency_code}")
        
        currency = currencies[currency_code]
        formatted_amount = f"{Decimal(str(amount)):,.2f}"

        return f"{currency.symbol}{formatted_amount}" if include_symbol else formatted_amount
    

    @classmethod
    def refresh_cache(cls) -> None:
        """ Force refresh of currency cache """
        cache.delete(cls.CACHE_KEY)
        cls.get_active_currencies()

