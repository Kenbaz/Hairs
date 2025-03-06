# payments/views.py

import logging
from typing import Dict, Any
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from orders.models import Order
from .models import Payment, PaymentTransaction
from .serializers import (
    PaymentSerializer,
    PaymentInitializeSerializer,
    PaymentVerifySerializer,
    PaymentMethodSerializer,
    PaymentRefundSerializer
)
from .services import PaymentService
import json
from .exceptions import (
    PaymentError
)
from .utils.webhook import verify_webhook_signature, get_event_type

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing payment details.
    Provides list and retrieve actions only.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter payments based on user role"""
        if self.request.user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(order__user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get transaction history for a payment"""
        payment = self.get_object()
        transactions = payment.transactions.all()
        return Response({
            'count': transactions.count(),
            'results': PaymentTransactionSerializer(transactions, many=True).data
        })


class InitializePaymentView(generics.CreateAPIView):
    """Initialize a new payment"""
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentInitializeSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)

            # Get order
            order = get_object_or_404(
                Order,
                id=serializer.validated_data['order_id']
            )

            # Initialize payment service
            payment_service = PaymentService()

            # Create payment record
            payment = payment_service.create_payment(
                order=order,
                payment_currency=serializer.validated_data['payment_currency'],
                payment_method=serializer.validated_data.get(
                    'payment_method', 'card')
            )

            # Initialize payment with Paystack
            payment_data = payment_service.initialize_payment(
                payment=payment,
                email=serializer.validated_data['email'],
                callback_url=serializer.validated_data['callback_url']
            )

            return Response({
                'payment': PaymentSerializer(payment).data,
                'authorization_url': payment_data['authorization_url'],
                'reference': payment_data['reference']
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Payment initialization failed: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class VerifyPaymentView(generics.GenericAPIView):
    """Verify payment status"""
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)

            payment = get_object_or_404(
                Payment,
                reference=serializer.validated_data['reference']
            )

            payment_service = PaymentService()
            is_verified = payment_service.verify_payment(payment)

            return Response({
                'verified': is_verified,
                'payment': PaymentSerializer(payment).data
            })

        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class PaystackWebhookView(APIView):
    """Handle Paystack webhook events"""

    def post(self, request, *args, **kwargs):
        try:
            # Get the signature from header (case-insensitive)
            signature = request.headers.get(
                'x-paystack-signature') or request.headers.get('X-Paystack-Signature')

            if not signature:
                logger.error("Missing webhook signature")
                return Response(
                    {"error": "Missing signature"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Get the raw request body
            payload = request.body
            if not payload:
                logger.error("Empty webhook payload")
                return Response(
                    {"error": "Empty payload"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify signature
            if not verify_webhook_signature(payload, signature):
                logger.error("Invalid webhook signature")
                return Response(
                    {"error": "Invalid signature"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Parse webhook data
            webhook_data = json.loads(payload)
            event_type = get_event_type(webhook_data)

            logger.info(f"Processing webhook event: {event_type}")

            # Initialize payment service
            payment_service = PaymentService()

            # Handle different event types
            if event_type == 'charge.success':
                payment_service.handle_successful_payment(webhook_data)
            elif event_type == 'charge.failed':
                payment_service.handle_failed_payment(webhook_data)
            else:
                logger.warning(f"Unhandled webhook event type: {event_type}")

            return Response(
                {"message": "Webhook processed successfully"},
                status=status.HTTP_200_OK
            )

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {str(e)}")
            return Response(
                {"error": "Invalid JSON"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentMethodView(generics.GenericAPIView):
    """Get available payment methods for a currency"""
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_query(self, request, *args, **kwargs):
        currency = request.query_params.get('currency', 'USD')

        # Get avaialble payment methods based on currency
        payment_methods = self.get_payment_methods(currency)

        return Response(payment_methods)
    

    def get_payment_methods(self, currency: str) -> Dict[str, Any]:
        """Get supported payment methods for currency"""
        if currency == 'USD':
            return {
                'methods': [{
                    'id': 'card',
                    'name': 'Card Payment',
                    'supported': True
                }]
            }
        
        return {
            'methods': [
                {
                    'id': 'card',
                    'name': 'Card Payment',
                    'supported': True
                },
                {
                    'id': 'bank',
                    'name': 'Bank Transfer',
                    'supported': True
                }
            ]
        }


class RefundPaymentView(generics.GenericAPIView):
    """Handle payment refunds"""
    serializer_class = PaymentRefundSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)

        # Only staff can initiate refunds
        if not request.user.is_staff:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(
            data=request.data,
            context={'payment': payment}
        )
        serializer.is_valid(raise_exception=True)

        try:
            payment_service = PaymentService()
            refund = payment_service.process_refund(
                payment=payment,
                amount=serializer.validated_data.get('amount'),
                reason=serializer.validated_data.get('reason')
            )

            return Response({
                'status': 'success',
                'refund': refund
            })

        except PaymentError as e:
            return Response({
                'error': str(e),
                'code': e.code
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Refund processing failed: {str(e)}")
            return Response({
                'error': 'Refund failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    