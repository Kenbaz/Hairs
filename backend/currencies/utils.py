from decimal import Decimal, ROUND_HALF_UP
from django.core.cache import cache
from .models import Currency



def get_active_currencies():
    """ Get all active currencies with their exchange rates """
    # Try to get from cache first
    currencies = cache.get('active_currencies')
    if currencies is None:
        currencies = {
            currency.code: {
                'symbol': currency.symbol,
                'rate': currency.exchange_rate,
                'name': currency.name
            }
            for currency in Currency.objects.filter(is_active=True)
        }
        # Cache currencies for 24 hours 
        cache.set('active_currencies', currencies, 60 * 60 * 24)
    return currencies



def convert_price(amount, from_currency='USD', to_currency='NGN'):
    """ Convert price between currencies """
    if from_currency == to_currency:
        return 
    
    currencies = get_active_currencies()

    if from_currency not in currencies or to_currency not in currencies:
        raise ValueError("Invalid currency code")
    

    # Convert to USD first if not already in USD
    if from_currency != 'USD':
        amount = amount / currencies[from_currency]['rate']


    # Convert from USD to target currency
    converted_currency = amount * currencies[to_currency]['rate']


    # Round to 2 decimal places
    return Decimal(converted_currency).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
