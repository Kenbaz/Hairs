from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from decimal import Decimal
from rest_framework.test import APIRequestFactory
from unittest.mock import patch
from ..models import Category, Product, ProductImage
from ..serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailsSerializer,
    ProductImageSerializer
)


# Mock currency data
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class CategorySerializerTest(TestCase):
    def setUp(self):
        self.category_data = {
            'name': 'Straight Hairs',
            'slug': 'straight-hairs',  # Added slug field
            'description': 'High quality straight hair products'
        }
        self.category = Category.objects.create(**self.category_data)
        self.serializer = CategorySerializer(instance=self.category)

    def test_contains_expected_fields(self):
        data = self.serializer.data
        self.assertEqual(set(data.keys()), set(['id', 'name', 'slug', 'description']))

    def test_name_field_content(self):
        data = self.serializer.data
        self.assertEqual(data['name'], self.category_data['name'])

    def test_description_field_content(self):
        data = self.serializer.data
        self.assertEqual(data['description'], self.category_data['description'])

    def test_validate_duplicate_name(self):
        duplicate_data = {
            'name': 'Straight Hairs',
            'slug': 'straight-hairs-2',  # Added unique slug
            'description': 'Another description'
        }
        serializer = CategorySerializer(data=duplicate_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)


class ProductListSerializerTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test Description'
        )
        
        self.product_data = {
            'name': 'Test Product',
            'slug': 'test-product',
            'category': self.category,
            'description': 'Test Description',
            'hair_type': 'virgin',
            'length': 20,
            'price': Decimal('199.99'),
            'discount_price': Decimal('179.99'),
            'stock': 50,
            'is_featured': True
        }
        
        self.product = Product.objects.create(**self.product_data)
        
        self.image = ProductImage.objects.create(
            product=self.product,
            image='test.jpg',
            is_primary=True
        )


    @patch('products.serializers.get_active_currencies')
    def test_contains_expected_fields(self, mock_currencies):
        mock_currencies.return_value = MOCK_CURRENCIES
        serializer = ProductListSerializer(
            instance=self.product,
            context={'request': self.request}
        )
        data = serializer.data
        expected_fields = {
            'id', 'name', 'slug', 'category',
            'price_data', 'is_featured', 'primary_image'
        }
        self.assertEqual(set(data.keys()), expected_fields)


    @patch('products.serializers.get_active_currencies')
    def test_price_data_structure(self, mock_currencies):
        mock_currencies.return_value = MOCK_CURRENCIES
        serializer = ProductListSerializer(
            instance=self.product,
            context={'request': self.request}
        )
        price_data = serializer.data['price_data']
        expected_price_fields = {
            'amount', 
            'currency', 
            'formatted',
            'is_discounted', 
            'discount_amount',
            'discount_formatted', 
            'savings_percentage'
        }
        self.assertEqual(set(price_data.keys()), expected_price_fields)


    @patch('products.serializers.get_active_currencies')
    def test_category_data_structure(self, mock_currencies):
        mock_currencies.return_value = MOCK_CURRENCIES
        serializer = ProductListSerializer(
            instance=self.product,
            context={'request': self.request}
        )
        category_data = serializer.data['category']
        expected_category_fields = {'id', 'name', 'slug', 'description'}
        self.assertEqual(set(category_data.keys()), expected_category_fields)


class ProductDetailsSerializerTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test Description'
        )
        
        self.product_data = {
            'name': 'Test Product',
            'slug': 'test-product',
            'category': self.category,
            'description': 'Test Description',
            'hair_type': 'virgin',
            'length': 20,
            'price': Decimal('199.99'),
            'discount_price': Decimal('179.99'),
            'stock': 50,
            'care_instructions': 'Test care instructions',
            'is_featured': True,
            'is_available': True
        }
        
        self.product = Product.objects.create(**self.product_data)


    @patch('products.serializers.get_active_currencies')
    def test_contains_expected_fields(self, mock_currencies):
        mock_currencies.return_value = MOCK_CURRENCIES
        serializer = ProductDetailsSerializer(
            instance=self.product,
            context={'request': self.request}
        )
        data = serializer.data
        expected_fields = {
            'id', 'name', 'slug', 'category', 'description',
            'hair_type', 'length', 'price_data', 'stock',
            'care_instructions', 'is_featured', 'is_available',
            'images', 'created_at', 'updated_at', 'available_currencies'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    @patch('products.serializers.get_active_currencies')
    def test_includes_category_details(self, mock_currencies):
        mock_currencies.return_value = MOCK_CURRENCIES
        serializer = ProductDetailsSerializer(
            instance=self.product,
            context={'request': self.request}
        )
        category_data = serializer.data['category']
        self.assertEqual(category_data['name'], self.category.name)
        self.assertEqual(category_data['slug'], self.category.slug)

    @patch('products.serializers.get_active_currencies')
    def test_price_data_with_discount(self, mock_currencies):
        mock_currencies.return_value = MOCK_CURRENCIES
        serializer = ProductDetailsSerializer(
            instance=self.product,
            context={'request': self.request}
        )
        price_data = serializer.data['price_data']
        self.assertTrue(price_data['is_discounted'])
        self.assertEqual(Decimal(price_data['amount']), self.product_data['price'])
        self.assertEqual(Decimal(price_data['discount_amount']), self.product_data['discount_price'])



class ProductImageSerializerTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('199.99'),
            stock=50
        )
        self.image = ProductImage.objects.create(
            product=self.product,
            image='test.jpg',
            is_primary=True
        )
        self.serializer = ProductImageSerializer(instance=self.image)

    def test_contains_expected_fields(self):
        data = self.serializer.data
        self.assertEqual(set(data.keys()), set(['id', 'image', 'is_primary']))

    def test_image_url_format(self):
        data = self.serializer.data
        self.assertTrue(data['image'].endswith('.jpg'))