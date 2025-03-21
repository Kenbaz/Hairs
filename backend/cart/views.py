# cart/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cart, CartItem, GuestCart, GuestCartItem
from .serializers import CartSerializer
from products.models import Product
from wishlist.models import Wishlist, WishlistItem


class CartViewSet(viewsets.GenericViewSet):
    serializer_class = CartSerializer

    def get_cart(self, request):
        """Get or create cart for current user/session"""
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            session_id = request.session.session_key
            if not session_id:
                request.session.create()
                session_id = request.session.session_key
            cart, _ = Cart.objects.get_or_create(session_id=session_id)
        return cart
    

    def list(self, request):
        """Get current cart"""
        cart = self.get_cart(request)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)
    

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add item to cart"""
        cart = self.get_cart(request)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id)
            if not product.is_available:
                return Response(
                    {"error": "Product is not available"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check stock
            if product.stock < quantity:
                return Response(
                    {"error": "Not enough stock available"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create cart item
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={
                    'quantity': quantity,
                    'price_at_add': product.discount_price or product.price
                }
            )

            if not created:
                cart_item.quantity = quantity
                cart_item.price_at_add = product.discount_price or product.price
                cart_item.save()

            serializer = self.get_serializer(cart)
            return Response(serializer.data)

        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        

    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        """Update item quantity"""
        cart = self.get_cart(request)
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            cart_item = CartItem.objects.get(cart=cart, id=item_id)
            
            if quantity <= 0:
                cart_item.delete()
            else:
                # Check stock
                if cart_item.product.stock < quantity:
                    return Response(
                        {"error": "Not enough stock available"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                cart_item.quantity = quantity
                cart_item.save()

            serializer = self.get_serializer(cart)
            return Response(serializer.data)

        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found in cart"},
                status=status.HTTP_404_NOT_FOUND
            )
        

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Remove item from cart"""
        cart = self.get_cart(request)
        item_id = request.data.get('item_id')

        try:
            cart_item = CartItem.objects.get(cart=cart, id=item_id)
            cart_item.delete()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)

        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found in cart"},
                status=status.HTTP_404_NOT_FOUND
            )
        

    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear all items from cart"""
        cart = self.get_cart(request)
        cart.items.all().delete()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)
    
    
    @action(detail=False, methods=['post'])
    def sync_guest(self, request):
        """Sync guest cart data with server"""
        try:
            session_id = request.data.get('session_id')
            items = request.data.get('items', [])

            if not session_id:
                return Response(
                    {"error": "Session ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create guest cart
            guest_cart, _ = GuestCart.objects.get_or_create(
                session_id=session_id)

            # Clear existing items
            guest_cart.items.all().delete()

            # Add new items
            valid_items = []
            for item_data in items:
                try:
                    product = Product.objects.get(id=item_data['product_id'])
                    if product.is_available and product.stock >= item_data['quantity']:
                        valid_items.append(
                            GuestCartItem(
                                cart=guest_cart,
                                product=product,
                                quantity=item_data['quantity'],
                                price_at_add=product.discount_price or product.price
                            )
                        )
                except Product.DoesNotExist:
                    continue

            # Bulk create items
            if valid_items:
                GuestCartItem.objects.bulk_create(valid_items)

            # Return validated cart data
            return Response({
                "session_id": session_id,
                "items": [{
                    "product_id": item.product.id,
                    "quantity": item.quantity,
                    "price_at_add": str(item.price_at_add),
                    "is_available": item.product.is_available,
                    "stock": item.product.stock
                } for item in valid_items]
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(detail=False, methods=['post'])
    def merge(self, request):
        """Merge cart after login - handles both session and direct cart items"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "User must be authenticated"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get user cart or create if doesn't exist
        user_cart, _ = Cart.objects.get_or_create(user=request.user)
        items_merged = False

        # Try session-based merge
        session_id = request.data.get('session_id')
        if session_id:
            try:
                guest_cart = GuestCart.objects.get(session_id=session_id)
                self._merge_guest_cart_items(user_cart, guest_cart)
                guest_cart.delete()
                items_merged = True
            except GuestCart.DoesNotExist:
                pass

        # Try direct items merge
        direct_items = request.data.get('items', [])
        if direct_items:
            self._merge_direct_items(user_cart, direct_items)
            items_merged = True

        if not items_merged:
            return Response(
                {"message": "No items to merge"},
                status=status.HTTP_200_OK
            )

        serializer = self.get_serializer(user_cart)
        return Response(serializer.data)


    def _merge_guest_cart_items(self, user_cart, guest_cart):
        """Helper method to merge guest cart items"""
        for guest_item in guest_cart.items.all():
            user_item, created = CartItem.objects.get_or_create(
                cart=user_cart,
                product=guest_item.product,
                defaults={
                    'quantity': guest_item.quantity,
                    'price_at_add': guest_item.product.discount_price or guest_item.product.price
                }
            )
            if not created:
                user_item.quantity += guest_item.quantity
                user_item.save()


    def _merge_direct_items(self, user_cart, items):
        """Helper method to merge direct cart items"""
        for item in items:
            try:
                product = Product.objects.get(id=item['product_id'])
                user_item, created = CartItem.objects.get_or_create(
                    cart=user_cart,
                    product=product,
                    defaults={
                        'quantity': item['quantity'],
                        'price_at_add': product.discount_price or product.price
                    }
                )
                if not created:
                    user_item.quantity += item['quantity']
                    user_item.save()
            except Product.DoesNotExist:
                continue
    

    @action(detail=False, methods=['post'])
    def move_to_wishlist(self, request):
        """
        Move an item from cart to wishlist
        
        Expected payload:
        {
            'item_id': int,  # ID of the cart item to move
        }
        """
        # Get cart for current user
        cart = self.get_cart(request)

        # Get item ID from request data
        item_id = request.data.get('item_id')

        if not item_id:
            return Response(
                {"error": "Item ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find the cart item
            cart_item = CartItem.objects.get(cart=cart, id=item_id)
            product = cart_item.product

            # Check if product is available
            if not product.is_available:
                return Response(
                    {"error": "Product is not currently available"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create user's wishlist
            wishlist, _ = Wishlist.objects.get_or_create(user=request.user)

            # Check if product is already in wishlist
            if WishlistItem.objects.filter(
                wishlist=wishlist,
                product=product
            ).exists():
                return Response(
                    {"error": "Product is already in your wishlist"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create wishlist item 
            WishlistItem.objects.create(
                wishlist=wishlist,
                product=product
            )

            # Remove item form cart
            cart_item.delete()

            # Serialize and return updated cart
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
        
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Cart item not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
