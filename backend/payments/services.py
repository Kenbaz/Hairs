# payments/services.py

import logging
from typing import Dict, Optional, Tuple
from decimal import Decimal
import uuid
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from currencies.utils import CurrencyConverter
import json
from .models import Payment, PaymentTransaction
from .exceptions import PaymentValidationError, PaymentGatewayError, PaymentProcessError, PaymentRefundError

logger = logging.getLogger(__name__)


class PaystackService:
    BASE_URL = "https://api.paystack.co"

    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to Paystack API"""
        try:
            url = f'{self.BASE_URL}/{endpoint}'
            print(f"Request URL: {url}")
            print(f"Request Method: {method}")
            print(f"Request Data: {data}")
            print(f"Request Headers: {self.headers}")
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data
            )
            print(f"Response Status Code: {response.status_code}")
            print(f"Response Content: {response.text}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'Detailed Paystack API error: {str(e)}')
            logger.error(
                f'Response content: {e.response.text if hasattr(e, "response") else "No response"}')
            raise PaymentGatewayError('Payment gateway error')
    

    def initialize_payment(self, payment: Payment, email: str, callback_url: str) -> Tuple[str, str]:
        """
        Initialize payment with Paystack
        
        Args:
            payment: Payment instance
            email: Customer email
            callback_url: URL to redirect after payment
            
        Returns:
            Tuple containing (authorization_url, reference)
        """

        try:
            # Ensure payment currency is supported
            if payment.payment_currency != 'NGN':
                converted_amount = CurrencyConverter.convert_price(
                    amount=payment.amount,
                    from_currency=payment.payment_currency,
                    to_currency='NGN'
                )
                print('converted amount:', converted_amount)
                print('converted amount in kobo:', converted_amount * 100)

                # Prepare payment data
                data = {
                    'email': email,
                    'amount': int(converted_amount * 100), # Amount in kobo/cents - Paystack requires smallest currency unit
                    'currency': 'NGN',
                    'reference': payment.reference,
                    'callback_url': callback_url,
                    'metadata': {
                        'order_id': payment.order.id,
                        'original_currency': payment.payment_currency,
                        'original_amount': float(payment.amount),
                        'exchange_rate': CurrencyConverter.get_exchange_rate(
                            payment.payment_currency, 'NGN'
                        ),
                        'custom_fields': [
                            {
                                'display_name': 'Order Number',
                                'Variable_name': 'order_number',
                                'value': payment.order.id
                            }
                        ]
                    }
                }
            else:
                # If already in NGN, use original data
                data = {
                    'email': email,
                    'amount': int(payment.amount * 100),  # Convert to kobo
                    'currency': 'NGN',
                    'reference': payment.reference,
                    'callback_url': callback_url,
                    'metadata': {
                        'order_id': payment.order.id,
                        'custom_fields': [
                            {
                                'display_name': 'Order Number',
                                'variable_name': 'order_number',
                                'value': payment.order.id
                            }
                        ]
                    }
                }

            print("Paystack Initialization Payload:",
                  json.dumps(data, indent=2))
            
            # Log conversion details for tracking
            logger.info(
                f"Payment Initialization - Currency Conversion: {payment.payment_currency} to NGN")
            logger.info(
                f"Original Amount: {payment.amount}, Converted Amount: {data['amount']/100}")

            # Initialize transaction with Paystack
            response = self._make_request(
                method='POST',
                endpoint='transaction/initialize',
                data=data
            )

            if not response.get('status'):
                logger.error(f"Paystack Initialization Failed: {response}")
                raise PaymentGatewayError(
                    response.get('message', 'Payment initialization failed')
                )
            
            # Log the transaction
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_type='initialize',
                status='success',
                provider_reference=response['data']['reference'],
                response_data=response
            )

            return (
                response['data']['authorization_url'],
                response['data']['reference']
            )
        
        except Exception as e:
            logger.error(
                f"Payment Initialization Currency Conversion Error: {str(e)}")

            # Log failed transaction
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_type='initialize',
                status='failed',
                response_message={'error': str(e)}
            )

            raise PaymentGatewayError(f"Currency conversion failed: {str(e)}")
    

    def verify_payment(self, reference: str) -> dict:
        """
        Verify payment status with Paystack
        
        Args:
            reference: Payment reference to verify
            
        Returns:
            Dict containing verification response
        """
        try:
            response = self._make_request(
                method='GET',
                endpoint=f'transaction/verify/{reference}'
            )

            if not response.get('status'):
                raise PaymentGatewayError(
                    response.get('message', 'Payment verification failed')
                )
            
            return response['data']
        
        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            raise
    

    def generate_payment_reference(self) -> str:
        """Generate unique payment reference"""
        return f"PAY-{uuid.uuid4().hex[:12].upper()}"
    

class PaymentService:
    """Main service for handling payments"""

    def __init__(self):
        self.paystack = PaystackService()
    

    def create_payment(
        self,
        order,
        payment_currency: str,
        payment_method: str = 'card'
    ) -> Payment:
        """Create a new payment record"""
        try:
            # Convert amount if neccessary
            if payment_currency not in ['NGN']:
                # Convert to NGN for Paystack
                converted_amount = CurrencyConverter.convert_price(
                    amount=order.total_amount,
                    from_currency='USD',
                    to_currency='NGN'
                )
                payment_currency = 'NGN'
                print('converted amount in create_payment:', converted_amount)
            else:
                converted_amount = order.total_amount
            
            # Create payment record
            payment = Payment.objects.create(
                order=order,
                amount=converted_amount,
                original_amount=order.total_amount,
                base_currency='USD',
                payment_currency=payment_currency,
                exchange_rate=CurrencyConverter.get_exchange_rate(
                    'USD', payment_currency),
                reference=self.paystack.generate_payment_reference(),
                payment_method=payment_method
            )

            return payment
        
        except Exception as e:
            logger.error(f"Payment creation failed: {str(e)}")
            raise
    

    def initialize_payment(
        self,
        payment: Payment,
        email: str,
        callback_url: str
    ) -> Dict:
        """Initialize payment with payment provider"""
        try:
            # Initialize with Paystack
            authorization_url, provider_ref = self.paystack.initialize_payment(
                payment=payment,
                email=email,
                callback_url=callback_url
            )

            # Update payment record
            payment.provider_reference = provider_ref
            payment.status = 'processing'
            payment.save()

            return {
                'authorization_url': authorization_url,
                'reference': payment.reference,
                'provider_reference': provider_ref
            }
        
        except Exception as e:
            payment.status = 'failed'
            payment.error_message = str(e)
            payment.save()
            raise
    

    def verify_payment(self, payment: Payment) -> bool:
        """Verify payment status"""
        try:
            # Get verification from paystack
            verification = self.paystack.verify_payment(
                payment.provider_reference
            )

            # Log transaction
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_type='verify',
                status=verification['status'],
                provider_reference=verification['reference'],
                response_data=verification
            )

            # Update payment status
            if verification['status'] == 'success':
                payment.status = 'success'
                payment.paid_at = timezone.now()
                payment.save()
                return True
            
            payment.status = 'failed'
            payment.error_message = verification['gateway_response']
            payment.save()
            return False
        
        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            payment.status = 'failed'
            payment.error_message = str(e)
            payment.save()
            raise
    

    def handle_successful_payment(self, webhook_data: dict) -> None:
        """Handle successful payment webhook event"""
        try:
            data = webhook_data.get('data', {})
            reference = data.get('reference')

            # Get payment by reference
            try:
                payment = Payment.objects.get(provider_reference=reference)
            except Payment.DoesNotExist:
                logger.error(f"Payment not found for reference: {reference}")
                return
            
            # Check if payment is already processed
            if payment.status == 'success':
                logger.info(f"Payment {reference} already processed")
                return
            
            # Create transaction record
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_type='webhook',
                status='success',
                provider_reference=reference,
                response_data=webhook_data,
                response_message='Payment confirmed via webhook'
            )

            # Update payment status
            payment.status = 'success'
            payment.paid_at = timezone.now()
            payment.save()

            # Update order payment status
            order = payment.order
            order.payment_status = True
            order.order_status = 'processing'
            order.save()

            # Send order confirmation email
            self.send_order_confirmation_email(order)

            logger.info(f"Successfully processed payment webhook for {reference}")
        
        except Exception as e:
            logger.error(f"Error processing successful payment webhook: {str(e)}")
            raise PaymentProcessError(f"Webhook processing failed: {str(e)}")
    

    def handle_failed_payment(self, webhook_data: dict) -> None:
        """Handle failed payment webhook event"""
        try:
            data = webhook_data.get('data', {})
            reference = data.get('reference')

            # Get payment by reference
            try:
                payment = Payment.objects.get(provider_reference=reference)
            except Payment.DoesNotExist:
                logger.error(f"Payment not found for reference: {reference}")
                return

            # Check if payment already failed
            if payment.status == 'failed':
                logger.info(f"Payment {reference} already marked as failed")
                return

            # Create transaction record
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_type='webhook',
                status='failed',
                provider_reference=reference,
                response_data=webhook_data,
                response_message=data.get('gateway_response', 'Payment failed')
            )

            # Update payment status
            payment.status = 'failed'
            payment.error_message = data.get(
                'gateway_response', 'Payment failed')
            payment.save()

            logger.info(f"Processed failed payment webhook for {reference}")

        except Exception as e:
            logger.error(f"Error processing failed payment webhook: {str(e)}")
            raise PaymentProcessError(f"Webhook processing failed: {str(e)}")


    def send_order_confirmation_email(self, order) -> None:
        """Send order confirmation email to customer"""
        try:
            context = {
                'order': order,
                'user': order.user,
                'site_url': settings.FRONTEND_URL,
                'order_items': order.items.all(),
            }

            # Render email template
            html_message = render_to_string(
                'emails/order_confirmation.html',
                context
            )

            # Send email
            send_mail(
                subject=f'Order Confirmation - Order #{order.id}',
                message='',  # Plain text version
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.user.email],
                html_message=html_message,
                fail_silently=False
            )

            logger.info(f"Order confirmation email sent for order {order.id}")
        except Exception as e:
            logger.error(f"Failed to send order confirmation email: {str(e)}")


    def process_refund(self, payment: Payment, amount: Decimal = None, reason: str = None) -> dict:
        """Process a refund for a payment"""
        try:
            if payment.status != 'success':
                raise PaymentValidationError(
                    "Only successful payments can be refunded")

            refund_amount = amount or payment.amount

            # Initialize refund with Paystack
            response = self.paystack._make_request(
                method="POST",
                endpoint="refund",
                data={
                    "transaction": payment.provider_reference,
                    # Convert to kobo/cents
                    "amount": int(refund_amount * 100),
                    "reason": reason or "Customer requested refund"
                }
            )

            # Create transaction record
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_type='refund',
                status='processing',
                amount=refund_amount,
                response_data=response,
                response_message=f"Refund initiated: {
                    reason}" if reason else "Refund initiated"
            )

            # Update payment status
            payment.status = 'refunded'
            payment.save()

            return {
                'status': 'success',
                'message': 'Refund initiated successfully',
                'reference': response.get('data', {}).get('reference')
            }

        except PaymentGatewayError as e:
            logger.error(f"Refund failed at payment gateway: {str(e)}")
            raise PaymentRefundError(
                message="Failed to process refund",
                payment_id=payment.id,
                amount=amount
            )
        except Exception as e:
            logger.error(f"Error processing refund: {str(e)}")
            raise PaymentRefundError(
                message=str(e),
                payment_id=payment.id,
                amount=amount
            )
