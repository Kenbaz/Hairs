from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    CATEGORY_CHOICES = [
         ('straight', 'Straight Hairs'),
        ('curly', 'Curly Hairs'),
        ('wavy', 'Wavy Hairs'),
        ('bouncy', 'Bouncy Hairs'),
        ('braiding', 'Braiding Extensions'),
        ('care', 'Hair Care Products'),
        ('tools', 'Styling Tools'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)


    class Meta:
        verbose_name_plural = 'Categories'


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


    def __str__(self):
        return self.name
    

class Product(models.Model):
    HAIR_TYPE_CHOICES = [
        ('raw', 'Raw hairs'),
        ('virgin', 'Virgin hairs'),
        ('single donor', 'Single donor hairs')
    ]

    HAIR_STYLE_CHOICES = [
        ('straight', 'Straight'),
        ('wavy', 'Wavy'),
        ('curly', 'Curly'),
        ('bouncy', 'Bouncy'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    description = models.TextField()
    hair_type = models.CharField(
        max_length=20,
        choices=HAIR_TYPE_CHOICES,
        blank=True,
        null=True,
        help_text='Only applicable for hair products, not tools or care products'
    )
    length = models.IntegerField(
        help_text='Length in inches',
        null=True,
        blank=True
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    stock = models.IntegerField(default=0)
    care_instructions = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        ordering = ['-created_at']

    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


    def __str__(self):
        return self.name
    

class ProductImage(models.Model): 
    product = models.ForeignKey(
        Product, related_name='images', on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to='producs/')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', '-created_at']
