from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from decimal import Decimal
from unittest.mock import patch
from ..models import Category, Product, ProductImage
from ..serializers import CategorySerializer, ProductListSerializer, ProductDetailsSerializer

# Mock currency data
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class CategoryViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.category_data = {
            'name': 'Straight Hairs',
            'description': 'High quality straight hair products'
        }
        self.category = Category.objects.create(**self.category_data)
        self.list_url = reverse('category-list')
        self.detail_url = reverse('category-detail', kwargs={'slug': self.category.slug})

    def test_list_categories(self):
        """Test retrieving a list of categories"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        self.assertEqual(response.data['results'], serializer.data)

    def test_retrieve_category(self):
        """Test retrieving a single category"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = CategorySerializer(self.category)
        self.assertEqual(response.data, serializer.data)

    def test_category_not_found(self):
        """Test retrieving a non-existent category"""
        url = reverse('category-detail', kwargs={'slug': 'non-existent'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class ProductViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create category
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )
        
        # Create products
        self.product_data = {
            'name': 'Test Product',
            'category': self.category,
            'description': 'Test Description',
            'hair_type': 'virgin',
            'length': 20,
            'price': Decimal('199.99'),
            'stock': 50,
            'is_featured': True
        }
        self.product = Product.objects.create(**self.product_data)
        
        # Create product image
        self.image = ProductImage.objects.create(
            product=self.product,
            image='test.jpg',
            is_primary=True
        )
        
        self.list_url = reverse('product-list')
        self.detail_url = reverse('product-detail', kwargs={'slug': self.product.slug})
        self.featured_url = reverse('product-featured')


    @patch('products.serializers.get_active_currencies')
    def test_list_products(self, mock_currencies):
        """Test retrieving a list of products"""
        mock_currencies.return_value = MOCK_CURRENCIES
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check pagination
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        
        # Check product data
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], self.product.name)


    @patch('products.serializers.get_active_currencies')
    def test_retrieve_product(self, mock_currencies):
        """Test retrieving a single product"""
        mock_currencies.return_value = MOCK_CURRENCIES
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.product.name)


    @patch('products.serializers.get_active_currencies')
    def test_featured_products(self, mock_currencies):
        """Test retrieving featured products"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        # Create a non-featured product to ensure filtering works
        Product.objects.create(
            name='Non-Featured Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=10,
            is_featured=False
        )
        
        response = self.client.get(self.featured_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertTrue(response.data['results'][0]['is_featured'])


    def test_product_not_found(self):
        """Test retrieving a non-existent product"""
        url = reverse('product-detail', kwargs={'slug': 'non-existent'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    @patch('products.serializers.get_active_currencies')
    def test_filter_by_category(self, mock_currencies):
        """Test filtering products by category"""
        mock_currencies.return_value = MOCK_CURRENCIES
        url = f"{self.list_url}?category__slug={self.category.slug}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['category']['slug'], self.category.slug)


    @patch('products.serializers.get_active_currencies')
    def test_filter_by_hair_type(self, mock_currencies):
        """Test filtering products by hair type"""
        mock_currencies.return_value = MOCK_CURRENCIES
        url = f"{self.list_url}?hair_type=virgin"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['hair_type'], 'virgin')


    @patch('products.serializers.get_active_currencies')
    def test_filter_by_price_range(self, mock_currencies):
        """Test filtering products by price range"""
        mock_currencies.return_value = MOCK_CURRENCIES
        url = f"{self.list_url}?min_price=100&max_price=300&currency=USD"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


    @patch('products.serializers.get_active_currencies')
    def test_search_products(self, mock_currencies):
        """Test searching products"""
        mock_currencies.return_value = MOCK_CURRENCIES
        url = f"{self.list_url}?search=test"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


    @patch('products.serializers.get_active_currencies')
    def test_instant_search(self, mock_currencies):
        """Test instant search endpoint"""
        mock_currencies.return_value = MOCK_CURRENCIES
        url = reverse('product-instant-search')
        response = self.client.get(f"{url}?query=test")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) <= 10)  # Check pagination limit
        if len(response.data) > 0:
            self.assertIn('name', response.data[0])
            self.assertIn('slug', response.data[0])