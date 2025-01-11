# cusomer_support models.py

from django.db import models
from django.conf import settings
from cloudinary_storage.storage import MediaCloudinaryStorage
from utils.cloudinary_utils import CloudinaryUploader


class CustomerEmail(models.Model):
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low')
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('read', 'Read'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]

    subject = models.CharField(max_length=255)
    body = models.TextField()
    from_email = models.EmailField()
    to_email = models.EmailField()
    thread_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="ID for grouping related emails"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_emails'
    )
    related_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='support_emails'
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_emails'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['thread_id']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Email to {self.to_email}: {self.subject}"


class EmailAttachment(models.Model):
    email = models.ForeignKey(
        CustomerEmail,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(
        storage=MediaCloudinaryStorage(),
        upload_to=settings.CLOUDINARY_STORAGE_FOLDERS['EMAIL_ATTACHMENTS']
    )
    filename = models.CharField(max_length=255)
    public_id = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=300, blank=True)
    file_size = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


    def save(self, *args, **kwargs):
        if not self.file_size and self.file:
            self.file_size = self.file.size
        super().save(*args, **kwargs)


    def delete(self, *args, **kwargs):
        # Delete from Cloudinary
        if self.public_id:
            CloudinaryUploader.delete_file(self.public_id)
        super().delete(*args, **kwargs)


    def get_thumbnail_url(self):
        """Get thumbnail URL for image attachments"""
        if self.public_id and self.content_type.startswith('image/'):
            return CloudinaryUploader.get_image_url(
                self.public_id,
                width=200,
                height=200,
                crop='fill',
                quality='auto'
            )
        return None


    def get_preview_url(self):
        """Get preview URL for image attachments"""
        if self.public_id and self.content_type.startswith('image/'):
            return CloudinaryUploader.get_image_url(
                self.public_id,
                width=800,
                height=800,
                crop='limit',
                quality='auto'
            )
        return None


    def __str__(self):
        return self.filename


class EmailTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    variables = models.JSONField(
        default=dict,
        help_text="Variables that can be used in the template"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_templates'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class EmailMetrics(models.Model):
    """Track email-related metrics for analytics"""
    email = models.OneToOneField(
        CustomerEmail,
        on_delete=models.CASCADE,
        related_name='metrics'
    )
    opened_at = models.DateTimeField(null=True, blank=True)
    opened_count = models.IntegerField(default=0)
    response_time = models.DurationField(
        null=True,
        blank=True,
        help_text="Time taken to respond to customer"
    )
    bounced = models.BooleanField(default=False)
    bounce_reason = models.TextField(blank=True)

    def __str__(self):
        return f"Metrics for {self.email}"
