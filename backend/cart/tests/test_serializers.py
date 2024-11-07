from django.test import TestCase
from unittest.mock import patch
from cart.serializers import CartSerializer, CartItemSerializer
from cart.models import Cart, CartItem
from products.models import Category, Product
from products.serializers import ProductListSerializer
from decimal import Decimal
from django.contrib.auth import get_user_model

User = get_user_model()

# Mock currency data that will be used in our tests
MOCK_CURRENCIES = {
    'USD': {
        'symbol': '$',
        'rate': Decimal('1.0'),
        'name': 'US Dollar'
    }
}

class CartSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.cart = Cart.objects.create(user=self.user)
        
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=10
        )

    def test_cart_serializer_fields(self):
        """Test the cart serializer contains expected fields"""
        serializer = CartSerializer(instance=self.cart)
        expected_fields = {'id', 'items', 'total_amount', 'created_at', 'updated_at'}
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    @patch('products.serializers.get_active_currencies')
    def test_cart_with_items_serialization(self, mock_currencies):
        """Test serializing a cart with items"""
        # Configure mock to return our test currencies
        mock_currencies.return_value = MOCK_CURRENCIES
        
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
            price_at_add=self.product.price
        )
        
        serializer = CartSerializer(instance=self.cart)
        self.assertEqual(len(serializer.data['items']), 1)
        self.assertEqual(serializer.data['total_amount'], str(cart_item.subtotal))

class CartItemSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@gmail.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.cart = Cart.objects.create(user=self.user)
        
        self.category = Category.objects.create(
            name='Test Category',
            description='Test Description'
        )
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('99.99'),
            stock=10
        )

    @patch('products.serializers.get_active_currencies')
    def test_cart_item_serializer_fields(self, mock_currencies):
        """Test the cart item serializer contains expected fields"""
        # Configure mock to return our test currencies
        mock_currencies.return_value = MOCK_CURRENCIES
        
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=1,
            price_at_add=self.product.price
        )
        serializer = CartItemSerializer(instance=cart_item)
        expected_fields = {
            'id', 'product', 'quantity',
            'price_at_add', 'subtotal', 'created_at'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    @patch('products.serializers.get_active_currencies')
    def test_cart_item_serializer_write_fields(self, mock_currencies):
        """Test cart item serializer write operation fields"""
        mock_currencies.return_value = MOCK_CURRENCIES
        
        data = {
            'product_id': self.product.id,
            'quantity': 2
        }
        context = {'request': None}
        serializer = CartItemSerializer(data=data, context=context)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(set(data.keys()), {'product_id', 'quantity'})

    @patch('products.serializers.get_active_currencies')
    def test_cart_item_creation_validation(self, mock_currencies):
        """Test cart item creation through serializer"""
        # Configure mock to return our test currencies
        mock_currencies.return_value = MOCK_CURRENCIES
        
        data = {
            'product_id': self.product.id,
            'quantity': 2
        }
        context = {'request': None}  # Add empty request context
        serializer = CartItemSerializer(data=data, context=context)
        self.assertTrue(serializer.is_valid())

    @patch('products.serializers.get_active_currencies')
    def test_cart_item_serializer_with_product(self, mock_currencies):
        """Test cart item serializer includes correct product data"""
        # Configure mock to return our test currencies
        mock_currencies.return_value = MOCK_CURRENCIES
        
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=1,
            price_at_add=self.product.price
        )
        
        serializer = CartItemSerializer(instance=cart_item)
        self.assertEqual(serializer.data['product']['name'], self.product.name)
        self.assertEqual(Decimal(serializer.data['price_at_add']), self.product.price)
        self.assertEqual(Decimal(serializer.data['subtotal']), self.product.price)