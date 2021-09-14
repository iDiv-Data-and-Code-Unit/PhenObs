# Generated by Django 3.1.13 on 2021-09-14 10:18

import datetime
from django.db import migrations, models
from django.utils.timezone import utc
import multiselectfield.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('observations', '0002_auto_20210907_0958'),
    ]

    operations = [
        migrations.AddField(
            model_name='record',
            name='peak_flowering_estimation',
            field=models.CharField(blank=True, choices=[('y', 'yes'), ('no', 'no')], max_length=2),
        ),
        migrations.AlterField(
            model_name='collection',
            name='date',
            field=models.DateField(default=datetime.date(2021, 9, 14), help_text='Date and time of collection'),
        ),
        migrations.AlterField(
            model_name='record',
            name='flowering_intensity',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='record',
            name='flowers_open',
            field=models.CharField(blank=True, choices=[('y', 'yes'), ('no', 'no'), ('u', 'unsure')], max_length=2, null=True),
        ),
        migrations.AlterField(
            model_name='record',
            name='initial_vegetative_growth',
            field=models.CharField(blank=True, choices=[('y', 'yes'), ('no', 'no'), ('u', 'unsure'), ('m', 'missed')], max_length=2, null=True),
        ),
        migrations.AlterField(
            model_name='record',
            name='maintenance',
            field=multiselectfield.db.fields.MultiSelectField(blank=True, choices=[('cut_partly', 'cut partly'), ('cut_total', 'cut total'), ('covered_natural', 'covered natural'), ('covered_artificial', 'covered artificial'), ('transplanted', 'transplanted'), ('removed', 'removed')], max_length=18, null=True),
        ),
        migrations.AlterField(
            model_name='record',
            name='peak_flowering',
            field=models.CharField(blank=True, choices=[('y', 'yes'), ('no', 'no'), ('u', 'unsure')], max_length=2, null=True),
        ),
        migrations.AlterField(
            model_name='record',
            name='ripe_fruits',
            field=models.CharField(blank=True, choices=[('y', 'yes'), ('no', 'no'), ('u', 'unsure')], max_length=2, null=True),
        ),
        migrations.AlterField(
            model_name='record',
            name='senescence',
            field=models.CharField(blank=True, choices=[('y', 'yes'), ('no', 'no'), ('u', 'unsure')], max_length=2, null=True),
        ),
        migrations.AlterField(
            model_name='record',
            name='senescence_intensity',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='record',
            name='timestamp_edit',
            field=models.DateTimeField(default=datetime.datetime(2021, 9, 14, 10, 18, 25, 286237, tzinfo=utc), help_text='Date and time of record edit'),
        ),
        migrations.AlterField(
            model_name='record',
            name='timestamp_entry',
            field=models.DateTimeField(default=datetime.datetime(2021, 9, 14, 10, 18, 25, 286219, tzinfo=utc), help_text='Date and time of record entry'),
        ),
        migrations.AlterField(
            model_name='record',
            name='young_leaves_unfolding',
            field=models.CharField(blank=True, choices=[('y', 'yes'), ('no', 'no'), ('u', 'unsure'), ('m', 'missed')], max_length=2, null=True),
        ),
    ]