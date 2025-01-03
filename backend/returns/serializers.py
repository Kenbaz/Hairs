# returns/serializers.py

from rest_framework import serializers
from .models import Return, ReturnItem, ReturnImage, ReturnHistory, ReturnPolicy, ProductReturnPolicy


class ReturnImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnImage
        fields = ['id', 'image', 'created_at']


class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    images = ReturnImageSerializer(many=True, read_only=True)

    class Meta:
        model = ReturnItem
        fields = [
            'id', 'product', 'product_name', 'quantity',
            'reason', 'condition', 'images'
        ]


class ReturnHistorySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = ReturnHistory
        fields = [
            'id', 'status', 'notes', 'created_at',
            'created_by_name'
        ]


class ReturnSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    history = ReturnHistorySerializer(many=True, read_only=True)
    customer_name = serializers.CharField(
        source='user.get_full_name',
        read_only=True
    )
    order_number = serializers.CharField(
        source='order.id',
        read_only=True
    )

    class Meta:
        model = Return
        fields = [
            'id', 'order_number', 'customer_name', 'reason',
            'return_status', 'refund_status', 'refund_amount',
            'admin_notes', 'created_at', 'updated_at',
            'items', 'history'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ReturnRequestSerializer(serializers.ModelSerializer):
    items = serializers.ListSerializer(child=serializers.DictField(), write_only=True)

    class Meta:
        model = Return
        fields = ['order', 'reason', 'items']
        read_only_fields = ['order', 'return_status', 'refund_status']


    def validate_items(self, value):
        """
        Validate return items:
        - Ensure each item exists in the order
        - Ensure return quantity doesn't exceed ordered quantity
        """
        order = self.context['order']

        for item in value:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 0)

            # Verify product was in original order
            order_item = order.items.filter(product_id=product_id).first()
            if not order_item:
                raise serializers.ValidationError(
                    f"Product {product_id} not found in order"
                )
            
            # Verify return quantity doesn't exceed ordered quantity
            if quantity > order_item.quantity:
                raise serializers.ValidationError(
                    f"Cannot return more items than originally ordered"
                )
            
            # Validate return condition
            if item.get('condition') not in dict(ReturnItem.CONDITION_CHOICES):
                raise serializers.ValidationError(
                    f"Invalid condition specified for product {product_id}"
                )
        
        return value


class ReturnPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnPolicy
        fields = [
            'return_window_days',
            'requires_receipt',
            'allow_partial_returns',
            'restocking_fee_percentage',
            'free_returns',
            'shipping_paid_by',
            'return_instructions'
        ]


class ProductReturnPolicySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    global_policy = serializers.SerializerMethodField()

    class Meta:
        model = ProductReturnPolicy
        fields = [
            'id',
            'product',
            'product_name',
            'is_returnable',
            'return_window_days',
            'restocking_fee_percentage',
            'special_instructions',
            'global_policy'
        ]
        read_only_fields = ['product_name']

    def get_global_policy(self, obj):
        """Get global policy settings if product-specific settings are not set"""
        global_policy = ReturnPolicy.objects.first()
        if not global_policy:
            return None

        return {
            'return_window_days': (
                obj.return_window_days if obj.return_window_days
                else global_policy.return_window_days
            ),
            'restocking_fee_percentage': (
                obj.restocking_fee_percentage
                if obj.restocking_fee_percentage is not None
                else global_policy.restocking_fee_percentage
            ),
            'free_returns': global_policy.free_returns,
            'shipping_paid_by': global_policy.shipping_paid_by,
        }


class ReturnPolicyDetailSerializer(serializers.Serializer):
    """Serializer for combined global and product-specific policy details"""
    global_policy = ReturnPolicySerializer()
    product_policy = ProductReturnPolicySerializer(allow_null=True)
    effective_policy = serializers.SerializerMethodField()


    def get_effective_policy(self, obj):
        """
        Calculate the effective policy by combining global and product-specific settings
        Product-specific settings override global settings when present
        """
        global_policy = obj['global_policy']
        product_policy = obj['product_policy']

        if not product_policy:
            return {
                'is_returnable': True,
                'return_window_days': global_policy.return_window_days,
                'restocking_fee_percentage': global_policy.restocking_fee_percentage,
                'free_returns': global_policy.free_returns,
                'shipping_paid_by': global_policy.shipping_paid_by,
                'instructions': global_policy.return_instructions
            }

        return {
            'is_returnable': product_policy.is_returnable,
            'return_window_days': (
                product_policy.return_window_days
                if product_policy.return_window_days
                else global_policy.return_window_days
            ),
            'restocking_fee_percentage': (
                product_policy.restocking_fee_percentage
                if product_policy.restocking_fee_percentage is not None
                else global_policy.restocking_fee_percentage
            ),
            'free_returns': global_policy.free_returns,
            'shipping_paid_by': global_policy.shipping_paid_by,
            'instructions': (
                product_policy.special_instructions
                if product_policy.special_instructions
                else global_policy.return_instructions
            )
        }


class ReturnPolicyPreviewSerializer(serializers.ModelSerializer):
    """Simplified serializer for policy previews in lists"""
    class Meta:
        model = ReturnPolicy
        fields = [
            'return_window_days',
            'free_returns',
            'shipping_paid_by'
        ]
