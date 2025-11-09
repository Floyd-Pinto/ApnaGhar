"""
Management command to recalculate and fix all project statistics
- Total units = count of all properties in the project
- Available units = count of properties with status='available'
- Total floors = max floor_number from properties
"""
from django.core.management.base import BaseCommand
from projects.models import Project, Property
from django.db.models import Max, Count, Q


class Command(BaseCommand):
    help = 'Recalculate project statistics based on actual property data'

    def handle(self, *args, **options):
        projects = Project.objects.all()
        total = projects.count()
        
        self.stdout.write(f'Recalculating statistics for {total} projects...')
        
        updated = 0
        for project in projects:
            # Get all properties for this project
            properties = Property.objects.filter(project=project)
            
            # Calculate statistics
            total_units = properties.count()
            available_units = properties.filter(status='available').count()
            max_floor = properties.aggregate(Max('floor_number'))['floor_number__max']
            
            # Update project
            changes_made = False
            if project.total_units != total_units:
                project.total_units = total_units
                changes_made = True
            
            if project.available_units != available_units:
                project.available_units = available_units
                changes_made = True
            
            if max_floor and project.total_floors != max_floor:
                project.total_floors = max_floor
                changes_made = True
            
            if changes_made:
                project.save(update_fields=['total_units', 'available_units', 'total_floors'])
                updated += 1
                
                self.stdout.write(
                    f'  Updated {project.name}: '
                    f'{total_units} total units, '
                    f'{available_units} available, '
                    f'{max_floor or 0} floors'
                )
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully updated {updated} projects!'))
        self.stdout.write(self.style.SUCCESS(f'✓ All project statistics are now accurate'))
        
        # Show summary
        self.stdout.write(self.style.WARNING('\nSummary:'))
        total_properties = Property.objects.count()
        total_available = Property.objects.filter(status='available').count()
        total_booked = Property.objects.filter(status='booked').count()
        total_sold = Property.objects.filter(status='sold').count()
        
        self.stdout.write(f'  Total Properties: {total_properties}')
        self.stdout.write(f'  Available: {total_available}')
        self.stdout.write(f'  Booked: {total_booked}')
        self.stdout.write(f'  Sold: {total_sold}')
