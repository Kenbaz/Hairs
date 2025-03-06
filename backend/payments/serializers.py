# payments/serializers.py

from rest_framework import serializers
from django.conf import settings
from django.utils import timezone
from orders.models import Order
from .models import Payment, PaymentTransaction
from .exceptions import (
    PaymentValidationError,
    InvalidCurrencyError,
    PaymentAmountError
)


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transactions"""

    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'transaction_type',
            'amount',
            'status',
            'provider_reference',
            'response_message',
            'response_data',
            'created_by',
            'created_at'
        ]
        read_only_fields = fields


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payment details"""

    transactions = PaymentTransactionSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source='order.id', read_only=True)
    customer_email = serializers.EmailField(
        source='order.user.email', read_only=True)
    amount_formatted = serializers.SerializerMethodField()
    original_amount_formatted = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    can_retry = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id',
            'order_number',
            'customer_email',
            'reference',
            'provider_reference',
            'amount',
            'amount_formatted',
            'original_amount',
            'original_amount_formatted',
            'payment_currency',
            'base_currency',
            'exchange_rate',
            'status',
            'payment_method',
            'error_message',
            'paid_at',
            'expires_at',
            'is_expired',
            'can_retry',
            'created_at',
            'updated_at',
            'transactions',
            'meta_data'
        ]
        read_only_fields = fields

    def get_amount_formatted(self, obj):
        """Format payment amount with currency symbol"""
        return f"{obj.payment_currency} {obj.amount:,.2f}"

    def get_original_amount_formatted(self, obj):
        """Format original amount with base currency symbol"""
        return f"{obj.base_currency} {obj.original_amount:,.2f}"

    def get_is_expired(self, obj):
        """Check if payment has expired"""
        return obj.expires_at < timezone.now()

    def get_can_retry(self, obj):
        """Check if payment can be retried"""
        if obj.status not in ['failed', 'cancelled']:
            return False
        return not self.get_is_expired(obj)


class PaymentInitializeSerializer(serializers.Serializer):
    """Serializer for initializing a new payment"""

    order_id = serializers.IntegerField()
    payment_currency = serializers.CharField(max_length=3)
    payment_method = serializers.CharField(max_length=50, default='card')
    email = serializers.EmailField()
    callback_url = serializers.URLField()
    metadata = serializers.JSONField(required=False)

    def validate_payment_currency(self, value):
        """Validate that the currency is supported"""
        if value not in settings.SUPPORTED_CURRENCIES:
            raise InvalidCurrencyError(currency=value)
        return value.upper()

    def validate_order_id(self, value):
        """Validate that the order exists and can be paid"""
        try:
            order = Order.objects.get(id=value)

            # Check if order has pending payments
            if order.payments.filter(status='pending').exists():
                raise PaymentValidationError(
                    "Order already has a pending payment"
                )

            # Check if order is already paid
            if order.payment_status:
                raise PaymentValidationError(
                    "Order is already paid"
                )

            return value

        except Order.DoesNotExist:
            raise PaymentValidationError("Invalid order ID")

    def validate_amount(self, value):
        """Validate payment amount"""
        if value <= 0:
            raise PaymentAmountError("Payment amount must be greater than 0")

        if value < settings.MINIMUM_PAYMENT_AMOUNT:
            raise PaymentAmountError(
                f"Payment must be at least {settings.MINIMUM_PAYMENT_AMOUNT}"
            )

        return value

    def validate(self, data):
        """Additional cross-field validation"""
        order = Order.objects.get(id=data['order_id'])

        # Verify email matches order
        if data['email'] != order.user.email:
            raise PaymentValidationError(
                "Email does not match order"
            )

        return data


class PaymentVerifySerializer(serializers.Serializer):
    """Serializer for payment verification"""

    reference = serializers.CharField()

    def validate_reference(self, value):
        """Validate payment reference exists"""
        try:
            payment = Payment.objects.get(reference=value)
            if payment.status == 'success':
                raise PaymentValidationError(
                    "Payment already verified"
                )
            return value
        except Payment.DoesNotExist:
            raise PaymentValidationError(
                "Invalid payment reference"
            )


class PaymentMethodSerializer(serializers.Serializer):
    """Serializer for payment method selection"""

    payment_method = serializers.ChoiceField(
        choices=[
            ('card', 'Card Payment'),
            ('bank', 'Bank Transfer'),
            ('ussd', 'USSD'),
            ('qr', 'QR Code'),
        ]
    )

    def validate_payment_method(self, value):
        """Validate payment method is supported for currency"""
        currency = self.context.get('currency')
        if currency == 'USD' and value not in ['card']:
            raise serializers.ValidationError(
                "Only card payments are supported for USD"
            )
        return value


class PaymentRefundSerializer(serializers.Serializer):
    """Serializer for payment refunds"""

    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False
    )
    reason = serializers.CharField(required=False)

    def validate_amount(self, value):
        """Validate refund amount"""
        payment = self.context.get('payment')
        if not payment:
            raise serializers.ValidationError("Payment context required")

        if value > payment.amount:
            raise serializers.ValidationError(
                "Refund amount cannot exceed payment amount"
            )

        return value

    def validate(self, data):
        """Validate refund is possible"""
        payment = self.context.get('payment')
        if payment.status != 'success':
            raise serializers.ValidationError(
                "Only successful payments can be refunded"
            )

        if not data.get('amount'):
            data['amount'] = payment.amount

        return data


class TransactionLogSerializer(serializers.ModelSerializer):
    """Serializer for detailed transaction logs"""
    payment_reference = serializers.CharField(source='payment.reference')
    provider_reference = serializers.CharField(
        source='payment.provider_reference')
    customer_email = serializers.CharField(source='payment.order.user.email')
    created_by_name = serializers.SerializerMethodField()
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False
    )

    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'payment_reference',
            'provider_reference',
            'transaction_type',
            'status',
            'amount',
            'customer_email',
            'response_message',
            'created_by_name',
            'created_at'
        ]
        read_only_fields = fields

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None


class TransactionSummarySerializer(serializers.Serializer):
    """Serializer for transaction summary statistics"""
    total_payments = serializers.IntegerField()
    successful_payments = serializers.IntegerField()
    success_rate = serializers.FloatField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_processing_time = serializers.DurationField(allow_null=True)


class DailyTransactionSerializer(serializers.Serializer):
    """Serializer for daily transaction data"""
    date = serializers.DateField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    successful = serializers.IntegerField()
    failed = serializers.IntegerField()


class CurrencyDistributionSerializer(serializers.Serializer):
    """Serializer for currency distribution data"""
    payment_currency = serializers.CharField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class PaymentMethodDistributionSerializer(serializers.Serializer):
    """Serializer for payment method distribution"""
    payment_method = serializers.CharField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    success_count = serializers.IntegerField()


class PaymentReconciliationSerializer(serializers.Serializer):
    """Serializer for payment reconciliation data"""
    summary = TransactionSummarySerializer()
    daily_transactions = DailyTransactionSerializer(many=True)
    currency_distribution = CurrencyDistributionSerializer(many=True)
    payment_methods = PaymentMethodDistributionSerializer(many=True)
    date_range = serializers.DictField(
        child=serializers.DateTimeField()
    )
