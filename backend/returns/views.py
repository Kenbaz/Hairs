# returns/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from orders.models import Order
from .models import Return, ReturnHistory, ReturnItem, ReturnImage, ReturnPolicy, ProductReturnPolicy
from .serializers import ReturnSerializer, ReturnRequestSerializer, ReturnPolicySerializer, ReturnPolicyDetailSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .utils import notify_admins_of_return_request, send_return_status_email, ReturnEligibilityChecker


class AdminReturnViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = ReturnSerializer
    queryset = Return.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['return_status', 'refund_status']
    search_fields = [
        'order__id',
        'user__email',
        'user__first_name',
        'user__last_name'
    ]
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


    def get_queryset(self):
        queryset = Return.objects.all()

        # Date filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        return queryset


    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        return_request = self.get_object()
        new_status = request.data.get('return_status')
        notes = request.data.get('notes', '')

        if new_status not in dict(Return.RETURN_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return_request.return_status = new_status
        return_request.updated_by = request.user
        return_request.save()

        # Send status update email to customer
        send_return_status_email(return_request)

        # Create history entry
        ReturnHistory.objects.create(
            return_request=return_request,
            status=new_status,
            notes=notes,
            created_by=request.user
        )

        serializer = self.get_serializer(return_request)
        return Response(serializer.data)


    @action(detail=True, methods=['patch'])
    def update_refund(self, request, pk=None):
        return_request = self.get_object()
        new_status = request.data.get('refund_status')
        refund_amount = request.data.get('refund_amount')

        if new_status not in dict(Return.REFUND_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid refund status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if refund_amount:
            return_request.refund_amount = refund_amount
        return_request.refund_status = new_status
        return_request.updated_by = request.user
        return_request.save()

        # Create history entry
        ReturnHistory.objects.create(
            return_request=return_request,
            status=f"Refund {new_status}",
            notes=f"Refund amount: ${refund_amount}" if refund_amount else "",
            created_by=request.user
        )

        serializer = self.get_serializer(return_request)
        return Response(serializer.data)


class CustomerReturnViewset(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ReturnRequestSerializer

    def get_queryset(self):
        return Return.objects.filter(user=self.request.user)
    

    @action(detail=False, methods=['post'])
    def submit_request(self, request):
        """
        Submit a new return request for a delivered order
        """
        # Get order and validate it's eligible for return
        order_id = request.data.get('order_id')
        order = get_object_or_404(Order, id=order_id, user=request.user)

        # Check return eligibility
        checker = ReturnEligibilityChecker(order)
        if not checker.is_eligible_for_return():
            return Response({
                'error': 'Order not eligible for return',
                'details': checker.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get returnable items
        returnable_items = checker.get_returnable_items()
        
        # Validate requested items are returnable
        requested_items = request.data.get('items', [])
        for item in requested_items:
            product_id = item.get('product_id')
            if not any(r['item'].product.id == product_id for r in returnable_items):
                return Response({
                    'error': f'Product {product_id} is not eligible for return'
                }, status=status.HTTP_400_BAD_REQUEST)

        
        # Create return request with initial data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return_request = serializer.save(
            user=request.user,
            order=order,
            return_status='pending'
        )

        # Send confirmation email to customer
        send_return_status_email(return_request)

        # Notify admins of new return request
        notify_admins_of_return_request(return_request)

        # Handle return items
        items_data = request.data.get('items', [])
        for item in items_data:
            ReturnItem.objects.create(
                return_request=return_request,
                product_id=item['product_id'],
                quantity=item['quantity'],
                reason=item['reason'],
                condition=item['condition']
            )

        # Handle images if provided
        images = request.FILES.getlist('images')
        for image in images:
            ReturnImage.objects.create(
                return_item_id=item['product_id'],
                image=image
            )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['get'])
    def eligible_orders(self, request):
        """ Get orders eligible for return """
        eligible_orders = Order.objects.filter(
            user=request.user,
            order_status = 'delivered',
        ).exclude(
            returns__isnull=False
        )

        return Response({
            'orders': [
                {
                    'id': order.id,
                    'order_date': order.created_at,
                    'total_amount': order.total_amount,
                    'items': [
                        {
                            'id': item.id,
                            'product_name': item.product.name,
                            'quantity': item.quantity,
                            'price': item.price
                        } for item in order.items.all()
                    ]
                } for order in eligible_orders
            ]
        })


class ReturnPolicyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing return policies. Only admin users can modify policies
    through the admin interface.
    """
    serializer_class = ReturnPolicySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return ReturnPolicy.objects.all()
    

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current global return policy"""
        policy = ReturnPolicy.objects.first()
        if not policy:
            return Response(
                {'error': 'No return policy configured'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(ReturnPolicySerializer(policy).data)


    @action(detail=False, methods=['get'])
    def product_policy(self, request):
        """Get return policy details for a specific product"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        global_policy = ReturnPolicy.objects.first()
        if not global_policy:
            return Response(
                {'error': 'No global return policy configured'},
                status=status.HTTP_404_NOT_FOUND
            )

        product_policy = ProductReturnPolicy.objects.filter(
            product_id=product_id
        ).first()

        policy_data = {
            'global_policy': global_policy,
            'product_policy': product_policy
        }

        serializer = ReturnPolicyDetailSerializer(policy_data)
        return Response(serializer.data)
