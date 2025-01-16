# Generated by Django 5.1.2 on 2025-01-14 14:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0011_remove_flashsaleproduct_original_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='flashsaleproduct',
            name='original_price',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Original price when added to sale', max_digits=10, null=True),
        ),
    ]
