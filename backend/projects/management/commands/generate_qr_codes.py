"""
Management command to generate QR codes for all milestones and properties
"""
from django.core.management.base import BaseCommand
from projects.models import ConstructionMilestone, Property


class Command(BaseCommand):
    help = 'Generate QR codes for all milestones and properties'

    def handle(self, *args, **options):
        self.stdout.write('Generating QR codes for milestones...')
        
        # Generate QR codes for milestones
        milestones = ConstructionMilestone.objects.filter(qr_code_data__isnull=True)
        milestone_count = milestones.count()
        
        for milestone in milestones:
            milestone.save()  # Will trigger QR code generation in save() method
        
        self.stdout.write(self.style.SUCCESS(
            f'✓ Generated QR codes for {milestone_count} milestones'
        ))
        
        # Generate QR codes for properties
        self.stdout.write('Generating QR codes for properties...')
        properties = Property.objects.filter(qr_code_data__isnull=True)
        property_count = properties.count()
        
        batch_size = 500
        updated = 0
        
        for prop in properties:
            prop.save()  # Will trigger QR code generation in save() method
            updated += 1
            
            if updated % batch_size == 0:
                self.stdout.write(f'  Processed {updated}/{property_count} properties...')
        
        self.stdout.write(self.style.SUCCESS(
            f'✓ Generated QR codes for {property_count} properties'
        ))
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Total: {milestone_count + property_count} QR codes generated!'
        ))
