"""
Django management command to export data for RAG pipeline
Usage: python manage.py export_for_rag
"""
import csv
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from projects.models import Project, Property, ConstructionMilestone, Developer


class Command(BaseCommand):
    help = 'Export data to CSV files for RAG pipeline'

    def handle(self, *args, **options):
        rag_data_dir = '../../rag-pipeline/data/'
        
        # Create data directory if it doesn't exist
        Path(rag_data_dir).mkdir(parents=True, exist_ok=True)
        
        self.stdout.write('Exporting data for RAG pipeline...')
        
        # Export Projects
        self.export_projects(f'{rag_data_dir}projects.csv')
        
        # Export Properties
        self.export_properties(f'{rag_data_dir}properties.csv')
        
        # Export Developers
        self.export_developers(f'{rag_data_dir}developers.csv')
        
        # Export Construction Milestones
        self.export_milestones(f'{rag_data_dir}construction_milestones.csv')
        
        self.stdout.write(self.style.SUCCESS('Successfully exported all data!'))
        self.stdout.write('\nNext steps:')
        self.stdout.write('  cd ../../rag-pipeline')
        self.stdout.write('  python app.py build')
        self.stdout.write('  python app.py interactive')

    def export_projects(self, filepath):
        projects = Project.objects.all().values(
            'id', 'name', 'slug', 'description', 'city', 'state', 'pincode',
            'project_type', 'status', 'total_units', 'available_units',
            'starting_price', 'amenities', 'address', 'total_floors',
            'expected_completion', 'launch_date', 'actual_completion',
            'verified', 'verification_score', 'developer__company_name'
        )
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            if projects:
                writer = csv.DictWriter(f, fieldnames=projects[0].keys())
                writer.writeheader()
                writer.writerows(projects)
        
        self.stdout.write(f'  ✓ Exported {len(projects)} projects')

    def export_properties(self, filepath):
        properties = Property.objects.all().values(
            'id', 'unit_number', 'property_type', 'bedrooms', 'bathrooms',
            'carpet_area', 'built_up_area', 'super_built_up_area', 'price',
            'price_per_sqft', 'status', 'floor_number', 'tower', 'balconies',
            'features', 'unit_progress_percentage',
            'project__name', 'project__city', 'project__state'
        )
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            if properties:
                writer = csv.DictWriter(f, fieldnames=properties[0].keys())
                writer.writeheader()
                writer.writerows(properties)
        
        self.stdout.write(f'  ✓ Exported {len(properties)} properties')

    def export_developers(self, filepath):
        developers = Developer.objects.all().values(
            'id', 'company_name', 'description', 'established_year',
            'total_projects', 'completed_projects',
            'rera_number', 'verified', 'trust_score',
            'website', 'logo'
        )
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            if developers:
                writer = csv.DictWriter(f, fieldnames=developers[0].keys())
                writer.writeheader()
                writer.writerows(developers)
        
        self.stdout.write(f'  ✓ Exported {len(developers)} developers')

    def export_milestones(self, filepath):
        milestones = ConstructionMilestone.objects.all().values(
            'id', 'title', 'description', 'phase_number', 'status',
            'target_date', 'start_date', 'completion_date',
            'progress_percentage', 'verified',
            'project__name', 'project__city'
        )
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            if milestones:
                writer = csv.DictWriter(f, fieldnames=milestones[0].keys())
                writer.writeheader()
                writer.writerows(milestones)
        
        self.stdout.write(f'  ✓ Exported {len(milestones)} milestones')
