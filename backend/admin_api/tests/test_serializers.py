# admin_api/tests/test_serializers.py
from django.test import TestCase
from decimal import Decimal
from django.utils import timezone
from admin_api.serializers import (
    AdminProductSerializer,
    AdminOrderSerializer,
    AdminUserSerializer,
    DashboardStatsSerializer,
    SalesAnalyticsSerializer,
    CustomerAnalyticsSerializer,
    ProductAnalyticsSerializer,
    OrderItemSerializer,
    StockHistorySerializer
)
from products.models import Product, Category, StockHistory
from orders.models import Order, OrderItem
from users.models import User
from reviews.models import Review


class AdminSerializerTests(TestCase):
    def setUp(self):
        # Create test data
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )

        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=10,
            low_stock_threshold=5
        )

        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('99.99'),
            shipping_address='Test Address',
            order_status='pending',
            payment_status=True
        )

        # Create order item
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            price=self.product.price
        )

        # Create review
        self.review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=4,
            comment='Great product!',
            verified_purchase=True
        )

        # Create stock history
        self.stock_history = StockHistory.objects.create(
            product=self.product,
            transaction_type='restock',
            quantity_changed=5,
            previous_stock=5,
            new_stock=10,
            notes='Restock order arrived'
        )

    def test_product_serializer(self):
        """Test AdminProductSerializer"""
        serializer = AdminProductSerializer(self.product)
        data = serializer.data

        # Check basic fields
        self.assertEqual(data['name'], self.product.name)
        self.assertEqual(data['category_name'], self.category.name)
        self.assertEqual(Decimal(data['price']), self.product.price)
        self.assertEqual(data['stock'], self.product.stock)

        # Check calculated fields
        self.assertEqual(
            Decimal(data['stock_value']),
            self.product.stock * self.product.price
        )
        self.assertEqual(data['total_sales'], 1)  # One order item
        self.assertEqual(
            Decimal(data['revenue_generated']),
            self.order_item.price * self.order_item.quantity
        )

    def test_order_serializer(self):
        """Test AdminOrderSerializer"""
        serializer = AdminOrderSerializer(self.order)
        data = serializer.data

        # Check basic fields
        self.assertEqual(data['id'], self.order.id)
        self.assertEqual(
            Decimal(data['total_amount']),
            self.order.total_amount
        )
        self.assertEqual(data['order_status'], self.order.order_status)

        # Check customer info
        expected_name = f"{self.user.first_name} {self.user.last_name}"
        self.assertEqual(data['customer_name'], expected_name)

        # Check order items
        self.assertEqual(data['items_count'], 1)
        order_items = data['order_items']
        self.assertEqual(len(order_items), 1)
        self.assertEqual(order_items[0]['product_name'], self.product.name)
        self.assertEqual(order_items[0]['quantity'], self.order_item.quantity)
        self.assertEqual(
            Decimal(order_items[0]['price']),
            self.order_item.price
        )
        self.assertEqual(
            Decimal(order_items[0]['subtotal']),
            self.order_item.price * self.order_item.quantity
        )

    def test_user_serializer(self):
        """Test AdminUserSerializer"""
        serializer = AdminUserSerializer(self.user)
        data = serializer.data

        # Check basic fields
        self.assertEqual(data['email'], self.user.email)
        self.assertEqual(data['username'], self.user.username)
        self.assertEqual(data['first_name'], self.user.first_name)
        self.assertEqual(data['last_name'], self.user.last_name)

        # Check calculated fields
        self.assertEqual(data['total_orders'], 1)
        self.assertEqual(
            Decimal(data['total_spent']),
            self.order.total_amount
        )
        self.assertEqual(
            Decimal(data['average_order_value']),
            self.order.total_amount
        )
        self.assertIsNotNone(data['last_order_date'])

    def test_dashboard_stats_serializer(self):
        """Test DashboardStatsSerializer"""
        stats_data = {
            'total_orders': 10,
            'recent_orders': 5,
            'total_revenue': Decimal('999.99'),
            'total_customers': 100,
            'low_stock_products': 3,
            'monthly_sales': Decimal('500.00'),
            'pending_orders': 2,
            'processing_orders': 3,
            'shipped_orders': 2,
            'delivered_orders': 2,
            'cancelled_orders': 1,
            'total_products': 20,
            'out_of_stock_products': 2,
            'featured_products': 5,
            'active_customers': 80,
            'new_customers_this_month': 10,
            'total_reviews': 15,
            'average_rating': 4.5,
            'average_order_value': Decimal('99.99'),
            'sales_growth': 15.5
        }

        serializer = DashboardStatsSerializer(data=stats_data)
        self.assertTrue(serializer.is_valid())
        data = serializer.data

        # Verify all fields are present and correctly formatted
        self.assertEqual(data['total_orders'], stats_data['total_orders'])
        self.assertEqual(
            Decimal(data['total_revenue']),
            stats_data['total_revenue']
        )
        self.assertEqual(data['total_customers'],
                         stats_data['total_customers'])
        self.assertEqual(
            data['low_stock_products'],
            stats_data['low_stock_products']
        )

    def test_sales_analytics_serializer(self):
        """Test SalesAnalyticsSerializer"""
        analytics_data = {
            'period': 'daily',
            'data': [
                {
                    'date': timezone.now().date(),
                    'total_sales': Decimal('500.00'),
                    'order_count': 5
                }
            ],
            'total_sales': Decimal('500.00'),
            'order_count': 5,
            'average_order_value': Decimal('100.00')
        }

        serializer = SalesAnalyticsSerializer(data=analytics_data)
        self.assertTrue(serializer.is_valid())
        data = serializer.data

        self.assertEqual(data['period'], analytics_data['period'])
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(
            Decimal(data['total_sales']),
            analytics_data['total_sales']
        )

    def test_order_item_serializer(self):
        """Test OrderItemSerializer"""
        item_data = {
            'product_name': 'Test Product',
            'quantity': 2,
            'price': Decimal('99.99'),
            'subtotal': Decimal('199.98')
        }

        serializer = OrderItemSerializer(data=item_data)
        self.assertTrue(serializer.is_valid())
        data = serializer.data

        self.assertEqual(data['product_name'], item_data['product_name'])
        self.assertEqual(data['quantity'], item_data['quantity'])
        self.assertEqual(Decimal(data['price']), item_data['price'])
        self.assertEqual(Decimal(data['subtotal']), item_data['subtotal'])

    def test_stock_history_serializer(self):
        """Test StockHistorySerializer"""
        serializer = StockHistorySerializer(self.stock_history)
        data = serializer.data

        self.assertEqual(data['transaction_type'], 'restock')
        self.assertEqual(data['quantity_changed'], 5)
        self.assertEqual(data['previous_stock'], 5)
        self.assertEqual(data['new_stock'], 10)
        self.assertEqual(data['notes'], 'Restock order arrived')

    def test_customer_analytics_serializer(self):
        """Test CustomerAnalyticsSerializer"""
        analytics_data = {
            'new_vs_returning': {
                'new': 10,
                'returning': 20
            },
            'customer_growth': [
                {
                    'date': timezone.now().date(),
                    'count': 5
                }
            ],
            'top_customers': [
                {
                    'id': self.user.id,
                    'name': f"{self.user.first_name} {self.user.last_name}",
                    'total_spent': Decimal('500.00')
                }
            ],
            'customer_locations': {
                'New York': 10,
                'Los Angeles': 5
            }
        }

        serializer = CustomerAnalyticsSerializer(data=analytics_data)
        self.assertTrue(serializer.is_valid())
        data = serializer.data

        self.assertEqual(
            data['new_vs_returning'],
            analytics_data['new_vs_returning']
        )
        self.assertEqual(len(data['customer_growth']), 1)
        self.assertEqual(len(data['top_customers']), 1)
        self.assertEqual(
            data['customer_locations'],
            analytics_data['customer_locations']
        )

    def test_product_analytics_serializer(self):
        """Test ProductAnalyticsSerializer"""
        analytics_data = {
            'best_sellers': [
                {
                    'id': self.product.id,
                    'name': self.product.name,
                    'total_sold': 10
                }
            ],
            'low_stock_alerts': [
                {
                    'id': self.product.id,
                    'name': self.product.name,
                    'current_stock': 3
                }
            ],
            'category_distribution': {
                'Category 1': 10,
                'Category 2': 5
            },
            'revenue_by_category': {
                'Category 1': Decimal('1000.00'),
                'Category 2': Decimal('500.00')
            }
        }

        serializer = ProductAnalyticsSerializer(data=analytics_data)
        self.assertTrue(serializer.is_valid())
        data = serializer.data

        self.assertEqual(len(data['best_sellers']), 1)
        self.assertEqual(len(data['low_stock_alerts']), 1)
        self.assertEqual(
            data['category_distribution'],
            analytics_data['category_distribution']
        )
        self.assertEqual(
            data['revenue_by_category'],
            analytics_data['revenue_by_category']
        )
