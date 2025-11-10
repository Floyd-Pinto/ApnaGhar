# Generated migration for construction updates

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0008_constructionmilestone_qr_code_data_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConstructionUpdate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('update_type', models.CharField(choices=[('project_level', 'Project Level Update'), ('property_specific', 'Property Specific Update')], default='project_level', max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('update_date', models.DateField()),
                ('images', models.JSONField(blank=True, default=list)),
                ('videos', models.JSONField(blank=True, default=list)),
                ('completion_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('milestone_achieved', models.CharField(blank=True, max_length=255, null=True)),
                ('property_unit_number', models.CharField(blank=True, help_text='Specific flat/unit number for property-specific updates', max_length=50, null=True)),
                ('visible_to_owner_only', models.BooleanField(default=False, help_text='If True, only property owner can see this update')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='construction_updates', to=settings.AUTH_USER_MODEL)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='construction_updates', to='projects.project')),
            ],
            options={
                'verbose_name': 'Construction Update',
                'verbose_name_plural': 'Construction Updates',
                'db_table': 'construction_updates',
                'ordering': ['-update_date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='constructionupdate',
            index=models.Index(fields=['project', 'update_type'], name='constructio_project_idx'),
        ),
        migrations.AddIndex(
            model_name='constructionupdate',
            index=models.Index(fields=['project', 'property_unit_number'], name='constructio_project_unit_idx'),
        ),
    ]
