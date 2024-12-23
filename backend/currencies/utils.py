from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from django.core.cache import cache
from .models import Currency
from typing import Union, Dict, Optional, List
from dataclasses import dataclass


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
    def get_active_currencies(cls) -> Dict[str, CurrencyInfo]:
        """ Get all active currencies with their exchange rates """
        # Try to get from cache first
        currencies = cache.get(cls.CACHE_KEY)

        if currencies is None:
            currencies = {}
            for currency in Currency.objects.filter(is_active=True):
                try:
                    currencies[currency.code] = CurrencyInfo(
                        code=currency.code,
                        symbol=currency.symbol,
                        rate=Decimal(str(currency.exchange_rate)),
                        name=currency.name
                    )
                except (InvalidOperation, TypeError) as e:
                    # Log invalid exchange rate
                    print(f"Invalid exchange rate for {currency.code}: {e}")
                    continue
            
            cache.set(cls.CACHE_KEY, currencies, cls.CACHE_TIMEOUT)
        
        return currencies


    @classmethod
    def convert_price(
        cls,
        amount: NumericType,
        from_currency: str = 'USD',
        to_currency: str = 'USD',
        round_digits: int = 2
    ) -> Optional[Decimal]:
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
            # Return early if some currency
            if from_currency == to_currency:
                return Decimal(str(amount))
            
            # Validate amount
            amount = Decimal(str(amount))
            if amount < 0:
                raise ValueError("Amount cannot be negative")
            
            currencies = cls.get_active_currencies()

            # Validate currencies
            if from_currency not in currencies:
                raise ValueError(f"Invalid source currency: {from_currency}")
            if to_currency not in currencies:
                raise ValueError(f"Invalid target currency: {to_currency}")
            
            # Convert to base currency (USD) first
            if from_currency != cls.BASE_CURRENCY:
                amount = amount * currencies[to_currency].rate
            
            # Round to specified decimal places
            return amount.quantize(
                Decimal(f"0.{'0' * round_digits}"),
                rounding=ROUND_HALF_UP
            )
        except (InvalidOperation, TypeError) as e:
            raise ValueError(f"Invalid amount or conversion error: {e}")
    

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
            raise ValueError(f"Invalid currency code: {currency_code}")
        
        currency = currencies[currency_code]
        formatted_amount = f"{Decimal(str(amount)):,.2f}"

        return f"{currency.symbol}{formatted_amount}" if include_symbol else formatted_amount
    

    @classmethod
    def refresh_cache(cls) -> None:
        """ Force refresh of currency cache """
        cache.delete(cls.CACHE_KEY)
        cls.get_active_currencies()
