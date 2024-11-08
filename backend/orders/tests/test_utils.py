from django.test import TestCase
from unittest.mock import patch, Mock
from orders.utils import send_order_email, send_order_status_email
from orders.models import Order
from django.core import mail
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.conf import settings

User = get_user_model()

class OrderUtilsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('99.99'),
            shipping_address='Test Address'
        )
        mail.outbox = []

    def tearDown(self):
        mail.outbox = []

    @patch('orders.utils.render_to_string')
    @patch('orders.utils.send_mail')
    def test_send_order_email(self, mock_send_mail, mock_render):
        """Test sending order emails"""
        mock_render.return_value = 'Test email content'
        test_subject = 'Test Subject'
        
        send_order_email(
            self.order,
            'test_template',
            test_subject,
            {'extra': 'content'}
        )
        
        # Verify render_to_string was called correctly
        mock_render.assert_called_once_with(
            'emails/test_template.html',
            {
                'order': self.order,
                'site_url': settings.FRONTEND_URL,
                'extra': 'content'
            }
        )
        
        # Verify send_mail was called correctly
        mock_send_mail.assert_called_once_with(
            subject=test_subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.user.email],
            html_message='Test email content',
            fail_silently=True
        )

    @patch('orders.utils.send_mail')
    @patch('orders.utils.render_to_string')
    def test_send_order_status_email(self, mock_render, mock_send_mail):
        """Test sending status-specific order emails"""
        mock_render.return_value = 'Test email content'
        
        # Define expected configurations for each status
        status_configs = {
            'pending': {
                'template': 'order_confirmation',
                'subject': f'Order Confirmation - Order #{self.order.id}'
            },
            'shipped': {
                'template': 'order_shipped',
                'subject': f'Your Order #{self.order.id} Has Been Shipped'
            },
            'delivered': {
                'template': 'order_delivered',
                'subject': f'Your Order #{self.order.id} Has Been Delivered'
            },
            'cancelled': {
                'template': 'order_cancelled',
                'subject': f'Order #{self.order.id} Cancellation Confirmation'
            }
        }

        # Test each status
        for status, config in status_configs.items():
            # Reset mocks
            mock_render.reset_mock()
            mock_send_mail.reset_mock()
            
            # Update order status
            self.order.order_status = status
            if status == 'shipped':
                self.order.tracking_number = '123456'
            self.order.save()
            
            # Call the function
            send_order_status_email(self.order)
            
            # Verify the template was rendered with correct arguments
            expected_template = f'emails/{config["template"]}.html'
            expected_context = {
                'order': self.order,
                'site_url': settings.FRONTEND_URL,
            }
            
            if status == 'shipped' and self.order.tracking_number:
                expected_context['tracking_url'] = f'https://trackingservice.com/{self.order.tracking_number}'
            
            mock_render.assert_called_once_with(
                expected_template,
                expected_context
            )
            
            # Verify email was sent with correct arguments
            mock_send_mail.assert_called_once_with(
                subject=config['subject'],
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[self.order.user.email],
                html_message='Test email content',
                fail_silently=True
            )

    @patch('orders.utils.render_to_string')
    @patch('orders.utils.send_mail')
    def test_send_order_email_with_tracking(self, mock_send_mail, mock_render):
        """Test sending shipped order email with tracking number"""
        mock_render.return_value = 'Test email content'
        
        self.order.order_status = 'shipped'
        self.order.tracking_number = '123456'
        self.order.save()

        send_order_status_email(self.order)

        # Verify tracking info was included in template context
        context = mock_render.call_args[0][1]
        self.assertIn('tracking_url', context)
        self.assertIn(self.order.tracking_number, context['tracking_url'])
        
        # Verify email was sent
        mock_send_mail.assert_called_once()

    @patch('orders.utils.render_to_string')
    @patch('orders.utils.send_mail')
    def test_invalid_status_email(self, mock_send_mail, mock_render):
        """Test sending email for invalid status"""
        mock_render.return_value = 'Test email content'
        
        self.order.order_status = 'processing'  # Status without email template
        self.order.save()

        send_order_status_email(self.order)
        
        # Verify no email was sent for invalid status
        mock_send_mail.assert_not_called()
        mock_render.assert_not_called()

    @patch('orders.utils.render_to_string')
    @patch('orders.utils.send_mail')
    def test_email_failure_handling(self, mock_send_mail, mock_render):
        """Test handling of email sending failures"""
        mock_render.return_value = 'Test email content'
        mock_send_mail.side_effect = Exception('Email sending failed')

        # Should not raise exception due to fail_silently=True
        send_order_email(
            self.order,
            'test_template',
            'Test Subject',
            {'extra': 'content'}
        )
        
        # Verify render was called
        mock_render.assert_called_once()
        
        # Verify send_mail was called but failed
        mock_send_mail.assert_called_once()