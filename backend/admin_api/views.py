from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
    AdminUserSerializer
)
from products.models import Product, Category
from orders.models import Order
from users.models import User
from reviews.models import Review
import csv
import xlsxwriter
from io import BytesIO
from utils.pdf_generator import PDFGenerator
from utils.data_formatters import PDFDataFormatter


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    

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
            total_sold=Count('order_items')
        ).order_by('-total_sold')[:10]

        # Low stock alerts
        low_stock = Product.objects.filter(
            stock__lte=F('low_stock_threshold')
        ).annotate(
            days_to_stockout=F('stock') / (Count('order_items') / 30.0)
        )

        # Category distribution
        category_distribution = Category.objects.annotate(
            product_count=Count('products')
        ).values('name', 'product_count')

        # Revenue by category
        revenue_by_category = Category.objects.annotate(
            revenue=Sum('products__order_items__price')
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

        serializer = ProductAnalyticsSerializer(data)
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
        """ Get data for export based on type and date range """
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
                total_sold=Count('order_items'),
                revenue=Sum('order_items__price')
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
            
            data = queryset.prefetch_related('items__product').values(
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
        
        elif data_type == 'customers':
            queryset = User.objects.all()
            if date_from:
                queryset = queryset.filter(date_joined__gte=date_from)
            if date_to:
                queryset = queryset.filter(date_joined__lte=date_to)

            data = queryset.annotate(
                total_orders=Count('order'),
                total_spent=Sum('order__total_amount'),
                average_order_value=Avg('order__total_amount')
            ).values(
                'id',
                'email',
                'first_name',
                'last_name',
                'date_joined',
                'total_orders',
                'total_spent',
                'average_order_value'
            )

            return [{
                'Customer ID': item['id'],
                'Email': item['email'],
                'Name': f"{item['first_name']} {item['last_name']}",
                'Joined Date': item['date_joined'].strftime('%Y-%m-%d'),
                'Total Orders': item['total_orders'],
                'Total Spent': item['total_spent'] or 0,
                'Average Order Value': round(item['average_order_value'] or 0, 2)
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
    
