from django.test import TestCase
from decimal import Decimal
from wishlist.models import Wishlist, WishlistItem
from products.models import Product, Category
from users.models import User
import time


class WishlistModelTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@gmail.com',
            username='testuser',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )

        # Create test category
        self.category = Category.objects.create(
            name='Test category',
            description='Test description'
        )

        # Create test products
        self.product1 = Product.objects.create(
            name='Test product 1',
            category=self.category,
            price=Decimal('99.99'),
            stock=10
        )

        self.product2 = Product.objects.create(
            name='Test Product 2',
            category=self.category,
            price=Decimal('149.99'),
            stock=5
        )

        # Create wishlist
        self.wishlist = Wishlist.objects.create(user=self.user)
    

    def test_wishlist_creation(self):
        """Test creating a wishlist"""
        wishlist = Wishlist.objects.get(user=self.user)
        self.assertEqual(str(wishlist), f"Wishlist for {self.user.first_name} {self.user.last_name}")
        self.assertEqual(wishlist.products.count(), 0)


    def test_add_product_to_wishlist(self):
        """Test adding a product to wishlist"""
        wishlist_item = WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        self.assertEqual(self.wishlist.products.count(), 1)
        self.assertEqual(wishlist_item.product, self.product1)


    def test_remove_product_from_wishlist(self):
        """Test removing a product from wishlist"""
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        self.assertEqual(self.wishlist.products.count(), 1)
        
        # Remove product
        WishlistItem.objects.filter(
            wishlist=self.wishlist,
            product=self.product1
        ).delete()
        self.assertEqual(self.wishlist.products.count(), 0)


    def test_wishlist_unique_products(self):
        """Test that a product can only be added once to a wishlist"""
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        
        # Try to add same product again
        with self.assertRaises(Exception):
            WishlistItem.objects.create(
                wishlist=self.wishlist,
                product=self.product1
            )


    def test_multiple_products_in_wishlist(self):
        """Test adding multiple products to wishlist"""
        # Add multiple products
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product2
        )
        
        self.assertEqual(self.wishlist.products.count(), 2)
        self.assertIn(self.product1, self.wishlist.products.all())
        self.assertIn(self.product2, self.wishlist.products.all())


    def test_cascade_delete(self):
        """Test that wishlist items are deleted when wishlist is deleted"""
        WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        
        # Delete wishlist
        self.wishlist.delete()
        self.assertEqual(WishlistItem.objects.count(), 0)


    def test_wishlist_item_ordering(self):
        """Test that wishlist items are ordered by added_at in descending order"""
        # Create first item
        item1 = WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product1
        )
        
        # Add a small delay to ensure different timestamps
        time.sleep(0.1)
        
        # Create second item
        item2 = WishlistItem.objects.create(
            wishlist=self.wishlist,
            product=self.product2
        )
        
        # Get ordered items
        items = self.wishlist.items.all()  # Changed from WishlistItem.objects.all()
        self.assertEqual(items.first(), item2)  # Most recently added
        self.assertEqual(items.last(), item1)  # First added

        # Additional ordering check
        item_list = list(items)
        self.assertEqual(item_list[0], item2)
        self.assertEqual(item_list[1], item1)