# Generated by Django 3.2.9 on 2021-11-25 06:45

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('canvas', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Circuit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='Wire',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('x1', models.IntegerField()),
                ('x2', models.IntegerField()),
                ('y1', models.IntegerField()),
                ('y2', models.IntegerField()),
                ('midpoints', models.JSONField()),
                ('node', models.IntegerField()),
                ('circuit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='canvas.circuit')),
            ],
        ),
        migrations.CreateModel(
            name='Component',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comp_type', models.CharField(max_length=40)),
                ('x', models.IntegerField()),
                ('y', models.IntegerField()),
                ('height', models.IntegerField()),
                ('width', models.IntegerField()),
                ('nodes', models.JSONField()),
                ('value', models.JSONField()),
                ('circuit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='canvas.circuit')),
            ],
        ),
    ]
