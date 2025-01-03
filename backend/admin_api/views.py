# admin_api/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
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
from .utils.invoice_generator import InvoiceGenerator
from .serializers import AdminNotificationSerializer, AdminNotification, AdminCategorySerializer
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import ProductImageSerializer
import logging
from django.db.models.functions import Greatest
from .pagination import AdminPagination
from currencies.utils import CurrencyConverter, CurrencyConversionError
from .serializers import (
    CurrencySerializer,
    CurrencyConversionSerializer,
    ExchangeRateUpdateSerializer,
    CurrencyInfoSerializer
)
from rest_framework.filters import SearchFilter, OrderingFilter
from returns.models import Return, ReturnHistory, ReturnPolicy, ProductReturnPolicy
from django.shortcuts import get_object_or_404
from returns.serializers import ReturnSerializer, ProductReturnPolicySerializer, ReturnPolicySerializer
from currencies.models import Currency
from decimal import Decimal
from django.core.cache import cache
from django.db.models import Q


logger = logging.getLogger(__name__)


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
        try :
            # Best sellers
            best_sellers = Product.objects.annotate(
                total_sold=Count('orderitem')
            ).order_by('-total_sold')[:10]

            # Low stock alerts
            low_stock = Product.objects.filter(
                stock__lte=F('low_stock_threshold')
            ).annotate(
                days_to_stockout=F('stock') /
                (Greatest(Count('orderitem'), 1) / 30.0)
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
        except Exception as e:
            # Add logging here
            logger.error(f"Error in product_analytics: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

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


class AdminCategoryViewSet(viewsets.ModelViewSet):
    print('Categories views')
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()
    pagination_class = None

    def get_queryset(self):
        queryset = Category.objects.all()

        # Add search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.order_by('name')

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get products in this category"""
        category = self.get_object()
        products = category.products.all()
        serializer = AdminProductSerializer(products, many=True)
        return Response(serializer.data)


class AdminProductViewSet(viewsets.ModelViewSet):
    """ViewSet for managing products in admin panel"""
    permission_classes = [IsAdminUser]

    serializer_class = AdminProductSerializer

    parser_classes = (MultiPartParser, FormParser, JSONParser)

    pagination_class = AdminPagination

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
    def create(self, request):
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
        
        logger.info(f"Received upload request for product {pk}")
        logger.info(f"Files in request: {request.FILES.keys()}")

        product = self.get_object()
        product_images = request.FILES.getlist('product_images')

        logger.info(f"Found {len(product_images)} images to process")

        if not product_images:
            return Response(
                {'error': 'No images provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                saved_images = []
                for index, image in enumerate(product_images):
                    print(f"Processing image: {image.name}")  # Debug print
                    processed_image = process_product_image(image)
                    # Make first image primary if no image exists
                    is_primary = index == 0 and not product.images.exists()

                    product_image = ProductImage.objects.create(
                        product=product,
                        image=processed_image,
                        is_primary=is_primary
                    )
                    saved_images.append(product_image)
                    print(f"Saved {len(saved_images)} images")  # Debug print

                    serializer = ProductImageSerializer(saved_images, many=True)
                    return Response({
                        'message': f'{len(saved_images)} images uploaded successfully',
                        'images': serializer.data
                    }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def manage_image(self, request, pk=None):
        """
        Manage product images (delete, set primary)
        """
        
        logger.info("Starting manage_image function")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Request data: {request.data}")  # Keep only this data logging

        try:
            product = self.get_object()
            logger.info("Product retrieved successfully")

            # Make a copy of request.data for logging
            request_data = request.data.copy()
            logger.info(f"Processed request data: {request_data}")

            # Check if request.data is empty or None
            if not request_data:
                logger.error("No data provided in request")
                return Response(
                    {'error': 'No data provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            action = request_data.get('action')
            logger.info(f"Action extracted: {action}")

            if not action:
                logger.error("No action specified in request data")
                return Response(
                    {'error': 'Action not specified'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if action == 'delete':
                image_ids = request_data.get('image_ids', [])
                logger.info(f"Image IDs to delete: {image_ids}")

                if not isinstance(image_ids, list):
                    image_ids = [image_ids]  # Convert single ID to list

                if not image_ids:
                    return Response(
                        {'error': 'No images specified for deletion'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                deleted_count = 0
                for image_id in image_ids:
                    try:
                        image = product.images.get(id=image_id)
                        logger.info(f"Found image {image_id}, preparing to delete")
                        if image.image:
                            image.image.close()
                        image.delete()
                        deleted_count += 1
                        logger.info(f"Successfully deleted image {image_id}")
                    except ProductImage.DoesNotExist:
                        logger.warning(f"Image {image_id} not found")
                        continue

                return Response({
                    'message': f'{deleted_count} images deleted successfully'
                })

            elif action == 'set_primary':
                image_id = request_data.get('primary_image_id')
                if not image_id:
                    return Response(
                        {'error': 'Primary image ID is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                with transaction.atomic():
                    product.images.filter(is_primary=True).update(is_primary=False)
                    try:
                        new_primary = product.images.get(id=image_id)
                        new_primary.is_primary = True
                        new_primary.save()
                    except ProductImage.DoesNotExist:
                        return Response(
                            {'error': 'Image not found'},
                            status=status.HTTP_404_NOT_FOUND
                        )

                return Response({
                    'message': 'Primary image updated successfully'
                })

            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.error(f"Exception in manage_image: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
    

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def bulk_delete(self, request):
        """ Handle bulk deletion of products with transaction support """
        logger.info(f"Received bulk delete request. Data: {request.data}")
        product_ids = request.data.get('product_ids', [])

        logger.info(f"Extracted product_ids: {product_ids}")
        
        if not product_ids:
            logger.warning("No product_ids provided in request")
            return Response(
                {'error': 'No products specified for deletion'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get products that exists and are deletable
            products = Product.objects.filter(id__in=product_ids).select_related('category')
            found_count = products.count()

            if found_count == 0:
                return Response(
                    {'error': 'None of the specified products were found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            logger.info(
                f"Attempting to delete {found_count} products: {[product.id for product in products]}"
            )

            # Check if any of the products are associated with orders
            products_with_orders = products.filter(orderitem__isnull=False).distinct()
            if products_with_orders.exists():
                logger.warning(
                    f"Deletion blocked - Products with orders exists: {[product.id for product in products_with_orders]}"
                )
                return Response({
                    'error': 'Some products cannot be deleted as they have associated orders',
                    'products': AdminProductSerializer(products_with_orders, many=True).data
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Store product details for logging
            deletion_details = [
                {
                    'id': product.id,
                    'name': product.name,
                    'category': product.category.name if product.category else None
                } for product in products
            ]

            # Delete products
            deletion_count = products.count()
            products.delete()

            logger.info(
                f"Successfully deleted {deletion_count} products: {deletion_details}"
            )

            return Response({
                'message': f'{deletion_count} products deleted successfully',
                'deleted_products': deletion_count,
                'details': deletion_details
            })
        
        except Exception as e:
            logger.error(f"Bulk deletion failed: {str(e)}", exc_info=True)
            return Response(
                {
                    'error': 'Failed to delete products',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for managing orders in admin panel"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    search_fields = ['id', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    queryset = Order.objects.all()

    def get_queryset(self):
        queryset = Order.objects.all().select_related('user').prefetch_related('items', 'items__product')

        # Handle search
        search = self.request.query_params.get('search')
        
        if search:
            queryset = queryset.filter(
                Q(id__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )


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
        tracking_number = request.data.get('tracking_number')

        if new_status in dict(Order.ORDER_STATUS_CHOICES):
            order.order_status = new_status
            order.save()
            return Response({
                'status': 'success',
                'new_status': order.order_status
            })
        
        if tracking_number:
            order.tracking_number = tracking_number
            order.save()
            return Response({
                'status': 'success',
                'tracking_number': order.tracking_number
            })
        
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        order = self.get_object()

        try:
            order.cancel_order(request.user)
            return Response({
                'status': 'success',
                'message': 'Order cancelled successfully'
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    

    @action(detail=True, methods=['post'])
    def update_order_refund(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('refund_status')

        if new_status not in dict(Order.REFUND_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid refund status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.refund_status = new_status
        order.save()

        return Response({
            'status': 'success',
            'refund_status': new_status
        })
    

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        """ Generate invoice for order """
        order = self.get_object()
        logger.info(f"Generating invoice for order {order.id}")

        try:
            invoice_pdf = InvoiceGenerator(order).generateInvoice()

            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f"attachment; filename=invoice_{order.id}.pdf"
            response.write(invoice_pdf)

            logger.info(f"Successfully generated invoice for order {order.id}")
            return response
        except ImportError as e:
            logger.error(f"Invoice generation failed - Missing dependencies: {str(e)}")
            return Response(
                {'error': 'Invoice generation is not available - Missing dependencies'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            logger.error(f"Invoice generation failed for order {order.id}: {str(e)}", 
                        exc_info=True)
            return Response(
                {'error': f'Failed to generate invoice: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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


class AdminCurrencyViewSet(viewsets.ModelViewSet):
    """ ViewSet for managing currencies in admin panel """
    permission_classes = [IsAdminUser]
    serializer_class = CurrencySerializer
    queryset = Currency.objects.all()

    def get_queryset(self):
        """ Filter queryset based on active status """
        queryset = Currency.objects.all()
        is_active = self.request.query_params.get('is_active')

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('code')


    @action(detail=False)
    def active(self, request):
        """ Get active currencies with their info """
        try:
            currencies = CurrencyConverter.get_active_currencies()
            serializer = CurrencyInfoSerializer(currencies.values(), many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in fetching active currencies: {e}")
            return Response(
                {'error': 'Failed to fetch active currencies'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

    @action(detail=False, methods=['post'])
    def convert(self, request):
        """ Convert amount from one currency to another """
        serializer = CurrencyConversionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = CurrencyConverter.convert_price(
                amount=serializer.validated_data['amount'],
                from_currency=serializer.validated_data['from_currency'],
                to_currency=serializer.validated_data['to_currency']
            )

            formatted = CurrencyConverter.format_price(
                amount=result,
                currency_code=serializer.validated_data['to_currency']
            )

            return Response({
                'amount': result,
                'formatted': formatted
            })
        except CurrencyConversionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Currency conversion failed: {e}")
            return Response(
                {'error': 'Currency conversion failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

    @action(detail=True, methods=['patch'])
    def update_rate(self, request, pk=None):
        """ Update exchange rate for a specific currency """
        currency = self.get_object()
        
        # Prevent updating USD exchange rate
        if currency.code == 'USD':
            return Response(
                {'error': 'Cannot modify USD exchange rate'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ExchangeRateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Validate new exchange rate
            new_rate = Decimal(str(serializer.validated_data['exchange_rate']))
            CurrencyConverter.validate_exchange_rate(new_rate)

            # Update exchange rate
            currency.exchange_rate = new_rate
            currency.save()

            # Clear currency cache
            cache.delete('active_currencies')

            return Response(CurrencySerializer(currency).data)
        except CurrencyConversionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Failed to update exchange rate: {e}")
            return Response(
                {'error': 'Failed to update exchange rate'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """ Toggle currency active status """
        currency = self.get_object()

        # Prevent deactivating USD
        if currency.code == 'USD':
            return Response(
                {'error': 'Cannot deactivate USD currency'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            currency.is_active = not currency.is_active
            currency.save()

            # Clear currency cache
            cache.delete('active_currencies')

            return Response({
                'status': 'success',
                'is_active': currency.is_active
            })
        except Exception as e:
            logger.error(f"Failed to toggle currency status: {e}")
            return Response(
                {'error': 'Failed to toggle currency status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

    def destroy(self, request, *args, **kwargs):
        """ Prevent deletion of USD """
        currency = self.get_object()
        if currency.code == 'USD':
            return Response(
                {'error': 'Cannot delete USD currency'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


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
        new_status = request.data.get('status')
        print('data', request.data)
        print('new_status', new_status)
        notes = request.data.get('notes', '')

        if new_status not in dict(Return.RETURN_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return_request.return_status = new_status
        return_request.updated_by = request.user
        return_request.save()

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


    @action(detail=True, methods=['get'])
    def receive_items(self, request, pk=None):
        return_request = self.get_object()

        try:
            return_request.mark_items_received(request.user)
            return Response({
                'status': 'success',
                'message': 'Items marked as received'
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminReturnPolicyViewset(viewsets.ModelViewSet):
    """ Viewset for managing return policies in admin panel """
    permission_classes = [IsAdminUser]
    serializer_class = ReturnPolicySerializer

    def get_queryset(self):
        return ReturnPolicy.objects.all()
    

    @action(detail=False, methods=['patch'])
    def global_policy(self, request):
        """Update global return policy"""
        policy = ReturnPolicy.objects.first()
        if not policy:
            policy = ReturnPolicy.objects.create()

        serializer = self.get_serializer(policy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
    

    @action(detail=False)
    def product_policies(self, request):
        """Get product-specific return policies"""
        product_id = request.query_params.get('product_id')
        queryset = ProductReturnPolicy.objects.all()

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        serializer = ProductReturnPolicySerializer(queryset, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['patch'])
    def update_product_policy(self, request):
        """Update product-specific return policy"""
        product_id = request.data.get('product')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product_policy = ProductReturnPolicy.objects.get(product_id=product_id)
        except ProductReturnPolicy.DoesNotExist:
            return Response(
                {'error': 'Product policy not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductReturnPolicySerializer(
            product_policy,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
    

    @action(detail=False, methods=['post'])
    def create_global_policy(self, request):
        """ Create initial global return policy is none exists """
        if ReturnPolicy.objects.exists():
            return Response(
                {'error': 'Global return policy already exists, use update instead'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    

    @action(detail=False, methods=['post'])
    def create_product_policy(self, request):
        """ Create product-specific return policy """
        product_id = request.data.get('product')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if policy already exists for this product
        if ProductReturnPolicy.objects.filter(product_id=product_id).exists():
            return Response(
                {'error': f'Return policy already exists for product {product_id}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate product exists
        try:
            product = Product.objects.get(id=product_id)
        except product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProductReturnPolicySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    

    @action(detail=False, methods=['delete'])
    def delete_product_policy(self, request):
        """ Delete product-specific return policy """
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            policy = ProductReturnPolicy.objects.get(product_id=product_id)
            policy.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProductReturnPolicy.DoesNotExist:
            return Response(
                {'error': 'Product policy not found'},
                status=status.HTTP_404_NOT_FOUND
            )
