# Generated by Django 5.1.2 on 2025-02-21 23:03

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cart', '0001_initial'),
        ('products', '0012_flashsaleproduct_original_price'),
    ]

    operations = [
        migrations.CreateModel(
            name='GuestCart',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(max_length=100, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Guest Cart',
                'verbose_name_plural': 'Guest Carts',
                'indexes': [models.Index(fields=['session_id'], name='guest_cart_session_idx')],
            },
        ),
        migrations.CreateModel(
            name='GuestCartItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ('price_at_add', models.DecimalField(decimal_places=2, max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cart', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='cart.guestcart')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='products.product')),
            ],
            options={
                'verbose_name': 'Guest Cart Item',
                'verbose_name_plural': 'Guest Cart Items',
                'unique_together': {('cart', 'product')},
            },
        ),
    ]
