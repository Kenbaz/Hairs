# payments/exceptions.py

class PaymentError(Exception):
    """Base exception for payment errors"""

    def __init__(self, message: str = None, code: str = None):
        self.message = message or "An error occurred during payment processing"
        self.code = code or "payment_error"
        super().__init__(self.message)


class PaymentValidationError(PaymentError):
    """Raised when payment validation fails"""

    def __init__(self, message: str = None, code: str = None):
        super().__init__(
            message or "Payment validation failed",
            code or "validation_error"
        )


class PaymentGatewayError(PaymentError):
    """Raised when there's an error with the payment gateway"""

    def __init__(self, message: str = None, code: str = None, response: dict = None):
        self.response = response
        super().__init__(
            message or "Payment gateway error occurred",
            code or "gateway_error"
        )

    def get_gateway_response(self) -> dict:
        """Get the raw gateway response if available"""
        return self.response or {}


class PaymentProcessError(PaymentError):
    """Raised when payment processing fails"""

    def __init__(self, message: str = None, code: str = None, payment_id: str = None):
        self.payment_id = payment_id
        super().__init__(
            message or "Payment processing failed",
            code or "process_error"
        )


class InvalidCurrencyError(PaymentError):
    """Raised when an unsupported currency is used"""

    def __init__(self, currency: str = None):
        self.currency = currency
        message = f"Currency {currency} is not supported" if currency else "Invalid currency"
        super().__init__(message, "invalid_currency")


class PaymentWebhookError(PaymentError):
    """Raised when there's an error processing the webhook"""

    def __init__(self, message: str = None, code: str = None, event_type: str = None):
        self.event_type = event_type
        message = message or f"Error processing webhook event: {event_type}" if event_type else "Webhook processing error"
        super().__init__(message, code or "webhook_error")


class PaymentExpiredError(PaymentError):
    """Raised when attempting to process an expired payment"""

    def __init__(self, payment_id: str = None):
        message = f"Payment {payment_id} has expired" if payment_id else "Payment has expired"
        super().__init__(message, "payment_expired")


class PaymentAlreadyProcessedError(PaymentError):
    """Raised when attempting to process a payment that's already been processed"""

    def __init__(self, payment_id: str = None, status: str = None):
        message = f"Payment {payment_id} has already been processed" if payment_id else "Payment already processed"
        if status:
            message += f" (status: {status})"
        super().__init__(message, "already_processed")


class PaymentAmountError(PaymentError):
    """Raised when there's an issue with the payment amount"""

    def __init__(self, message: str = None, amount: float = None, currency: str = None):
        self.amount = amount
        self.currency = currency
        if amount and currency:
            message = message or f"Invalid payment amount: {amount} {currency}"
        super().__init__(message or "Invalid payment amount", "invalid_amount")


class PaymentMethodError(PaymentError):
    """Raised when there's an issue with the payment method"""

    def __init__(self, method: str = None):
        message = f"Invalid or unsupported payment method: {method}" if method else "Invalid payment method"
        super().__init__(message, "invalid_method")


class PaymentRefundError(PaymentError):
    """Raised when there's an error processing a refund"""

    def __init__(self, message: str = None, payment_id: str = None, amount: float = None):
        self.payment_id = payment_id
        self.amount = amount
        message = message or f"Error processing refund for payment {payment_id}"
        super().__init__(message, "refund_error")
