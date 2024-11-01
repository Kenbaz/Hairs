from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order
from .serializers import (
    OrderDetailSerializer,
    OrderListSerializer,
    CreateOrderSerializer
)
from django.core.mail import send_mail
from django.conf import settings


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order_status', 'payment_status']


    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        elif self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer
    

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Send order confirmation email
        send_order_confirmation_email(order)

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
    

    @action(detail=True, method=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.order_status != 'pending':
            return Response(
                {"error": "Only pending orders can be cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.order_status = 'cancelled'
        order.save()

        # Send cancellation email
        send_order_cancellation_email(order)

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_200_OK
        )

# Email helper functions
def send_order_confirmation_email(order):
    subject = f'Order Confirmation - Order #{order.id}'
    message = f"""
        Thank you for your order!

        Order Details:
        Order Number: {order.id}
        Total Amount: ${order.total_amount}
        Shipping Address: {order.shipping_address}

        We'll notify you when your order ships.
    """

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [order.user.email],
        fail_silently=False,
    )


def send_order_cancellation_email(order):
    subject = f'Order Cancelled - Order #{order.id}'
    message = f"""
    Your order has been cancelled.
    
    Order Details:
    Order Number: {order.id}
    Total Amount: ${order.total_amount}
    
    If you didn't request this cancellation, please contact our support team.
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [order.user.email],
        fail_silently=False,
    )