# orders/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order
from cart.models import Cart
from shipping.models import ShippingRate
from .serializers import (
    OrderDetailSerializer,
    OrderListSerializer,
    CreateOrderSerializer
)
from .utils import send_order_status_email


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order_status', 'payment_status']


    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=user)
    
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        elif self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer
    
    
    def get_permissions(self):
        if self.action in ['update_status']:
            return [IsAdminUser()]
        return super().get_permissions()
    
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        # Get currency from request or use default
        currency_code = request.data.get('currency', 'USD')

        # Calculate shipping fee
        cart = Cart.objects.get(user=request.user)

        try:
            shipping_rate = ShippingRate.objects.get(
                currency_code=currency_code,
                is_active=True
            )
            shipping_fee = shipping_rate.flat_rate
        except ShippingRate.DoesNotExist:
            shipping_fee = 0
        
        # Include shipping fee in the context for use in serializer's create method
        serializer.context['shipping_fee'] = shipping_fee

        order = serializer.save()

        # Send order confirmation email
        send_order_status_email(order)

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
    
    
    def reduce_stock_on_create(self, serializer):
        order = serializer.save()

        # Reduce stock for each ordered item
        for item in order.items.all():
            item.product.update_stock(
                quantity_changed = item.quantity,
                transaction_type = 'order',
                order=order,
                user=self.request.user,
                notes=f"Stock reduced from new order #{order.id}"
            )

    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Admin endpoint to update order status and notify customer"""
        order = self.get_object()
        new_status = request.data.get('status')
        tracking_number = request.data.get('tracking_number')

        if new_status not in dict(Order.ORDER_STATUS_CHOICES):
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order status
        old_status = order.order_status
        order.order_status = new_status
        if tracking_number:
            order.tracking_number = tracking_number
        order.save()

        # Send notification
        if new_status != old_status:
            send_order_status_email(order)

        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.order_status != 'pending':
            return Response(
                {"error": "Only pending orders can be cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.order_status = 'cancelled'
        order.save()

        # Use the same email function with cancelled status
        send_order_status_email(order)

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_200_OK
        )
