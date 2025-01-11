from utils.cloudinary_utils import CloudinaryUploader
from django.conf import settings
import logging


logger = logging.getLogger(__name__)


def process_product_image(image):
    """Process product image - resize and optimize"""
    try:
        result = CloudinaryUploader.upload_image(
            image,
            folder=settings.CLOUDINARY_STORAGE_FOLDERS['PRODUCT_IMAGES'],
            transformation=[
                {'quality': 'auto'},
                {'fetch_format': 'auto'},
                {'width': 800, 'height': 800, 'crop': 'limit'}
            ]
        )

        if not result:
            raise ValueError("Failed to upload image to Cloudinary")
        
        return result
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise


def process_editor_image(image):
    """Process image for the rich text editor"""
    try:
        result = CloudinaryUploader.upload_image(
            image,
            folder=settings.CLOUDINARY_STORAGE_FOLDERS['EDITOR_IMAGES'],
            transformation=[
                {'quality': 'auto'},
                {'fetch_format': 'auto'},
                {'width': 1200, 'height': 1200, 'crop': 'limit'}
            ]
        )

        if not result:
            raise ValueError("Failed to upload image to cloudinary")
        
        return result
    except Exception as e:
        logger.error(f"Error processing editor image: {str(e)}")
        raise
