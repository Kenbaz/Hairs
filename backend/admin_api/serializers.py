from rest_framework import serializers
from products.models import Product, Category
from orders.models import Order
from users.models import User
from django.db.models import Sum, Count
from reviews.models import Review
from products.models import StockHistory
from products.serializers import CategorySerializer, ProductImageSerializer
from .models import AdminNotification


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


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    order_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'

    def get_customer_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

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


class SalesAnalyticsSerializer(serializers.Serializer):
    period = serializers.CharField()
    data = serializers.ListField(child=serializers.DictField())
    total_sales = serializers.DecimalField(max_digits=10, decimal_places=2)
    order_count = serializers.IntegerField()
    average_order_value = serializers.DecimalField(
        max_digits=10, decimal_places=2)


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
