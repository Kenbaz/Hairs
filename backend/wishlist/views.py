# wishlist/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Wishlist, WishlistItem
from .serializers import WishlistSerializer
from products.models import Product
from cart.models import CartItem, Cart
from cart.serializers import CartSerializer


class WishlistViewSet(viewsets.GenericViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def get_object(self):
        """Get or create wishlist for current user"""
        wishlist, _ = Wishlist.objects.get_or_create(user=self.request.user)
        return wishlist

    def list(self, request):
        """Get current user's wishlist"""
        wishlist = self.get_object()
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add a product to wishlist"""
        wishlist = self.get_object()
        product_id = request.data.get('product_id')

        try:
            product = Product.objects.get(id=product_id)
            
            # Check if product already in wishlist
            if WishlistItem.objects.filter(
                wishlist=wishlist,
                product=product
            ).exists():
                return Response(
                    {"error": "Product already in wishlist"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add product to wishlist
            WishlistItem.objects.create(
                wishlist=wishlist,
                product=product
            )
            
            serializer = self.get_serializer(wishlist)
            return Response(serializer.data)
        
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Remove a product from wishlist"""
        wishlist = self.get_object()
        product_id = request.data.get('product_id')

        try:
            wishlist_item = WishlistItem.objects.get(
                wishlist=wishlist,
                product_id=product_id
            )
            wishlist_item.delete()
            
            serializer = self.get_serializer(wishlist)
            return Response(serializer.data)
        
        except WishlistItem.DoesNotExist:
            return Response(
                {'error': 'Product not found in wishlist'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear all items from wishlist"""
        wishlist = self.get_object()
        wishlist.items.all().delete()
        
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def check_product(self, request):
        """Check if product is in wishlist"""
        wishlist = self.get_object()
        product_id = request.query_params.get('product_id')

        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_in_wishlist = WishlistItem.objects.filter(
            wishlist=wishlist,
            product_id=product_id
        ).exists()

        return Response({"is_in_wishlist": is_in_wishlist})


    @action(detail=False, methods=['post'])
    def move_to_cart(self, request):
        """Move item from wishlist to cart"""
        product_id = request.data.get('product_id')

        try:
            # Find the item in wishlist
            wishlist = self.get_object()
            wishlist_item = WishlistItem.objects.get(
                wishlist=wishlist,
                product_id=product_id
            )

            # Check product stock
            product = wishlist_item.product
            if not product.is_available or product.stock <= 0:
                return Response(
                    {'error': 'Product is no longer available'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create cart
            cart, _ = Cart.objects.get_or_create(user=request.user)

            # Add to cart
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={
                    'quantity': 1,
                    'price_at_add': product.discount_price or product.price
                }
            )

            if not created:
                cart_item.quantity += 1
                cart_item.save()
            
            # Remove from wishlist
            wishlist_item.delete()

            return Response({
                'message': f'{product.name} added to cart',
                'wishlist': WishlistSerializer(wishlist).data,
                'cart': CartSerializer(cart).data
            })
        
        except WishlistItem.DoesNotExist:
            return Response(
                {"error": "Item not found in wishlist"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
