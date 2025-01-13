# admin_api/serializers.py

from rest_framework import serializers
from products.models import Product, Category
from orders.models import Order
from users.models import User
from django.db.models import Sum
from products.models import StockHistory
from products.serializers import CategorySerializer, ProductImageSerializer
from .models import AdminNotification
from currencies.models import Currency
from currencies.utils import CurrencyConverter, CurrencyInfo
from decimal import Decimal
from orders.models import OrderItem, Order
from returns.models import Return, ReturnItem, ReturnHistory, ReturnImage
from customer_support.models import EmailMetrics, EmailAttachment, CustomerEmail, EmailTemplate
from customer_support.serializers import EmailMetricsSerializer, EmailAttachmentSerializer


class AdminProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    stock_value = serializers.SerializerMethodField()
    total_sales = serializers.SerializerMethodField()
    revenue_generated = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description',
            'category', 'category_id', 'images',
            'hair_type', 'length', 'price', 'discount_price',
            'stock', 'care_instructions', 'is_featured',
            'is_available', 'low_stock_threshold', 'notify_low_stock',
            'created_at', 'updated_at', 'stock_value',
            'total_sales', 'revenue_generated'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at', 'stock_value',
                            'total_sales', 'revenue_generated']
    

    def get_stock_value(self, obj):
        return obj.stock * obj.price

    def get_total_sales(self, obj):
        return obj.orderitem_set.count()

    def get_revenue_generated(self, obj):
        items = obj.orderitem_set.all()
        return sum(item.quantity * item.price for item in items)


class AdminCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
        ]
        read_only_fields = ['slug']  # Slug will be auto-generated

    def validate_name(self, value):
        """
        Check that the category name is unique (case-insensitive)
        """
        if Category.objects.filter(name__iexact=value)\
            .exclude(id=getattr(self.instance, 'id', None))\
                .exists():
            raise serializers.ValidationError(
                "A category with this name already exists.")
        return value


class AdminOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name')
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'product_image', 'quantity',
            'price', 'product'
        ]

    def get_product_image(self, obj):
        try:
            if obj.product.images.filter(is_primary=True).exists():
                return obj.product.images.filter(is_primary=True).first().image.url
            return None
        except:
            return None


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    items = AdminOrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    order_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'

    def get_customer_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    
    def get_customer_email(self, obj):
        return obj.user.email

    def get_items_count(self, obj):
        return obj.items.count()

    def get_order_items(self, obj):
        return [{
            'product_name': item.product.name,
            'quantity': item.quantity,
            'price': item.price,
            'subtotal': item.quantity * item.price
        } for item in obj.items.all()]


class AdminUserSerializer(serializers.ModelSerializer):
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    average_order_value = serializers.SerializerMethodField()
    last_order_date = serializers.SerializerMethodField()

    class Meta:
        model = User
        exclude = ['password']
        extra_kwargs = {
            'date_joined': {'read_only': True},
            'last_login': {'read_only': True},
        }

    def get_total_orders(self, obj):
        return obj.order_set.count()

    def get_total_spent(self, obj):
        total = obj.order_set.filter(
            payment_status=True
        ).aggregate(
            total=Sum('total_amount')
        )['total']
        return total if total else 0

    def get_average_order_value(self, obj):
        total_spent = self.get_total_spent(obj)
        total_orders = self.get_total_orders(obj)
        return total_spent / total_orders if total_orders > 0 else 0

    def get_last_order_date(self, obj):
        last_order = obj.order_set.order_by('-created_at').first()
        return last_order.created_at if last_order else None


class StockHistorySerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    product = serializers.StringRelatedField()
    reference_order = serializers.StringRelatedField()

    class Meta:
        model = StockHistory
        fields = [
            'id', 'product', 'transaction_type', 'quantity_changed',
            'previous_stock', 'new_stock', 'reference_order',
            'notes', 'created_at', 'created_by'
        ]


class DashboardStatsSerializer(serializers.Serializer):
    # Basic stats
    total_orders = serializers.IntegerField()
    recent_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_customers = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()
    monthly_sales = serializers.DecimalField(max_digits=10, decimal_places=2)

    # Order stats
    pending_orders = serializers.IntegerField()
    processing_orders = serializers.IntegerField()
    shipped_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()

    # Product Stats
    total_products = serializers.IntegerField()
    out_of_stock_products = serializers.IntegerField()
    featured_products = serializers.IntegerField()

    # Customer Stats
    active_customers = serializers.IntegerField()
    new_customers_this_month = serializers.IntegerField()

    # Review Stats
    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()

    # Sales Stats
    average_order_value = serializers.DecimalField(
        max_digits=10, decimal_places=2)
    sales_growth = serializers.FloatField()  # Percentage growth from last month


class SalesTrendDataSerializer(serializers.Serializer):
    period = serializers.CharField()
    total_sales = serializers.FloatField()
    order_count = serializers.IntegerField()
    unique_customers = serializers.IntegerField()
    average_order = serializers.FloatField()


class SalesAnalyticsSerializer(serializers.Serializer):
    period = serializers.CharField()
    summary = serializers.DictField(
        child=serializers.FloatField(allow_null=True))
    trend_data = SalesTrendDataSerializer(many=True)
    comparison = serializers.DictField(
        child=serializers.FloatField(allow_null=True))
    date_range = serializers.DictField(child=serializers.CharField())


class CustomerAnalyticsSerializer(serializers.Serializer):
    new_vs_returning = serializers.DictField()
    customer_growth = serializers.ListField(child=serializers.DictField())
    top_customers = serializers.ListField(child=serializers.DictField())
    customer_locations = serializers.DictField(
        child=serializers.IntegerField()
    )


class ProductAnalyticsSerializer(serializers.Serializer):
    best_sellers = serializers.ListField(child=serializers.DictField())
    low_stock_alerts = serializers.ListField(child=serializers.DictField())
    category_distribution = serializers.DictField()
    revenue_by_category = serializers.DictField()


class OrderItemSerializer(serializers.Serializer):
    product_name = serializers.CharField()
    quantity = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        model = 'orders.OrderItem'
        fields = ['product_name', 'quantity', 'price', 'subtotal']


class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = ['id', 'type', 'title', 'message',
                  'link', 'is_read', 'created_at']


class CurrencySerializer(serializers.ModelSerializer):
    """ Serializer for Currency model """
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'exchange_rate', 'is_active', 'last_updated']
        read_only_fields = ['last_updated']

        def validate_exchange_rate(self, value):
            if value <= 0:
                raise serializers.ValidationError("Exchange rate must be greater than 0")
            return value
        
        def validate_code(self, value):
            """ Ensure currency code is unique (case-insensitive) """
            value = value.upper()

            if self.instance is None and Currency.objects.filter(code=value).exists():
                raise serializers.ValidationError("Currency with this code already exists")
            return value


class CurrencyConversionSerializer(serializers.Serializer):
    """ Serializer for currency conversion requests """
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    from_currency = serializers.CharField(max_length=3)
    to_currency = serializers.CharField(max_length=3)

    def validate(self, data):
        """
        Validate currency codes exist and are active
        """
        data['from_currency'] = data['from_currency'].upper()
        data['to_currency'] = data['to_currency'].upper()

        # Validate amount
        if data['amount'] < 0:
            raise serializers.ValidationError({'amount': 'Amount must be a positive number'})
        
        return data


class CurrencyInfoSerializer(serializers.Serializer):
    """Serializer for currency info returned by get_active_currencies"""
    code = serializers.CharField()
    symbol = serializers.CharField()
    rate = serializers.DecimalField(max_digits=10, decimal_places=6)
    name = serializers.CharField()

    def to_representation(self, instance: CurrencyInfo):
        """ Add formatted example to output """
        data = super().to_representation(instance)

        # Add formatted example
        example_amount = 100.00
        data['example'] = f"{instance.symbol}{example_amount:.2f}"
        return data


class ExchangeRateUpdateSerializer(serializers.Serializer):
    """ Serializer for updating exchange rates """
    exchange_rate = serializers.DecimalField(
        max_digits=10,
        decimal_places=6,
        min_value=Decimal('0.000001'),
        max_value=Decimal('999999')
    )


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


class AdminEmailSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    admin_name = serializers.SerializerMethodField()
    metrics = EmailMetricsSerializer(read_only=True)
    attachments = EmailAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = CustomerEmail
        fields = [
            'id',
            'subject',
            'body',
            'from_email',
            'to_email',
            'thread_id',
            'status',
            'priority',
            'created_at',
            'sent_at',
            'customer',
            'customer_name',
            'admin_user',
            'admin_name',
            'related_order',
            'attachments',
            'metrics'
        ]
        read_only_fields = ['created_at', 'sent_at', 'metrics']
        extra_kwargs = {
            'subject': {'required': False, 'allow_blank': True},
            'body': {'required': False, 'allow_blank': True},
            'to_email': {'required': False, 'allow_blank': True},
            'customer': {'required': False, 'allow_null': True},
            
        }
    
    def validate(self, attrs):
        # If status is 'sent', ensure required fields are present
        if attrs.get('status') == 'sent':
            if not attrs.get('to_email'):
                raise serializers.ValidationError({'to_email': 'This field is required for sent emails.'})
            if not attrs.get('subject'):
                raise serializers.ValidationError({'subject': 'This field is required for sent emails.'})
            if not attrs.get('body'):
                raise serializers.ValidationError({'body': 'This field is required for sent emails.'})
        return attrs

    def get_customer_name(self, obj):
        if obj.customer:
            return f"{obj.customer.first_name} {obj.customer.last_name}"
        return None

    def get_admin_name(self, obj):
        if obj.admin_user:
            return f"{obj.admin_user.first_name} {obj.admin_user.last_name}"
        return None


class AdminEmailTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmailTemplate
        fields = [
            'id',
            'name',
            'subject',
            'body',
            'variables',
            'is_active',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None
