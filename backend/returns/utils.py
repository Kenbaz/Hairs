# returns/utils.py

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from admin_api.utils.notifications import create_admin_notification
from django.utils import timezone
from .models import ReturnPolicy, ProductReturnPolicy


User = get_user_model()

def send_return_email(return_request, template_name, subject, extra_content=None):
    """
    Send return-related emails
    
    Args:
        return_request: Return instance
        template_name: Name of the template to use
        subject: Email subject
        extra_context: Additional context for the template
    """
    context = {
        'return_request': return_request,
        'site_url': settings.FRONTEND_URL
    }

    if extra_content:
        context.update(extra_content)
    
    html_message = render_to_string(f'emails/{template_name}.html', context)

    send_mail(
        subject=subject,
        message="",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[return_request.user.email],
        html_message=html_message,
        fail_silently=True
    )


def notify_admins_of_return_request(return_request):
    """Notify admin users of new return request"""

    admin_users = User.objects.filter(is_staff=True)

    for admin in admin_users:
        create_admin_notification(
            user=admin,
            type='return_request',
            title='New Return Request',
            message=f"Return request received for Order #{return_request.order.id}",
            reference_id=return_request.id,
            link=f'/admin/returns/{return_request.id}'
        )


def send_return_status_email(return_request):
    """Send appropriate email based on return status"""

    status_config = {
        'pending': {
            'template': 'return_request_received',
            'subject': f"Return Request Received - Order #{return_request.order.id}",
        },
        'approved': {
            'template': 'return_request_approved',
            'subject': f"Return Request Approved - Order #{return_request.order.id}",
        },
        'rejected': {
            'template': 'return_request_rejected',
            'subject': f"Return Request Update - Order #{return_request.order.id}"
        }
    }

    config = status_config.get(return_request.return_status)
    if config:
        send_return_email(
            return_request,
            template_name=config['template'],
            subject=config['subject']
        )


class ReturnEligibilityChecker:
    def __init__(self, order):
        self.order = order
        self.policy = ReturnPolicy.objects.first() # Get global policy
        self.errors = []
    

    def is_eligible_for_return(self):
        """ Check if order is eligible for return """
        if not self.policy:
            self.errors.append("Return policy not found")
            return False
        
        checks = [
            self._is_within_return_window(),
            self._is_order_delivered(),
            self._has_returnable_items(),
            self._has_no_existing_return()
        ]

        return all(checks)
    

    def _is_within_return_window(self):
        if not self.order.delivered_at:
            self.errors.append("Order not delivered yet")
            return False
        
        days_since_delivery = (timezone.now() - self.order.delivered_at).days
        if days_since_delivery > self.policy.return_window_days:
            self.errors.append(
                f"Return window of {
                    self.policy.return_window_days} days has expired"
            )
            return False
        return True
    
    
    def _is_order_delivered(self):
        if self.order.order_status != 'delivered':
            self.errors.append("Order must be delivered before returning")
            return False
        return True


    def _has_returnable_items(self):
        has_returnable = False
        for item in self.order.items.all():
            product_policy = ProductReturnPolicy.objects.filter(
                product=item.product
            ).first()
            if product_policy and not product_policy.is_returnable:
                continue
            has_returnable = True
            break

        if not has_returnable:
            self.errors.append("No returnable items in order")
            return False
        return True


    def _has_no_existing_return(self):
        if self.order.returns.exists():
            self.errors.append(
                "A return request already exists for this order")
            return False
        return True


    def get_returnable_items(self):
        """Get list of returnable items from order"""
        returnable_items = []
        for item in self.order.items.all():
            product_policy = ProductReturnPolicy.objects.filter(
                product=item.product
            ).first()
            if not product_policy or product_policy.is_returnable:
                returnable_items.append({
                    'item': item,
                    'return_window_days': (
                        product_policy.return_window_days
                        if product_policy and product_policy.return_window_days
                        else self.policy.return_window_days
                    ),
                    'restocking_fee': (
                        product_policy.restocking_fee_percentage
                        if product_policy and product_policy.restocking_fee_percentage is not None
                        else self.policy.restocking_fee_percentage
                    )
                })
        return returnable_items
