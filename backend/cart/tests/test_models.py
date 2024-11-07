from django.test import TestCase
from django.contrib.auth import get_user_model
from cart.models import Cart, CartItem
from products.models import Category, Product
from decimal import Decimal

User = get_user_model()

class CartModelTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create test category and product
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

    def test_cart_creation_with_user(self):
        """Test creating a cart with a user"""
        cart = Cart.objects.create(user=self.user)
        self.assertEqual(cart.user, self.user)
        self.assertIsNone(cart.session_id)
        self.assertEqual(cart.total_amount, Decimal('0'))

    def test_cart_creation_with_session(self):
        """Test creating a cart with a session ID"""
        cart = Cart.objects.create(session_id='test_session_123')
        self.assertIsNone(cart.user)
        self.assertEqual(cart.session_id, 'test_session_123')

    def test_cart_creation_validation(self):
        """Test cart must have either user or session_id"""
        with self.assertRaises(Exception):
            Cart.objects.create()

    def test_cart_total_amount(self):
        """Test cart total amount calculation"""
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=2,
            price_at_add=self.product.price
        )
        self.assertEqual(cart.total_amount, Decimal('199.98'))

class CartItemModelTest(TestCase):
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

    def test_cart_item_creation(self):
        """Test creating a cart item"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
            price_at_add=self.product.price
        )
        self.assertEqual(cart_item.quantity, 2)
        self.assertEqual(cart_item.price_at_add, self.product.price)

    def test_cart_item_subtotal(self):
        """Test cart item subtotal calculation"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=3,
            price_at_add=Decimal('99.99')
        )
        self.assertEqual(cart_item.subtotal, Decimal('299.97'))

    def test_cart_item_unique_constraint(self):
        """Test that a product can only be in a cart once"""
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=1,
            price_at_add=self.product.price
        )
        with self.assertRaises(Exception):
            CartItem.objects.create(
                cart=self.cart,
                product=self.product,
                quantity=2,
                price_at_add=self.product.price
            )