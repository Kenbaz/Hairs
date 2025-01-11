from django.conf import settings
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class CloudinaryUploader:
    @staticmethod
    def upload_image(file, folder: str, **options) -> Optional[Dict[str, Any]]:
        """
        Upload an image to Cloudinary
        
        Args:
            file: The file to upload
            folder: The folder in Cloudinary to upload to
            **options: Additional upload options
            
        Returns:
            Dict with upload result or None if upload fails
        """

        try:
            # Default transformation options
            default_options = {
                'folder': folder,
                'transformation': [
                    {'quality': 'auto'},
                    {'fetch_format': 'auto'},
                ],
                'resource_type': 'auto'
            }

            # Merge default options with provided options
            upload_options = {**default_options, **options}

            # Upload file to cloudinary
            result = cloudinary.uploader.upload(file, **upload_options)

            return {
                'public_id': result['public_id'],
                'url': result['secure_url'],
                'resource_type': result['resource_type'],
                'format': result['format'],
                'width': result.get('width'),
                'height': result.get('height'),
            }
        
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {str(e)}")
            return None


    @staticmethod
    def delete_files(public_id: str) -> bool:
        """
        Delete a file from Cloudinary
        
        Args:
            public_id: The public ID of the file to delete
            
        Returns:
            bool: True if deletion was successful, False otherwise
        """

        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception as e:
            logger.error(f"Cloudinary deletion failed: {str(e)}")
            return False
    

    @staticmethod
    def get_image_url(public_id: str, **transformations) -> Optional[str]:
        """
        Get a transformed image URL
        
        Args:
            public_id: The public ID of the image
            **transformations: Cloudinary transformation options
            
        Returns:
            str: The transformed image URL or None if generation fails
        """

        try:
            return cloudinary.CloudinaryImage(public_id).build_url(
                secure=True,
                transformation=transformations
            )
        except Exception as e:
            logger.error(f"Failed to generate image URL: {str(e)}")
            return None
