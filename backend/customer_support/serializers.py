# customer_support/serializers.py

from rest_framework import serializers
from .models import CustomerEmail, EmailTemplate, EmailAttachment, EmailMetrics


class EmailAttachmentSerializer(serializers.ModelSerializer):
    preview_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = EmailAttachment
        fields = [
            'id',
            'filename',
            'file',
            'content_type',
            'file_size',
            'file_size_display',
            'preview_url',
            'thumbnail_url',
            'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_preview_url(self, obj):
        return obj.get_preview_url()

    def get_thumbnail_url(self, obj):
        return obj.get_thumbnail_url()

    def get_file_size_display(self, obj):
        """Convert file size to human-readable format"""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class EmailMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailMetrics
        fields = [
            'opened_at',
            'opened_count',
            'response_time',
            'bounced',
            'bounce_reason'
        ]
        read_only_fields = fields


class CustomerEmailSerializer(serializers.ModelSerializer):
    attachments = EmailAttachmentSerializer(many=True, read_only=True)
    metrics = EmailMetricsSerializer(read_only=True)
    customer_name = serializers.SerializerMethodField()
    admin_name = serializers.SerializerMethodField()

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
            'from_email': {'required': False},  # Will be set from admin user
        }
    
    def validate(self, attrs):
        # If status is 'sent', ensure required fields are present
        if attrs.get('status') == 'sent':
            if not attrs.get('to_email'):
                raise serializers.ValidationError(
                    {'to_email': 'This field is required for sent emails.'})
            if not attrs.get('subject'):
                raise serializers.ValidationError(
                    {'subject': 'This field is required for sent emails.'})
            if not attrs.get('body'):
                raise serializers.ValidationError(
                    {'body': 'This field is required for sent emails.'})
        return attrs

    def get_customer_name(self, obj):
        if obj.customer:
            return f"{obj.customer.first_name} {obj.customer.last_name}"
        return None

    def get_admin_name(self, obj):
        if obj.admin_user:
            return f"{obj.admin_user.first_name} {obj.admin_user.last_name}"
        return None


class EmailTemplateSerializer(serializers.ModelSerializer):
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
