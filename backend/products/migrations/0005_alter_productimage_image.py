# Generated by Django 5.1.2 on 2024-11-28 18:02

import products.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0004_product_notify_low_stock_alter_product_price'),
    ]

    operations = [
        migrations.AlterField(
            model_name='productimage',
            name='image',
            field=models.ImageField(upload_to='producs/', validators=[products.models.validate_image]),
        ),
    ]
