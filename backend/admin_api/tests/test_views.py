from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse, resolve
from django.utils import timezone
from decimal import Decimal
from products.models import Product, Category
from orders.models import Order, OrderItem
from users.models import User
from datetime import timedelta, datetime
from django.urls.exceptions import NoReverseMatch


class DashboardViewSetTest(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

    def test_statistics_endpoint(self):
        url = reverse('admin-dashboard-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_orders', response.data)
        self.assertIn('total_revenue', response.data)
        self.assertIn('total_customers', response.data)

    def test_sales_analytics_endpoint(self):
        url = reverse('admin-dashboard-sales-analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('period', response.data)
        self.assertIn('data', response.data)
        self.assertIn('total_sales', response.data)

    def test_unauthorized_access(self):
        self.client.logout()
        url = reverse('admin-dashboard-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AdminProductViewSetTest(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=50
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

    def test_list_products(self):
        url = reverse('admin-products-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check pagination structure
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        # Check that our test product is in the results
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Product')

    def test_update_product(self):
        url = reverse('admin-products-detail', kwargs={'pk': self.product.pk})
        updated_data = {
            'name': 'Updated Product',
            'price': '149.99',
            'stock': 75,
            'category': self.category.id  # Add category ID if required
        }
        response = self.client.patch(url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Updated Product')
        self.assertEqual(self.product.price, Decimal('149.99'))
        self.assertEqual(self.product.stock, 75)

    def test_toggle_featured(self):
        url = reverse('admin-products-toggle-featured',
                      kwargs={'pk': self.product.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertTrue(self.product.is_featured)

        # Toggle back to false
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_featured)

    def test_update_stock(self):
        url = reverse('admin-products-update-stock',
                      kwargs={'pk': self.product.pk})
        new_stock = 75
        response = self.client.post(url, {'stock': new_stock})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, new_stock)

    def test_filter_products(self):
        # Create additional products for testing filters
        Product.objects.create(
            name='Low Stock Product',
            category=self.category,
            price=Decimal('79.99'),
            stock=2,
            low_stock_threshold=5
        )
        Product.objects.create(
            name='Featured Product',
            category=self.category,
            price=Decimal('129.99'),
            stock=100,
            is_featured=True
        )

        # Test low stock filter
        url = reverse('admin-products-list') + '?stock_status=low'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results']
                         [0]['name'], 'Low Stock Product')

        # Test featured filter
        url = reverse('admin-products-list') + '?is_featured=true'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results']
                         [0]['name'], 'Featured Product')

    def test_invalid_stock_update(self):
        url = reverse('admin-products-update-stock',
                      kwargs={'pk': self.product.pk})

        # Test negative stock
        response = self.client.post(url, {'stock': -5})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test non-numeric stock
        response = self.client.post(url, {'stock': 'invalid'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# class ExportDataTest(APITestCase):
#     def setUp(self):
#         self.admin_user = User.objects.create_superuser(
#             email='admin@example.com',
#             username='admin',
#             password='adminpass123',
#             first_name='Admin',
#             last_name='User'
#         )
#         self.client = APIClient()
#         self.client.force_authenticate(user=self.admin_user)

#     def test_export_sales_csv(self):
#         response = self.client.get(
#             reverse('admin-dashboard-export-data'),
#             {'type': 'sales', 'format': 'csv'},
#             format='json'
#         )
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response['Content-Type'], 'text/csv')

#     def test_export_products_excel(self):
#         response = self.client.get(
#             reverse('admin-dashboard-export-data'),
#             {'type': 'products', 'format': 'excel'},
#             format='json'
#         )
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(
#             response['Content-Type'],
#             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
#         )

#     def test_export_orders_pdf(self):
#         response = self.client.get(
#             reverse('admin-dashboard-export-data'),
#             {'type': 'orders', 'format': 'pdf'},
#             format='json'
#         )
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response['Content-Type'], 'application/pdf')


class AdminOrderViewSetTest(APITestCase):
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )

        # Create regular user
        self.user = User.objects.create_user(
            email='user@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create category and product
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=50
        )

        # Create multiple orders with timezone-aware dates
        current_time = timezone.now()
        self.orders = {
            'pending': Order.objects.create(
                user=self.user,
                total_amount=Decimal('99.99'),
                shipping_address='Test Address 1',
                order_status='pending',
                payment_status=False,
                created_at=current_time
            ),
            'processing': Order.objects.create(
                user=self.user,
                total_amount=Decimal('149.99'),
                shipping_address='Test Address 2',
                order_status='processing',
                payment_status=True,
                created_at=current_time + timedelta(hours=1)
            ),
            'delivered': Order.objects.create(
                user=self.user,
                total_amount=Decimal('199.99'),
                shipping_address='Test Address 3',
                order_status='delivered',
                payment_status=True,
                created_at=current_time + timedelta(hours=2)
            )
        }

        # Add order items
        for order in self.orders.values():
            OrderItem.objects.create(
                order=order,
                product=self.product,
                quantity=1,
                price=order.total_amount
            )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

    def test_filter_orders_by_date_range(self):
        url = reverse('admin-orders-list')
        # Use timezone-aware datetime
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        # Convert to timezone-aware datetime objects
        date_from = timezone.make_aware(
            datetime.combine(today, datetime.min.time())
        )
        date_to = timezone.make_aware(
            datetime.combine(tomorrow, datetime.max.time())
        )

        response = self.client.get(url, {
            'date_from': date_from.strftime('%Y-%m-%d'),
            'date_to': date_to.strftime('%Y-%m-%d')
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_order_detail(self):
        order = self.orders['pending']
        url = reverse('admin-orders-detail', kwargs={'pk': order.pk})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], order.id)
        self.assertEqual(
            Decimal(response.data['total_amount']), order.total_amount)
        # Changed from 'items' to 'order_items' to match serializer
        self.assertIn('order_items', response.data)
