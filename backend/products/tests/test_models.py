from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from decimal import Decimal
from ..models import Category, Product, ProductImage, StockHistory
from users.models import User
import time


class CategoryTest(TestCase):
    def setUp(self):
        self.category_data = {
            'name': 'straight Hairs',
            'description': 'High quality straight hair products'
        }
    

    def test_category_creation(self):
        category = Category.objects.create(**self.category_data)
        self.assertEqual(category.name, self.category_data['name'])
        self.assertEqual(category.description, self.category_data['description'])
        self.assertTrue(category.slug)  # Check slug was auto-generated


    def test_category_str_representation(self):
        category = Category.objects.create(**self.category_data)
        self.assertEqual(str(category), self.category_data['name'])


    def test_category_slug_unique(self):
        Category.objects.create(name='Test Category')
        with self.assertRaises(Exception):
            Category.objects.create(name='Test Category')



class ProductTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name='Straight Hairs',
            description='High-quality straight hair products'
        )
        self.product_data = {
            'name': 'Premium Straight Hair',
            'category': self.category,
            'description': 'Premium quality straight hair',
            'hair_type': 'virgin',
            'length': 20,
            'price': Decimal('199.99'),
            'stock': 50,
            'care_instructions': 'Wash with cold water',
            'is_featured': True,
            'low_stock_threshold': 10,
            'notify_low_stock': True
        }


    def test_product_creation(self):
        product = Product.objects.create(**self.product_data)
        self.assertEqual(product.name, self.product_data['name'])
        self.assertEqual(product.price, self.product_data['price'])
        self.assertEqual(product.stock, self.product_data['stock'])
        self.assertTrue(product.slug)


    def test_product_price_validation(self):
        """Test that product price cannot be negative"""
        with self.assertRaises(ValidationError):
            product = Product(**{
                **self.product_data,
                'price': Decimal('-100.00')
            })
            product.full_clean()  # This will trigger validation


    def test_product_stock_update(self):
        product = Product.objects.create(**self.product_data)
        initial_stock = product.stock
        
        # Test stock reduction
        product.update_stock(
            quantity_changed=-5,
            transaction_type='order',
            notes='Test stock reduction'
        )
        product.refresh_from_db()
        self.assertEqual(product.stock, initial_stock - 5)

       # Verify stock history was created
        history = StockHistory.objects.filter(product=product).first()
        self.assertEqual(history.quantity_changed, -5)
        self.assertEqual(history.new_stock, initial_stock - 5)


    def test_product_discount_price(self):
        product = Product.objects.create(**self.product_data)
        product.discount_price = Decimal('179.99')
        product.save()

        self.assertTrue(product.discount_price < product.price)
        self.assertEqual(
            product.get_discount_price_in_currency('USD'),
            Decimal('179.99')
        )


    def test_low_stock_threshold(self):
        product = Product.objects.create(**self.product_data)
        initial_stock = product.stock

        # Reduce stock below threshold
        product.update_stock(
            quantity_changed=-(initial_stock - 5),
            transaction_type='order',
            notes='Test low stock'
        )
        product.refresh_from_db()
        self.assertTrue(product.stock <= product.low_stock_threshold)
        self.assertTrue(product.notify_low_stock)



class StockHistoryTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('199.99'),
            stock=50
        )
        self.user = User.objects.create_user(
            email='test@gmail.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )


    def test_stock_history_creation(self):
        history = StockHistory.objects.create(
            product=self.product,
            transaction_type='restock',
            quantity_changed=10,
            previous_stock=50,
            new_stock=60,
            notes='Test restock',
            created_by=self.user
        )

        self.assertEqual(history.product, self.product)
        self.assertEqual(history.quantity_changed, 10)
        self.assertEqual(history.previous_stock, 50)
        self.assertEqual(history.new_stock, 60)


    def test_stock_history_ordering(self):
        """Test that stock history entries are ordered by created_at desc"""
        # Create first entry
        history1 = StockHistory.objects.create(
            product=self.product,
            transaction_type='restock',
            quantity_changed=10,
            previous_stock=50,
            new_stock=60
        )
        
        # Add a small delay to ensure different created_at times
        time.sleep(0.1)
        
        # Create second entry
        history2 = StockHistory.objects.create(
            product=self.product,
            transaction_type='order',
            quantity_changed=-5,
            previous_stock=60,
            new_stock=55
        )

        # Get ordered histories
        histories = StockHistory.objects.all()
        self.assertEqual(histories.first(), history2)
        self.assertEqual(histories.last(), history1)


class ProductImageTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            category=self.category,
            price=Decimal('199.99'),
            stock=50
        )


    def test_product_image_creation(self):
        # Create a dummy image file
        image_file = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'',  # dummy content
            content_type='image/jpeg'
        )

        image = ProductImage.objects.create(
            product=self.product,
            image=image_file,
            is_primary=True
        )

        self.assertEqual(image.product, self.product)
        self.assertTrue(image.is_primary)


    def test_primary_image_constraint(self):
        """Test that only one image can be primary per product"""
        image1 = ProductImage.objects.create(
            product=self.product,
            image='test1.jpg',
            is_primary=True
        )
        
        # Add a small delay to ensure different created_at times
        time.sleep(0.1)
        
        image2 = ProductImage.objects.create(
            product=self.product,
            image='test2.jpg',
            is_primary=True
        )

        # Refresh from database to get updated values
        image1.refresh_from_db()
        image2.refresh_from_db()

        self.assertFalse(image1.is_primary)
        self.assertTrue(image2.is_primary)