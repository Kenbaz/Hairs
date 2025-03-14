# Generated by Django 5.1.2 on 2024-12-30 15:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('returns', '0002_remove_return_status_return_items_received_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='return',
            name='return_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('received', 'Received'), ('rejected', 'Rejected'), ('completed', 'Completed')], default='pending', max_length=20),
        ),
    ]
