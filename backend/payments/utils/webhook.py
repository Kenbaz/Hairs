# payments/utils/webhook.py

import hmac
import hashlib
import logging
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)


def verify_webhook_signature(request_body: bytes, signature: str) -> bool:
    """
    Verify that the webhook request came from Paystack
    
    Args:
        request_body: Raw request body as bytes
        signature: Value of x-paystack-signature header
        
    Returns:
        bool: True if signature is valid
    """
    try:
        if not signature or not request_body:
            logger.warning("Missing signature or empty request body")
            return False

        # Get secret key
        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', None)
        if not secret_key:
            logger.error("Paystack secret key not configured")
            return False

        # Generate HMAC SHA512 hash
        secret_key_bytes = secret_key.encode('utf-8')
        expected_signature = hmac.new(
            secret_key_bytes,
            request_body,
            hashlib.sha512
        ).hexdigest()

        # Compare signatures
        is_valid = hmac.compare_digest(expected_signature, signature)

        if not is_valid:
            logger.warning("Invalid webhook signature")

        return is_valid

    except UnicodeEncodeError as e:
        logger.error(f"Unicode encoding error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error verifying webhook signature: {str(e)}")
        return False


def get_event_type(payload: dict) -> str:
    """
    Extract event type from webhook payload
    
    Args:
        payload: The webhook payload as a dictionary
        
    Returns:
        str: The event type or empty string if not found
    """
    if not isinstance(payload, dict):
        logger.warning("Invalid payload type")
        return ''

    return payload.get('event', '')
