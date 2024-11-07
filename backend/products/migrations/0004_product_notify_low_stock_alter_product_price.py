# Generated by Django 5.1.2 on 2024-11-07 00:30

import django.core.validators
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_product_last_stock_update_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='notify_low_stock',
            field=models.BooleanField(default=True, help_text='Send notification when stock falls below threshold'),
        ),
        migrations.AlterField(
            model_name='product',
            name='price',
            field=models.DecimalField(decimal_places=2, help_text='Price in USD (base currency)', max_digits=10, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))]),
        ),
    ]
