"""
Management command to assign floor numbers to properties that don't have them
"""
from django.core.management.base import BaseCommand
from projects.models import Project, Property
import random


class Command(BaseCommand):
    help = 'Assign floor numbers to properties that are missing them'

    def handle(self, *args, **options):
        # Get properties without floor numbers
        properties_without_floors = Property.objects.filter(floor_number__isnull=True)
        total = properties_without_floors.count()
        
        self.stdout.write(f'Found {total} properties without floor numbers...')
        
        if total == 0:
            self.stdout.write(self.style.SUCCESS('All properties already have floor numbers!'))
            return
        
        updated = 0
        
        # Group by project
        projects = Project.objects.filter(properties__floor_number__isnull=True).distinct()
        
        for project in projects:
            props = Property.objects.filter(project=project, floor_number__isnull=True)
            prop_count = props.count()
            
            # Determine number of floors for this project (10-30 floors for high-rise)
            if project.total_floors and project.total_floors > 0:
                num_floors = project.total_floors
            else:
                num_floors = random.randint(10, 30)
                project.total_floors = num_floors
                project.save(update_fields=['total_floors'])
            
            # Assign floor numbers
            for idx, prop in enumerate(props):
                # Distribute properties across floors
                floor = (idx % num_floors) + 1
                prop.floor_number = floor
                prop.save(update_fields=['floor_number'])
                updated += 1
            
            self.stdout.write(
                f'  Updated {prop_count} properties in {project.name} '
                f'(distributed across {num_floors} floors)'
            )
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully assigned floor numbers to {updated} properties!'))
