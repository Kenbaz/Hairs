from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings


def send_order_email(order, template_name, subject, extra_content=None):
    """
    Generic function to send order-related emails using HTML templates
    
    Args:
        order: Order instance
        template_name: Name of the template to use (without .html extension)
        subject: Email subject
        extra_context: Additional context to pass to the template (optional)
    """

    context = {
        'order': order,
        'site_url': settings.FRONTEND_URL,
    }

    if extra_content:
        context.update(extra_content)

        # Render Html email template
        html_message = render_to_string(f'emails/{template_name},html', context)

        # Send email
        send_mail(
            subject=subject,
            message='', #Plain text message if needed
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=html_message,
            fail_silently=False
        )


def send_order_status_email(order):
    """Send appropriate email based on order status"""
    status_config = {
        'pending': {
            'template': 'order_confirmation',
            'subject': f'Order Confirmation - Order #{order.id}'
        },
        'shipped': {
            'template': 'order_shipped',
            'subject': f'Your Order #{order.id} Has Been Shipped',
            'extra_context': {
                'tracking_url': f'https://trackingservice.com/{order.tracking_number}'
            }
        },
        'delivered': {
            'template': 'order_delivered',
            'subject': f'Your Order #{order.id} Has Been Delivered'
        },
        'cancelled': {
            'template': 'order_cancelled',
            'subject': f'Order #{order.id} Cancellation Confirmation'
        }
    }

    # Get email configuration for the current status
    email_config = status_config.get(order.order_status)
    if email_config:
        send_order_email(
            order,
            template_name=email_config['template'],
            subject=email_config['subject'],
            extra_content=email_config.get('extra_content')
        )