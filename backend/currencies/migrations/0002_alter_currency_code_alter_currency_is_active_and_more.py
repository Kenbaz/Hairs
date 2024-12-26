# Generated by Django 5.1.2 on 2024-12-22 08:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('currencies', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='currency',
            name='code',
            field=models.CharField(help_text="Currency code (e.g., 'USD, NGN)", max_length=3, unique=True),
        ),
        migrations.AlterField(
            model_name='currency',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Whether this currency is available for use'),
        ),
        migrations.AddIndex(
            model_name='currency',
            index=models.Index(fields=['code'], name='currencies__code_712bc0_idx'),
        ),
        migrations.AddIndex(
            model_name='currency',
            index=models.Index(fields=['is_active'], name='currencies__is_acti_4f1b46_idx'),
        ),
    ]
