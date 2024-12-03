from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.http import HttpResponse
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Sum, Avg, F, Value
from django.db.models.functions import Concat
from django.utils import timezone
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta
from .serializers import (
    DashboardStatsSerializer,
    SalesAnalyticsSerializer,
    ProductAnalyticsSerializer,
    CustomerAnalyticsSerializer,
    AdminProductSerializer,
    AdminUserSerializer,
    AdminOrderSerializer
)
from products.models import Product, Category, ProductImage
from .utils.in_memory_file_upload import process_product_image
from orders.models import Order
from users.models import User
from reviews.models import Review
import csv
import xlsxwriter
from io import BytesIO
from .utils.pdf_generator import PDFGenerator
from .utils.data_formatters import PDFDataFormatter
from .serializers import AdminNotificationSerializer, AdminNotification
from django_filters.rest_framework import DjangoFilterBackend


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def get_permissions(self):
        if self.action in ['statistics', 'sales_analytics', 'product_analytics', 'export_data']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]


    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """ Get comprehensive dashboard statistics """
        today = timezone.now()
        thirty_days_ago = today - timedelta(days=30)
        last_month = today - timedelta(days=60)

        # Basic stats
        orders = Order.objects.all()
        recent_orders = orders.filter(created_at__gte=thirty_days_ago)

        # Calculate month-over-month growth
        current_month_sales = recent_orders.filter(
            payment_status=True
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        last_month_sales = orders.filter(
            created_at__range=[last_month, thirty_days_ago],
            payment_status=True
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        sales_growth = (
            ((current_month_sales - last_month_sales) / last_month_sales * 100)
            if last_month_sales > 0 else 0
        )

        # Aggregate all required statistics
        stats = {
            # Basic Stats
            'total_orders': orders.count(),
            'recent_orders': recent_orders.count(),
            'total_revenue': orders.filter(payment_status=True)
            .aggregate(total=Sum('total_amount'))['total'] or 0,
            'total_customers': User.objects.count(),
            'low_stock_products': Product.objects.filter(
                stock__lte=F('low_stock_threshold')).count(),
            'monthly_sales': current_month_sales,

            # Order Stats
            'pending_orders': orders.filter(order_status='pending').count(),
            'processing_orders': orders.filter(order_status='processing').count(),
            'shipped_orders': orders.filter(order_status='shipped').count(),
            'delivered_orders': orders.filter(order_status='delivered').count(),
            'cancelled_orders': orders.filter(order_status='cancelled').count(),

            # Product Stats
            'total_products': Product.objects.count(),
            'out_of_stock_products': Product.objects.filter(stock=0).count(),
            'featured_products': Product.objects.filter(is_featured=True).count(),

            # Customer Stats
            'active_customers': User.objects.filter(is_active=True).count(),
            'new_customers_this_month': User.objects.filter(
                    date_joined__gte=thirty_days_ago).count(),

            # Review Stats
            'total_reviews': Review.objects.count(),
            'average_rating': Review.objects.aggregate(
                    avg=Avg('rating'))['avg'] or 0,

            # Sales Stats
            'average_order_value': orders.filter(payment_status=True).aggregate(
                    avg=Avg('total_amount'))['avg'] or 0,
            'sales_growth': sales_growth
        }

        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def sales_analytics(self, request):
        """ Get detailed sales analytics """
        period = request.query_params.get('period', 'daily')
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)

        orders = Order.objects.filter(
            created_at__range=[start_date, end_date],
            payment_status=True
        )

        if period == 'daily':
            orders = orders.annotate(
                period=TruncDate('created_at')
            ).values('period').annotate(
                total_sales=Sum('total_amount'),
                order_count=Count('id')
            ).order_by('period')
        elif period == 'monthly':
            orders = orders.annotate(
                period=TruncDate('created_at')
            ).values('period').annotate(
                total_sales=Sum('total_amount'),
                order_count=Count('id')
            ).order_by('period')
        
        data = {
            'period': period,
            'data': list(orders),
            'total_sales': sum(item['total_sales'] for item in orders),
            'order_count': sum(item['order_count'] for item in orders),
            'average_order_value': (
                sum(item['total_sales'] for item in orders) / sum(item['order_count'] for item in orders) if orders else 0
            )
        }

        serializer = SalesAnalyticsSerializer(data)
        return Response(serializer.data)
    

    @action(detail=False, methods=['get'])
    def product_analytics(self, request):
        """ Get product performance analytics """

        # Best sellers
        best_sellers = Product.objects.annotate(
            total_sold=Count('orderitem')
        ).order_by('-total_sold')[:10]

        # Low stock alerts
        low_stock = Product.objects.filter(
            stock__lte=F('low_stock_threshold')
        ).annotate(
            days_to_stockout=F('stock') / (Count('orderitem') / 30.0)
        )

        # Category distribution
        category_distribution = Category.objects.annotate(
            product_count=Count('products')
        ).values('name', 'product_count')

        # Revenue by category
        revenue_by_category = Category.objects.annotate(
            revenue=Sum(
                F('products__orderitem__quantity') *
                F('products__orderitem__price'),
                default=0
            )
        ).values('name', 'revenue')

        data = {
            'best_sellers': AdminProductSerializer(best_sellers, many=True).data,
            'low_stock_alerts': AdminProductSerializer(low_stock, many=True).data,
            'category_distribution': {
                item['name']: item['product_count'] for item in category_distribution
            },
            'revenue_by_category': {
                item['name']: item['revenue'] or 0 for item in revenue_by_category
            }
        }

        serializer = ProductAnalyticsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)
    

    @action(detail=False, methods=['get'])
    def customer_analytics(self, request):
        """ Get customer behavior analytics """
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # New vs returning customers
        new_customers = User.objects.filter(
            date_joined__gte=thirty_days_ago
        ).count()
        returning_customers = User.objects.filter(
            order__created_at__gte=thirty_days_ago
        ).distinct().count() - new_customers

        # Customer growth
        customer_growth = User.objects.annotate(
            joined_date=TruncDate('date_joined')
        ).values('join_date').annotate(
            count=Count('id')
        ).order_by('join_date')

        # Top customers by spending
        top_customers = User.objects.annotate(
            total_spent=Sum('order__total_amount')
        ).order_by('-total_spent')[:10]

        # Customer locations
        customer_locations = User.objects.values(
            'country'
        ).annotate(
            count=Count('id')
        ).order_by('-count')

        data = {
            'new_vs_returning': {
                'new': new_customers,
                'returning': returning_customers
            },
            'customer_growth': list(customer_growth),
            'top_customers': AdminUserSerializer(top_customers, many=True).data,
            'customer_locations': {
                item['country']: item['count'] for item in customer_locations if item['country']
            }
        }

        serializer = CustomerAnalyticsSerializer(data)
        return Response(serializer.data)
    

    @action(detail=False, methods=['get'])
    def export_data(self, request):
        """
        Export dashboard data in various formats
        Query Parameters:
        - type: sales, products, orders, customers
        - format: csv, excel, pdf
        - date_from: YYYY-MM-DD (optional)
        - date_to: YYYY-MM-DD (optional)
        """
        data_type = request.query_params.get('type', 'sales')
        export_format = request.query_params.get('format', 'csv')

        # Parse date range
        try:
            date_from = datetime.strptime(
                request.query_params.get('date_from', ''),
                '%Y-%m-%d'
            ).date() if request.query_params.get('date_from') else None

            date_to = datetime.strptime(
                request.query_params.get('date_to', ''),
                '%Y-%m-%d'
            ).date() if request.query_params.get('date_to') else None
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get data based on type
        try:
            data = self._get_export_data(data_type, date_from, date_to)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Export in requested format
        if export_format == 'csv':
            return self._export_csv(data, data_type)
        elif export_format == 'excel':
            return self._export_excel(data, data_type)
        elif export_format == 'pdf':
            return self._export_pdf(data, data_type)
        else:
            return Response(
                {'error': 'Unsupported format'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _get_export_data(self, data_type, date_from=None, date_to=None):
        """Get data for export based on type and date range"""
        if date_to:
            date_to = datetime.combine(date_to, datetime.max.time())
        if date_from:
            date_from = datetime.combine(date_from, datetime.min.time())

        if data_type == 'sales':
            queryset = Order.objects.filter(payment_status=True)
            if date_from:
                queryset = queryset.filter(created_at__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__lte=date_to)

            data = queryset.values(
                'id', 'created_at', 'user__email',
                'total_amount', 'order_status'
            ).annotate(
                items_count=Count('items'),
                customer_name=Concat(
                    'user__first_name', Value(' '), 'user__last_name'
                )
            )

            return [{
                'Order ID': item['id'],
                'Date': item['created_at'].strftime('%Y-%m-%d %H:%M:%S'),
                'Customer': item['customer_name'],
                'Email': item['user__email'],
                'Amount': item['total_amount'],
                'Status': item['order_status'],
                'Items': item['items_count']
            } for item in data]

        elif data_type == 'products':
            queryset = Product.objects.all()
            data = queryset.values(
                'id', 'name', 'category__name',
                'price', 'discount_price', 'stock', 'created_at'
            ).annotate(
                total_sold=Count('orderitem'),
                revenue=Sum('orderitem__price')
            )

            return [{
                'Product ID': item['id'],
                'Name': item['name'],
                'Category': item['category__name'],
                'Price': item['price'],
                'Discount Price': item['discount_price'] or '',
                'Stock': item['stock'],
                'Total Sold': item['total_sold'],
                'Revenue': item['revenue'] or 0,
                'Created At': item['created_at'].strftime('%Y-%m-%d')
            } for item in data]

        elif data_type == 'orders':
            queryset = Order.objects.all()
            if date_from:
                queryset = queryset.filter(created_at__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__lte=date_to)

            data = queryset.values(
                'id', 'created_at', 'user__email', 'total_amount',
                'order_status', 'payment_status', 'shipping_address'
            )

            return [{
                'Order ID': item['id'],
                'Date': item['created_at'].strftime('%Y-%m-%d %H:%M:%S'),
                'Customer Email': item['user__email'],
                'Total Amount': item['total_amount'],
                'Status': item['order_status'],
                'Payment Status': 'Paid' if item['payment_status'] else 'Pending',
                'Shipping Address': item['shipping_address']
            } for item in data]

        else:
            raise ValueError(f"Unsupported data type: {data_type}")

    def _export_csv(self, data, data_type):
        """Export data as CSV"""
        if not data:
            return Response(
                {"error": "No data to export"},
                status=status.HTTP_404_NOT_FOUND
            )

        output = BytesIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

        response = HttpResponse(
            output.getvalue(),
            content_type='text/csv'
        )
        response['Content-Disposition'] = (
            f'attachment; filename="{data_type}_export_{
                datetime.now().strftime("%Y%m%d")}.csv"'
        )
        return response
    

    def _export_excel(self, data, data_type):
        """Export data as Excel"""
        if not data:
            return Response(
                {"error": "No data to export"},
                status=status.HTTP_404_NOT_FOUND
            )

        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet()

        # Add headers
        headers = list(data[0].keys())
        for col, header in enumerate(headers):
            worksheet.write(0, col, header)

        # Add data
        for row, item in enumerate(data, start=1):
            for col, header in enumerate(headers):
                worksheet.write(row, col, item[header])

        workbook.close()
        output.seek(0)

        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = (
            f'attachment; filename="{data_type}_export_{
                datetime.now().strftime("%Y%m%d")}.xlsx"'
        )
        return response
    

    def _export_pdf(self, data, data_type):
        """ Export data as PDF """
        if not data:
            return Response(
                {"error": "No data to export"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Format data for PDF
        formatter = PDFDataFormatter()
        format_method = getattr(formatter, f"format_{data_type}_data")
        formatted_data = format_method(data)

        # Generate PDF
        pdf_generator = PDFGenerator(data_type)
        pdf_buffer = pdf_generator.generate(formatted_data)

        # Create response
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="{data_type}_report_{datetime.now().strftime("%Y%m%d")}.pdf"'
        )
        return response


class AdminProductViewSet(viewsets.ModelViewSet):
    """ViewSet for managing products in admin panel"""
    permission_classes = [IsAdminUser]

    serializer_class = AdminProductSerializer

    parser_classes = (MultiPartParser, FormParser)

    queryset = Product.objects.all()

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]

    search_fields = [
        'name',
        'description', 
        'category__name',
        'hair_type',
    ]

    filterset_fields = {
        'hair_type': ['exact'],
        'is_featured': ['exact'],
        'is_available': ['exact'],
        'stock': ['gt', 'lt', 'exact'],
        'price': ['gt', 'lt', 'exact'],
    }
    ordering_fields = ['name', 'price', 'stock', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Product.objects.all().select_related('category')

        # Handle category filtering explicitly
        category_name = self.request.query_params.get('category')
        if category_name:
            queryset = queryset.filter(category__name__icontains=category_name)

        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status')
        if stock_status == 'low_stock':
            queryset = queryset.filter(stock__lte=F('low_stock_threshold'))
        elif stock_status == 'out_of_stock':
            queryset = queryset.filter(stock=0)
        elif stock_status == 'in_stock':
            queryset = queryset.filter(
                stock__gt=0
            ).exclude(stock__lte=F('low_stock_threshold'))

        # Price range filtering
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        return queryset
    

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            # Extract image files from request
            product_images = request.FILES.getlist('product_images')

            # Create product first
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            product = serializer.save()

            # Process and save images
            for index, image in enumerate(product_images):
                try:
                    processed_image = process_product_image(image)
                    ProductImage.objects.create(
                        product=product,
                        image=processed_image,
                        is_primary=(index == 0)
                    )
                   
                except Exception as img_error:
                    raise

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            # If something goes wrong, make sure to clean up any saved files
            if 'product' in locals():
                product.delete()  # This will also delete associated images
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()

            # Extract image files
            product_images = request.FILES.getlist('product_images')

            # Update product data
            serializer = self.get_serializer(
                instance,
                data=request.data,
                partial=kwargs.pop('partial', False)
            )
            serializer.is_valid(raise_exception=True)
            product = serializer.save()

            # Handle new images
            if product_images:
                for index, image in enumerate(product_images):
                    try:
                        processed_image = process_product_image(image)
                        # if there is no existing images, make the first new image primary
                        is_primary = index == 0 and not product.images.exists()
                        ProductImage.objects.create(
                            product=product,
                            image=processed_image,
                            is_primary=is_primary
                        )
                    except Exception as img_error:
                        raise

            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    

    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        """ Endpoint for uploading additional images to existing product """
        product = self.get_object()
        product_images = request.FILES.getlist('images')

        if not product_images:
            return Response(
                {'error': 'No images provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                saved_images = []
                for index, image in enumerate(product_images):
                    processed_image = process_product_image(image)
                    # Make first image primary if no image exists
                    is_primary = index == 0 and not product.images.exists()

                    product_image = ProductImage.objects.create(
                        product=product,
                        image=processed_image,
                        is_primary=is_primary
                    )
                    saved_images.append(product_image)

                    return Response({
                        'message': f'{len(saved_images)} images uploaded successfully',
                        'images': ProductImageSerializer(saved_images, many=True).data
                    }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    

    @action(detail=True, methods=['post'])
    def manage_images(self, request, pk=None):
        """
        Manage product images (delete, reorder, set primary)
        Expects a request body like:
        {
            'action': 'delete' | 'set_primary' | 'reorder',
            'image_ids': [1, 2, 3],  // Used for deletion or reordering
            'primary_image_id': 1,   // Used for setting primary image
        }
        """
        product = self.get_object()
        admin_action = request.data.get('action')

        try:
            with transaction.atomic():
                if admin_action == 'delete':
                    image_ids = request.data.get('image_ids', [])
                    # Ensure the deletion of images that belong to this product
                    images_to_delete = product.images.filter(id__in=image_ids)
                    deleted_count = images_to_delete.count()
                    images_to_delete.delete()

                    # if the primary image was deleted, set a new one
                    if not product.images.filter(is_primary=True).exists() and product.images.exists():
                        first_image = product.images.first()
                        first_image_is_primary = True
                        first_image.save()

                    return Response({
                        'message': f'{deleted_count} images deleted successfully'
                    })
                
                elif admin_action == 'set_primary':
                    image_id = request.data.get('primary_image_id')
                    if not image_id:
                        raise ValidationError('Primary_image_id is required')
                    
                    # Update primary image
                    product.images.filter(is_primary=True).update(is_primary=False)
                    new_primary = product.images.filter(id=image_id).first()
                    if not new_primary:
                        raise ValidationError('Image not found')
                    
                    new_primary.is_primary = True
                    new_primary.save()

                    return Response({
                        'message': 'Primary image saved successfully'
                    })
                
                return Response(
                    {'error': 'Invalid action'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Toggle featured status of a product"""
        product = self.get_object()
        product.is_featured = not product.is_featured
        product.save()
        return Response({
            'status': 'success',
            'is_featured': product.is_featured
        })

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """Update product stock"""
        product = self.get_object()
        new_stock = request.data.get('stock')
        if new_stock is not None:
            try:
                new_stock = int(new_stock)
                if new_stock < 0:
                    return Response(
                        {'error': 'Stock cannot be negative'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                product.update_stock(
                    quantity_changed=new_stock - product.stock,
                    transaction_type='adjustment',
                    user=request.user,
                    notes=request.data.get(
                        'notes', 'Stock adjusted via admin panel')
                )
                return Response({
                    'status': 'success',
                    'new_stock': product.stock
                })
            except ValueError:
                return Response(
                    {'error': 'Invalid stock value'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(
            {'error': 'Stock value not provided'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for managing orders in admin panel"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    queryset = Order.objects.all()

    def get_queryset(self):
        queryset = Order.objects.all().select_related('user')

        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(order_status=status)

        # Filter by payment status
        payment_status = self.request.query_params.get('payment_status')
        if payment_status is not None:
            queryset = queryset.filter(
                payment_status=payment_status.lower() == 'true'
            )

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(Order.ORDER_STATUS_CHOICES):
            order.order_status = new_status
            order.save()
            return Response({
                'status': 'success',
                'new_status': order.order_status
            })
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminUserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users in admin panel"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()

    def get_queryset(self):
        queryset = User.objects.all()

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Filter by verified email status
        verified_email = self.request.query_params.get('verified_email')
        if verified_email is not None:
            queryset = queryset.filter(
                verified_email=verified_email.lower() == 'true'
            )

        # Filter by join date
        date_joined_after = self.request.query_params.get('joined_after')
        if date_joined_after:
            queryset = queryset.filter(date_joined__gte=date_joined_after)

        return queryset.order_by('-date_joined')

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'status': 'success',
            'is_active': user.is_active
        })

    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        """Get user's purchase history"""
        user = self.get_object()
        orders = Order.objects.filter(user=user).order_by('-created_at')
        return Response({
            'total_orders': orders.count(),
            'total_spent': orders.filter(payment_status=True).aggregate(
                total=Sum('total_amount')
            )['total'] or 0,
            'orders': AdminOrderSerializer(orders, many=True).data
        })


class AdminNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = AdminNotificationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return AdminNotification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
