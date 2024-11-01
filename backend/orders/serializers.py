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
        return value
    

    def create(self, validate_data):
        items_data = validate_data.pop('items')


        # Calculate total amount and create order
        total_amount = 0
        order = Order.objects.create(
            user=self.context['request'].user,
            total_amount=total_amount,
            **validate_data
        )

        # Create order items
        for item_data in items_data:
            product = items_data['product_id']
            quantity = item_data['quantity']

            # Get current product price
            product_obj = Product.objects.get(id=product)
            price = product_obj.price or product_obj.discount_price


            OrderItem.objects.create(
                order=order,
                product=product_obj,
                quantity=quantity,
                price=price
            )
            total_amount += price * quantity


            # Update order total
            order.total_amount = total_amount
            order.save()

            return order