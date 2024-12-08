from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys


def process_product_image(image):
    """Process product image - resize and optimize"""
    try:
        # Open image
        with Image.open(image) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Calculate new dimensions while maintaining aspect ratio
            max_size = (800, 800)
            img.thumbnail(max_size, Image.LANCZOS)

            # Save the processed image
            output = BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)

            # Return a new InMemoryUploadedFile
            return InMemoryUploadedFile(
                output,
                'ImageField',
                f"{image.name.split('.')[0]}.jpg",
                'image/jpeg',
                sys.getsizeof(output),
                None
            )
    finally:
        # Ensure the original image file is closed
        if hasattr(image, 'close'):
            image.close()
