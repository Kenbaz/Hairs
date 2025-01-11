# customer_support/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from django.core.mail import EmailMessage
from django.template import Template, Context
from django.db.models import Q
from users.models import User
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from .models import CustomerEmail, EmailTemplate
from .serializers import CustomerEmailSerializer, EmailTemplateSerializer
import logging

logger = logging.getLogger(__name__)


class CustomerEmailViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = CustomerEmailSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'thread_id']
    search_fields = ['subject', 'body', 'to_email', 'customer__email', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'sent_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = CustomerEmail.objects.all()
    
        # Filter by customer email if provided
        customer_email = self.request.query_params.get('customer_email', None)
        if customer_email:
            queryset = queryset.filter(customer__email=customer_email)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset
    

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """ Send a drated email """
        email = self.get_objects()
        if email.status != 'draft':
            return Response(
                {'error': 'Only draft emails can be sent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create email message
            email_message = EmailMessage(
                subject=email.subject,
                body=email.body,
                from_email=email.from_email,
                to=[email.to_email]
            )

            # Add attachments if any
            for attachment in email.attachments.all():
                email_message.attach_file(attachment.file.path)
            
            # Send email
            email_message.send()

            # Update email status
            email.status = 'sent'
            email.sent_at = timezone.now()
            email.save()

            return Response({'status': 'Email sent successfully'})
        
        except Exception as e:
            logger.error(f"Failed to send email {email.id}: {str(e)}")
            email.status = 'failed'
            email.save()
            return Response(
                {'error': 'Failed to send email'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

    @action(detail=False, methods=['post'])
    def send_bulk(self, request):
        """Send bulk emails using a template"""
        template_id = request.data.get('template_id')
        customer_ids = request.data.get('customer_ids', [])

        if not template_id or not customer_ids:
            return Response(
                {'error': 'Template ID and customer IDs are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            template = EmailTemplate.objects.get(
                id=template_id, is_active=True)
            successful_sends = 0
            failed_sends = 0

            for customer_id in customer_ids:
                try:
                    customer = User.objects.get(id=customer_id)

                    # Create email from template
                    context = Context({
                        'customer': customer,
                        'site_url': settings.FRONTEND_URL,
                    })
                    subject = Template(template.subject).render(context)
                    body = Template(template.body).render(context)

                    CustomerEmail.objects.create(
                        subject=subject,
                        body=body,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to_email=customer.email,
                        customer=customer,
                        admin_user=request.user,
                        status='sent',
                        sent_at=timezone.now()
                    )
                    successful_sends += 1

                except Exception as e:
                    logger.error(f"Failed to send email to customer {
                                 customer_id}: {str(e)}")
                    failed_sends += 1

            return Response({
                'successful_sends': successful_sends,
                'failed_sends': failed_sends
            })

        except EmailTemplate.DoesNotExist:
            return Response(
                {'error': 'Template not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Bulk email error: {str(e)}")
            return Response(
                {'error': 'Failed to process bulk emails'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmailTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = EmailTemplateSerializer
    queryset = EmailTemplate.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    

    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """ Preview template with sample data """
        template = self.get_object()
        
        try:
            # Create sample context
            context = Context({
                'customer': {
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'email': 'john.doe@example.com'
                },
                'site_url': settings.FRONTEND_URL,
            })

            subject = Template(template.subject).render(context)
            body = Template(template.body).render(context)

            return Response({
                'subject': subject,
                'body': body
            })
        
        except Exception as e:
            logger.error(f"Template preview error: {str(e)}")
            return Response(
                {'error': 'Failed to generate preview'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

