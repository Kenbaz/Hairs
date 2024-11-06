from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cart, CartItem
from .serializers import CartSerializer
from products.models import Product


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
    def merge(self, request):
        """Merge anonymous cart with user cart after login"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "User must be authenticated"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        session_id = request.session.session_key
        if not session_id:
            return Response(
                {"message": "No anonymous cart to merge"},
                status=status.HTTP_200_OK
            )

        try:
            # Get both carts
            user_cart = Cart.objects.get(user=request.user)
            anonymous_cart = Cart.objects.get(session_id=session_id)

            # Merge items
            for anon_item in anonymous_cart.items.all():
                user_item, created = CartItem.objects.get_or_create(
                    cart=user_cart,
                    product=anon_item.product,
                    defaults={
                        'quantity': anon_item.quantity,
                        'price_at_add': anon_item.product.discount_price or anon_item.product.price
                    }
                )
                if not created:
                    user_item.quantity += anon_item.quantity
                    user_item.save()

            # Delete anonymous cart
            anonymous_cart.delete()

            serializer = self.get_serializer(user_cart)
            return Response(serializer.data)

        except Cart.DoesNotExist:
            return Response(
                {"message": "No cart to merge"},
                status=status.HTTP_200_OK
            )
