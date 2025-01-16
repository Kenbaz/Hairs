# admin_api/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes
from django.core.files.storage import default_storage
from django.core.mail import EmailMessage
from django.core.exceptions import ValidationError
from django.template.loader import render_to_string
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.http import HttpResponse
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Sum, Avg, F, Value, ExpressionWrapper, FloatField
from django.db.models.functions import Concat, TruncMonth, TruncDate, ExtractDay, ExtractHour
from django.utils import timezone
from datetime import datetime, timedelta
from .serializers import (
    DashboardStatsSerializer,
    SalesAnalyticsSerializer,
    ProductAnalyticsSerializer,
    CustomerAnalyticsSerializer,
    AdminProductSerializer,
    AdminUserSerializer,
    AdminOrderSerializer,
    CurrencySerializer,
    CurrencyConversionSerializer,
    ExchangeRateUpdateSerializer,
    CurrencyInfoSerializer,
    AdminEmailSerializer,
    AdminEmailTemplateSerializer,
    AdminNotificationSerializer,
    AdminNotification, 
    AdminCategorySerializer,
    ProductImageSerializer
)
from products.models import Product, Category, ProductImage, FlashSale, FlashSaleProduct
from products.serializers import FlashSaleSerializer, FlashSaleProductSerializer
from utils.cloudinary_utils import CloudinaryUploader
from .utils.in_memory_file_upload import process_product_image, process_editor_image
from orders.models import Order
from users.models import User
from reviews.models import Review
from .utils.clean_html import clean_html_for_email
import csv
import xlsxwriter
from io import BytesIO
from .utils.pdf_generator import PDFGenerator
from .utils.data_formatters import PDFDataFormatter
from .utils.invoice_generator import InvoiceGenerator
from django_filters.rest_framework import DjangoFilterBackend
import logging
from django.db.models.functions import Greatest
from .pagination import AdminPagination
from currencies.utils import CurrencyConverter, CurrencyConversionError
from customer_support.serializers import CustomerEmailSerializer
from customer_support.models import EmailAttachment
from rest_framework.filters import SearchFilter, OrderingFilter
from returns.models import Return, ReturnHistory, ReturnPolicy, ProductReturnPolicy
from customer_support.models import CustomerEmail, EmailTemplate
from django.conf import settings
from returns.serializers import ReturnSerializer, ProductReturnPolicySerializer, ReturnPolicySerializer
from currencies.models import Currency
from django.template import Template, Context
from decimal import Decimal
from django.core.cache import cache
from django.db.models import Q
import json


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
        try:
            # Get date range parameters
            end_date = timezone.now()
            days = int(request.query_params.get('days', 30))
            period = request.query_params.get('period', 'daily')

            # Calculate date range
            start_date = end_date - timedelta(days=days)
            previous_period_start = start_date - timedelta(days=days)

            # Base queryset for completed orders
            orders = Order.objects.filter(
                created_at__range=[start_date, end_date],
                payment_status=True
            )

            # Previous period orders
            previous_orders = Order.objects.filter(
                created_at__range=[previous_period_start, start_date],
                payment_status=True
            )

            # Calculate summary metrics
            current_total = orders.aggregate(
                total=Sum('total_amount'))['total'] or 0
            previous_total = previous_orders.aggregate(
                total=Sum('total_amount'))['total'] or 0

            summary = {
                'total_sales': float(current_total),
                'total_orders': float(orders.count()),
                'average_order_value': float(
                    orders.aggregate(avg=Avg('total_amount'))['avg'] or 0
                ),
                'total_customers': float(orders.values('user').distinct().count())
            }

            # Calculate growth rates
            sales_growth = (
                ((current_total - previous_total) / previous_total * 100)
                if previous_total > 0 else 0
            )

            # Get trend data
            date_trunc = TruncDate(
                'created_at') if period == 'daily' else TruncMonth('created_at')

            trend_data = orders.annotate(
                period=date_trunc
            ).values('period').annotate(
                total_sales=Sum('total_amount'),
                order_count=Count('id'),
                unique_customers=Count('user', distinct=True),
                average_order=Avg('total_amount')
            ).order_by('period')

            # Convert trend data to list and handle Decimal values
            trend_data_list = [{
                'period': item['period'].isoformat() if hasattr(item['period'], 'isoformat') else str(item['period']),
                'total_sales': float(item['total_sales'] or 0),
                'order_count': item['order_count'],
                'unique_customers': item['unique_customers'],
                'average_order': float(item['average_order'] or 0)
            } for item in trend_data]

            # Prepare data for serializer
            analytics_data = {
                'period': period,
                'summary': summary,
                'trend_data': trend_data_list,
                'comparison': {
                    'previous_period': float(previous_total),
                    'current_period': float(current_total),
                    'growth_rate': float(sales_growth)
                },
                'date_range': {
                    'start': start_date.date().isoformat(),
                    'end': end_date.date().isoformat()
                }
            }

            # Use the serializer
            serializer = SalesAnalyticsSerializer(data=analytics_data)
            serializer.is_valid(raise_exception=True)

            return Response(serializer.validated_data)

        except ValueError as e:
            logger.error(f"ValueError in sales_analytics: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Invalid parameters provided', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in sales_analytics: {
                        str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch sales analytics', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

    @action(detail=False, methods=['get'])
    def revenue_analytics(self, request):
        """ Get detailed revenue analytics """
        try:
            # Get date range from query params
            end_date = timezone.now()
            start_date = self.request.query_params.get(
                'start_date',
                (end_date - timedelta(days=30)).date().isoformat()
            )
            end_date = self.request.query_params.get(
                'end_date',
                end_date.date().isoformat()
            )

            # Base queryset for completed orders
            orders = Order.objects.filter(
                created_at__range=[start_date, end_date],
                payment_status=True
            )

            # Calculate cost and profit
            order_items = orders.prefetch_related('items', 'items__product')
            total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0

            # Calculate revenue summary
            summary = {
                'total_revenue': total_revenue,
                'average_order_value': orders.aggregate(avg=Avg('total_amount'))['avg'] or 0,
            }

            # Calculate revenue by category
            category_revenue = (
                order_items
                .values('items__product__category__name')
                .annotate(
                    revenue=Sum('total_amount'),
                    orders=Count('id'),
                    average_order_value=Avg('total_amount')
                )
                .order_by('-revenue')
            )

            # Get trend data
            trend_data = (
                orders
                .annotate(period=TruncDate('created_at'))
                .values('period')
                .annotate(
                    revenue=Sum('total_amount'),
                )
                .order_by('period')
            )

            return Response({
                'summary': summary,
                'by_category': list(category_revenue),
                'trend_data': list(trend_data)
            })
        
        except Exception as e:
            logger.error(f"Error in revenue_analytics: {str(e)}")
            return Response(
                {'error': 'Failed to fetch revenue analytics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

    @action(detail=False, methods=['get'])
    def refund_report(self, request):
        """ Get refund analytics report """
        try:
            # Get date range from query params
            date_from = request.query_params.get('startDate')
            date_to = request.query_params.get('endDate')
            refund_status = request.query_params.get('status')

            # Base queryset for returns with refunds
            queryset = Return.objects.filter(refund_amount__isnull=False)

            # Apply filters
            if date_from:
                queryset = queryset.filter(created_at__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__lte=date_to)
            if refund_status:
                queryset = queryset.filter(refund_status=refund_status)

            # Calculate summary metrics
            total_orders = Order.objects.filter(
                created_at__range=[date_from or timezone.make_aware(datetime.min),
                                   date_to or timezone.now()]
            ).count()

            summary = {
                'total_refunds': queryset.count(),
                'total_amount': queryset.aggregate(
                    total=Sum('refund_amount'))['total'] or 0,
                'average_refund_amount': queryset.aggregate(
                    avg=Avg('refund_amount'))['avg'] or 0,
                'refund_rate': (
                    (queryset.count() / total_orders * 100)
                    if total_orders > 0 else 0
                )
            }

            # Calculate average processing time
            processing_queryset = queryset.filter(
                refund_status='completed',
                updated_at__isnull=False
            ).annotate(
                processing_hours=ExpressionWrapper(
                    ExtractDay(F('updated_at') - F('created_at')) * 24.0 +
                    ExtractHour(F('updated_at') - F('created_at')),
                    output_field=FloatField()
                )
            )

            avg_processing = processing_queryset.aggregate(
                avg_hours=Avg('processing_hours')
            )['avg_hours']

            summary['processing_time_avg'] = avg_processing or 0

            # Get reason breakdown
            reason_breakdown = queryset.values('reason').annotate(
                count=Count('id'),
                total_amount=Sum('refund_amount')
            ).annotate(
                percentage=ExpressionWrapper(
                    F('count') * 100.0 / summary['total_refunds'],
                    output_field=FloatField()
                )
            )

            # Get recent refund transactions
            transactions = queryset.values(
                'id', 'order_id', 'refund_amount', 'reason',
                'refund_status', 'created_at', 'updated_at'
            ).order_by('-created_at')[:100]  # Limit to last 100 refunds

            return Response({
                'summary': summary,
                'reason_breakdown': list(reason_breakdown),
                'transactions': list(transactions),
                'date_range': {
                    'start': date_from,
                    'end': date_to
                }
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

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
    def export_analytics(self, request):
        """Export analytics data in various formats"""
        try:
            data_type = request.query_params.get('type', 'sales')
            format = request.query_params.get('format', 'csv')

            # Get analytics data based on type
            if data_type == 'sales':
                data = self.get_sales_analytics(request).data
            else:
                data = self.get_revenue_analytics(request).data

            # Export based on format
            if format == 'csv':
                return self._export_csv(data, data_type)
            elif format == 'excel':
                return self._export_excel(data, data_type)
            elif format == 'pdf':
                return self._export_pdf(data, data_type)
            else:
                return Response(
                    {'error': 'Invalid export format'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Error in export_analytics: {str(e)}")
            return Response(
                {'error': 'Failed to export analytics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{
            data_type}_analytics.csv"'

        writer = csv.writer(response)

        if data_type == 'sales':
            # Write sales data
            writer.writerow(['Period', 'Total Sales', 'Order Count'])
            for item in data['trend_data']:
                writer.writerow([
                    item['period'],
                    item['total_sales'],
                    item['order_count']
                ])
        else:
            # Write revenue data
            writer.writerow(['Period', 'Revenue'])
            for item in data['trend_data']:
                writer.writerow([
                    item['period'],
                    item['revenue']
                ])

        return response
    

    def _export_excel(self, data, data_type):
        """Export data as Excel"""
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet()

        # Add headers and data based on type
        if data_type == 'sales':
            headers = ['Period', 'Total Sales', 'Order Count']
            for i, item in enumerate(data['trend_data'], start=1):
                worksheet.write(i, 0, str(item['period']))
                worksheet.write(i, 1, item['total_sales'])
                worksheet.write(i, 2, item['order_count'])
        else:
            headers = ['Period', 'Revenue']
            for i, item in enumerate(data['trend_data'], start=1):
                worksheet.write(i, 0, str(item['period']))
                worksheet.write(i, 1, item['revenue'])

        # Write headers
        for col, header in enumerate(headers):
            worksheet.write(0, col, header)

        workbook.close()
        output.seek(0)

        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{
            data_type}_analytics.xlsx"'
        return response
    

    def _export_pdf(self, data, data_type):
        """ Export data as PDF """
        # Format data for PDF generator
        formatted_data = []

        if data_type == 'sales':
            for item in data['trend_data']:
                formatted_data.append({
                    'Period': item['period'],
                    'Total Sales': f"${item['total_sales']}",
                    'Orders': item['order_count']
                })
        else:
            for item in data['trend_data']:
                formatted_data.append({
                    'Period': item['period'],
                    'Revenue': f"${item['revenue']}"
                })

        # Generate PDF
        pdf_generator = PDFGenerator(data_type)
        pdf_buffer = pdf_generator.generate(formatted_data)

        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{
            data_type}_analytics.pdf"'
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
                    #Upload to cloudinary
                    result = process_product_image(image)
                    if not result:
                        raise ValueError("Failed to upload image")
                    
                    # Create product image instance
                    ProductImage.objects.create(
                        product=product,
                        image=result['url'],
                        public_id=result['public_id'],
                        is_primary=(index == 0)
                    )
                   
                except Exception as img_error:
                    logger.error(f"Error processing image: {str(img_error)}")
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
                for image in product_images:
                    # Upload to Cloudinary
                    result = process_product_image(image)
                    if not result:
                        raise ValueError("Failed to upload image")
                    
                    # Make first image primary if no image exists
                    is_primary = not product.images.exists()

                    # Create ProductImage instance
                    product_image = ProductImage.objects.create(
                        product=product,
                        image=result['url'],
                        public_id=result['public_id'],
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
    """ ViewSet for managing users in admin panel """
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering_fields = ['date_joined', 'last_login']
    ordering = ['-date_joined']

    def get_queryset(self):
        queryset = User.objects.filter(is_staff=False, is_superuser=False)

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

        return queryset


    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """ Toggle user active status """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'status': 'success',
            'is_active': user.is_active
        })


    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        """ Get user's purchase history """
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
        queryset = Return.objects.prefetch_related(
            'items',  # Fetch related return items
            'items__images'  # Fetch related images for each item
        ).select_related(
            'order',  # If you need order details
            'user'    # If you need user details
        )

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


class AdminEmailViewSet(viewsets.ModelViewSet):
    serializer_class = AdminEmailSerializer
    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'thread_id']
    search_fields = ['subject', 'body', 'to_email', 'customer__email',
                     'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'sent_at', 'priority']
    ordering = ['-created_at']


    def get_queryset(self):
        queryset = CustomerEmail.objects.all()

        # Filter by customer
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        return queryset


    @action(detail=False, methods=['post'])
    def send_email(self, request):
        try:
            # Get customer based on to_email if they exist
            customer = User.objects.filter(
                email=request.data.get('to_email')).first()

            # Clean HTML content
            cleaned_body = clean_html_for_email(request.data.get('body'))

            # Create email instance first
            email_data = {
                'subject': request.data.get('subject'),
                'body': cleaned_body,
                'to_email': request.data.get('to_email'),
                'from_email': settings.DEFAULT_FROM_EMAIL,
                'customer': customer.id if customer else None,
                'admin_user': request.user.id,
                'status': 'sent'
            }

            # Create CustomerEmail instance
            serializer = self.get_serializer(data=email_data)
            serializer.is_valid(raise_exception=True)
            email_instance = serializer.save()

            # Create EmailMessage instance first
            email = EmailMessage(
                subject=email_data['subject'],
                body=cleaned_body,
                from_email=email_data['from_email'],
                to=[email_data['to_email']]
            )
            email.content_subtype = 'html'

            # Handle attachments
            attachments = request.FILES.getlist('attachments')
    

            if attachments:
                for attachment in attachments:
                    try:
                        # Keep original file content before upload
                        file_content = attachment.read()
                        attachment.seek(0)  # Reset file pointer for upload

                        # Upload to Cloudinary
                        result = CloudinaryUploader.upload_image(
                            attachment,
                            folder=settings.CLOUDINARY_STORAGE_FOLDERS['EMAIL_ATTACHMENTS'],
                            resource_type='auto'
                        )

                        if result:
                            # Create attachment record
                            EmailAttachment.objects.create(
                                email=email_instance,
                                file=result['url'],
                                filename=attachment.name,
                                public_id=result['public_id'],
                                content_type=attachment.content_type,
                                file_size=attachment.size
                            )

                            # Attach to email
                            attachment.seek(0)  # Reset file pointer again
                            email.attach(
                                attachment.name,
                                file_content,
                                attachment.content_type
                            )
                            

                    except Exception as e:
                        logger.error(f"Failed to process attachment {
                                    attachment.name}: {str(e)}", exc_info=True)
                        continue

            # Render email template
            html_email_body = render_to_string(
                'emails/standard_email.html',
                {
                    # 'subject': email_data['subject'],
                    'body': cleaned_body,
                    'site_url': settings.FRONTEND_URL,
                    'attachments': email_instance.attachments.all()
                }
            )

            # Update email body with rendered template
            email.body = html_email_body

            # Send email
            email.send()
            

            # Update sent timestamp
            email_instance.sent_at = timezone.now()
            email_instance.save()

            return Response(
                self.get_serializer(email_instance).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to send email', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['post'])
    def send_bulk_email(self, request):
        """Send bulk emails to multiple customers"""
        subject = request.data.get('subject')
        body = clean_html_for_email(request.data.get('body'))
        customer_ids = json.loads(request.data.get('customer_ids', '[]'))
        attachments = request.FILES.getlist('attachments')

        if not subject or not body or not customer_ids:
            return Response(
                {'error': 'Missing fields required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        successful_sends = 0
        failed_sends = 0
        total_customers = len(customer_ids)

        try:
            customers = User.objects.filter(id__in=customer_ids)

            for customer in customers:
                try:
                    email = CustomerEmail.objects.create(
                        subject=subject,
                        body=body,
                        to_email=customer.email,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        customer=customer,
                        admin_user=request.user,
                        status='sent',
                        sent_at=timezone.now()
                    )

                    # Process attachments
                    stored_attachments = []
                    for attachment in attachments:
                        try:
                            result = CloudinaryUploader.upload_image(
                                attachment,
                                folder=settings.CLOUDINARY_STORAGE_FOLDERS['EMAIL_ATTACHMENTS'],
                                resource_type='auto'
                            )

                            if result:
                                attachment_instance = EmailAttachment.objects.create(
                                    email=email,
                                    file=result['url'],
                                    filename=attachment.name,
                                    public_id=result['public_id'],
                                    content_type=attachment.content_type,
                                    file_size=attachment.size
                                )

                                stored_attachments.append(attachment_instance)

                        except Exception as e:
                            logger.error(f"Failed to process attachment {
                                        attachment.name}: {str(e)}")
                            raise

                    # Render email template with attachment included
                    html_message = render_to_string(
                        'emails/standard_email.html',
                        {
                            'body': body,
                            'site_url': settings.FRONTEND_URL,
                            'attachments': stored_attachments
                        }
                    )

                    # Create and send email message
                    message = EmailMessage(
                        subject=subject,
                        body=html_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[customer.email]
                    )
                    message.content_subtype = 'html'

                    # Attach files
                    for attachment in attachments:
                        message.attach(
                            attachment.name,
                            attachment.read(),
                            attachment.content_type
                        )
                        attachment.seek(0)  # Reset file pointer

                    message.send()
                    successful_sends += 1
                
                except Exception as e:
                    logger.error(f"Failed to send email to customer {customer.id}: {str(e)}")
                    failed_sends += 1
            
            return Response({
                'successful_sends': successful_sends,
                'failed_sends': failed_sends,
                'total_customers': total_customers
            })
        
        except Exception as e:
            logger.error(f"Bulk email error: {str(e)}")
            return Response(
                {'error': 'Failed to process bulk emails'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
                    

    @action(detail=False, methods=['post'])
    def draft(self, request):
        print("Saving draft...")
        print("Request data:", request.data)
        try:
            # Get customer if email is provided
            customer = None
            if request.data.get('to_email'):
                customer = User.objects.filter(
                    email=request.data.get('to_email')).first()

            # Create draft data
            draft_data = {
                # Default empty string
                'subject': request.data.get('subject', ''),
                'body': request.data.get('body', ''),  # Default empty string
                # Default empty string
                'to_email': request.data.get('to_email', ''),
                'from_email': request.data.get('from_email') or request.user.email,
                'customer': customer.id if customer else None,
                'admin_user': request.user.id,
                'status': 'draft'
            }

            serializer = self.get_serializer(data=draft_data)
            serializer.is_valid(raise_exception=True)
            draft = serializer.save()

            # Handle attachments if any
            attachments = request.FILES.getlist('attachments')
            if attachments:
                for attachment in attachments:
                    draft.attachments.create(
                        file=attachment,
                        filename=attachment.name
                    )

            return Response(
                self.get_serializer(draft).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            print("Draft creation failed:", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=True, methods=['patch'])
    def update_draft(self, request, pk=None):
        print("Updating existing draft...")
        print("Request data:", request.data)
        try:
            instance = self.get_object()

            # Only update draft status emails
            if instance.status != 'draft':
                return Response(
                    {'error': 'Can only update draft emails'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get customer if email is provided
            from users.models import User
            customer = None
            if request.data.get('to_email'):
                customer = User.objects.filter(
                    email=request.data.get('to_email')).first()

            update_data = {
                'subject': request.data.get('subject', instance.subject),
                'body': request.data.get('body', instance.body),
                'to_email': request.data.get('to_email', instance.to_email),
                'from_email': request.data.get('from_email', instance.from_email),
                'customer': customer.id if customer else instance.customer_id,
                'status': 'draft'
            }

            serializer = self.get_serializer(
                instance, data=update_data, partial=True)
            serializer.is_valid(raise_exception=True)
            draft = serializer.save()

            # Handle new attachments
            for attachment in request.FILES.getlist('attachments'):
                draft.attachments.create(
                    file=attachment,
                    filename=attachment.name
                )

            return Response(
                self.get_serializer(draft).data,
                status=status.HTTP_200_OK
            )

        except Exception as e:
            print("Draft update failed:", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['get'])
    def get_drafts(self, request):
        """Get all draft emails for the current admin user"""
        drafts = CustomerEmail.objects.filter(
            admin_user=request.user,
            status='draft'
        ).order_by('-created_at')

        page = self.paginate_queryset(drafts)
        if page is not None:
            serializer = CustomerEmailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = CustomerEmailSerializer(drafts, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['post'])
    def bulk_send(self, request):
        template_id = request.data.get('template_id')
        customer_ids = request.data.get('customer_ids', [])

        if not template_id or not customer_ids:
            return Response(
                {'error': 'Template ID and customer IDs are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            template = EmailTemplate.objects.get(
                id=template_id, is_active=True)
            results = {
                'successful': 0,
                'failed': 0,
                'errors': []
            }

            for customer_id in customer_ids:
                try:
                    customer = User.objects.get(id=customer_id)
                    context = {
                        'customer': customer,
                        'site_url': settings.FRONTEND_URL
                    }

                    # Create and send email
                    CustomerEmail.objects.create(
                        subject=Template(template.subject).render(
                            Context(context)),
                        body=Template(template.body).render(Context(context)),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to_email=customer.email,
                        customer=customer,
                        admin_user=request.user,
                        status='sent',
                        sent_at=timezone.now()
                    )
                    results['successful'] += 1

                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append({
                        'customer_id': customer_id,
                        'error': str(e)
                    })

            return Response(results)

        except EmailTemplate.DoesNotExist:
            return Response(
                {'error': 'Template not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminEmailTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = AdminEmailTemplateSerializer
    permission_classes = [IsAdminUser]
    queryset = EmailTemplate.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'subject', 'body']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        template = self.get_object()
        try:
            sample_context = {
                'customer': {
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'email': 'john@example.com'
                },
                'site_url': settings.FRONTEND_URL
            }

            preview = {
                'subject': Template(template.subject).render(Context(sample_context)),
                'body': Template(template.body).render(Context(sample_context))
            }

            return Response(preview)
        except Exception as e:
            return Response(
                {'error': f'Preview generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_editor_image(request):
    """Handle image upload for rich text editor"""
    try:
        # Get the uploaded file
        image_file = request.FILES.get('file')
        if not image_file:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        if not image_file.content_type.startswith('image/'):
            return Response(
                {'error': 'Invalid file type. Only images are allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (5MB max)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum size is 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Upload to Cloudinary 
            result = CloudinaryUploader.upload_image(
                image_file,
                folder=settings.CLOUDINARY_STORAGE_FOLDERS['EDITOR_IMAGES'],
                transformation=[
                    {'quality': 'auto'},
                    {'fetch_format': 'auto'},
                    {'width': 1200, 'height': 1200, 'crop': 'limit'}
                ]
            )

            if not result:
                raise ValueError("Failed to upload image")
            
            return Response({
                'url': result['url'],
                'success': True
            })

        except Exception as e:
            logger.error(f"Error processing image: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to process image'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Exception as e:
        logger.error(f"Error handling image upload: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class AdminFlashSaleViewSet(viewsets.ModelViewSet):
    """Viewset for managing flash sales in admin panel"""
    permission_classes = [IsAdminUser]
    serializer_class = FlashSaleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['-created_at']
    filterset_fields = {
        'status': ['exact'],
        'start_time': ['gte', 'lte'],
        'end_time': ['gte', 'lte'],
        'is_visible': ['exact'],
    }
    
    def get_queryset(self):
        queryset = FlashSale.objects.all()

        # Filter by status from query params
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        # Filter active sales
        active = self.request.query_params.get('active')
        if active:
            now = timezone.now()
            queryset = queryset.filter(
                start_time__lte=now,
                end_time__gte=now,
                status='active'
            )
        return queryset.prefetch_related('sale_products', 'sale_products__product')
    
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Received create flash sale request with data: {
                    request.data}")
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Log validated data before saving
            logger.info(f"Validated data: {serializer.validated_data}")

            instance = self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )

        except Exception as e:
            logger.error(f"Error in create view: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


    @transaction.atomic
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Manually update flash sale status"""
        flash_sale = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(FlashSale.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Validate status transition
        if new_status == 'active':
            now = timezone.now()
            if now < flash_sale.start_time:
                return Response(
                    {'error': 'Cannot activate sale before start time'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if now > flash_sale.end_time:
                return Response(
                    {'error': 'Cannot activate sale after end time'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        flash_sale.status = new_status
        flash_sale.save()

        return Response(self.get_serializer(flash_sale).data)
    

    @action(detail=True, methods=['get'])
    def flash_sale_statistics(self, request, pk=None):
        """Get statistics for a flash sale"""
        flash_sale = self.get_object()

        # Get total sales data
        sales_products = flash_sale.sale_products.annotate(
            total_revenue=Sum('quantity_sold')
        ).select_related('product')

        total_sold = sum(sp.quantity_sold for sp in sales_products)
        total_revenue = sum(
            sp.quantity_sold * flash_sale.calculate_discounted_price(sp.product.price) for sp in sales_products
        )

        # Calculate metrics 
        metrics = {
            'total_products': sales_products.count(),
            'total_sold': total_sold,
            'total_revenue': total_revenue,
            'products_sold_out': sales_products.filter(
                quantity_sold__gte=F('quantity_limit')
            ).count(),
            'total_customers': flash_sale.purchases.values('user').distinct().count()
        }

        if flash_sale.total_quantity_limit:
            metrics['remaining_quantity'] = (
                flash_sale.total_quantity_limit - total_sold
            )

        # Get top selling products
        top_products = sales_products.order_by('-quantity_sold')[:5].values(
            'product__name',
            'quantity_sold',
            'quantity_limit'
        )

        return Response({
            'metrics': metrics,
            'top_products': list(top_products),
            'status': flash_sale.status,
            'time_remaining': (
                (flash_sale.end_time - timezone.now()).total_seconds()
                if flash_sale.status == 'active' else None
            )
        })
    

    @action(detail=True, methods=['get'])
    def customer_purchases(self, request, pk=None):
        """Get customer purchases history for a flash sale"""
        flash_sale = self.get_object()

        purchases = flash_sale.purchases.select_related(
            'user', 'product'
        ).order_by('-created_at')

        return Response([{
            'customer_name': f"{p.user.first_name} {p.user.last_name}",
            'customer_email': p.user.email,
            'product_name': p.product.name,
            'quantity': p.quantity,
            'price_paid': p.price_at_purchase,
            'purchase_date': p.created_at
        } for p in purchases])
    

    @action(detail=False, methods=['patch'])
    def update_products(self, request, pk=None):
        """Update products in a flash sale"""
        flash_sale = self.get_object()

        if flash_sale.status not in ['scheduled', 'active']:
            return Response(
                {'error': 'Can only update products for scheduled or active sales'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        products_data = request.data.get('products', [])

        try:
            with transaction.atomic():
                # Remove products not in the updated list
                current_products_ids = {item['product'] for item in products_data}
                flash_sale.sale_products.exclude(
                    product_id__in=current_products_ids
                ).delete()

                # Update or create new products
                for product_data in products_data:
                    product_id = product_data.pop('product')
                    FlashSaleProduct.objects.update_or_create(
                        flash_sale=flash_sale,
                        product_id=product_id,
                        defaults=product_data
                    )
            
            return Response(self.get_serializer(flash_sale).data)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    

    @action(detail=False, methods=['get'])
    def available_products(self, request):
        """Get products available for flash sales"""
        # Get products already in active flash sales
        active_sales_products = FlashSaleProduct.objects.filter(
            flash_sale__status='active'
        ).values_list('product_id', flat=True)

        # Get available products
        products = Product.objects.exclude(
            id__in=active_sales_products
        ).filter(
            is_available=True,
            stock__gt=0
        ).values('id', 'name', 'price', 'stock')

        return Response(products)
    

    def destroy(self, request, *args, **kwargs):
        """Delete a flash sale"""
        flash_sale = self.get_object()

        # Only allow deletion of scheduled or ended sales
        if flash_sale.status not in ['scheduled', 'ended', 'cancelled']:
            return Response(
                {'error': 'Can only delete scheduled or ended sales'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        flash_sale.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
