from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductListSerializer
from products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)


    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'price']
        read_only_fields = ['price']


class OrderListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'id', 'total_amount', 'order_status', 'payment_status', 'created_at'
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'total_amount', 'shipping_address', 'order_status', 'payment_status', 'tracking_number', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'total_amount', 'tracking_number']


class CreateOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['shipping_address', 'items']
    

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("No items provided")
        
        # Validate each item
        for item in value:
            try:
                product = Product.objects.get(id=item['product_id'])
                
                # Check if product is in stock
                if product.stock < item['quantity']:
                    raise serializers.ValidationError(
                        f"Not enough stock for product {product.name}. "
                        f"Available: {product.stock}, Requested: {item['quantity']}"
                    )
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Product with id {item['product_id']} does not exist"
                )
        
        return value

    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Create order with zero total amount initially
        order = Order.objects.create(
            user=self.context['request'].user,
            total_amount=0,
            **validated_data
        )

        total_amount = 0
        # Create order items and calculate total
        for item_data in items_data:
            product_id = item_data['product_id']
            quantity = item_data['quantity']

            # Get current product price
            product = Product.objects.get(id=product_id)
            price = product.discount_price or product.price

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )
            total_amount += price * quantity

        # Update order total
        order.total_amount = total_amount
        order.save()

        return order