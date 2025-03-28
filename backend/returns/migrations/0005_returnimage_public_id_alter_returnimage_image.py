# Generated by Django 5.1.2 on 2025-01-09 00:19

import cloudinary_storage.storage
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('returns', '0004_returnpolicy_productreturnpolicy'),
    ]

    operations = [
        migrations.AddField(
            model_name='returnimage',
            name='public_id',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AlterField(
            model_name='returnimage',
            name='image',
            field=models.ImageField(storage=cloudinary_storage.storage.MediaCloudinaryStorage(), upload_to='returns'),
        ),
    ]
