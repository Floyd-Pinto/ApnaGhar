from django.core.management.base import BaseCommand
from projects.models import Property
import random


class Command(BaseCommand):
    help = 'Add images to properties that are missing them'

    def handle(self, *args, **kwargs):
        # Different property images from Unsplash (interior, floor plans, etc.)
        unit_photo_urls = [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',  # Modern living room
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',  # Luxury bedroom
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',  # Modern kitchen
            'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',  # Living space
            'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',  # Bedroom interior
            'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',  # Kitchen interior
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',  # Bathroom
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',  # Living room view
            'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800',  # Modern apartment
            'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800',  # Bedroom
            'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',  # Living area
            'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800',  # Kitchen detail
            'https://images.unsplash.com/photo-1616486701797-0f33f61038ec?w=800',  # Bathroom interior
            'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=800',  # Bedroom space
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',  # Master bedroom
        ]
        
        floor_plan_urls = [
            'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',  # Architectural plan 1
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',  # Architectural plan 2
            'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=800',  # Blueprint 1
            'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',  # Blueprint 2
            'https://images.unsplash.com/photo-1554034483-04fda0d3507b?w=800',  # Floor plan
            'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800',  # Architecture plan
            'https://images.unsplash.com/photo-1593642532400-2682810df593?w=800',  # Building blueprint
            'https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=800',  # Technical drawing
        ]

        properties = Property.objects.all()
        total = properties.count()
        updated_count = 0

        self.stdout.write(f'Processing {total} properties...')

        for prop in properties:
            needs_update = False
            
            # Add unit photos if missing
            if not prop.unit_photos or prop.unit_photos == []:
                # Add 2-4 random unit photos for each property
                num_photos = random.randint(2, 4)
                prop.unit_photos = [
                    {
                        'url': url,
                        'description': f'{prop.property_type.title()} interior view',
                        'uploaded_at': '2025-01-15T10:00:00Z'
                    }
                    for url in random.sample(unit_photo_urls, num_photos)
                ]
                needs_update = True
            
            # Add floor plan if missing
            if not prop.floor_plan_image or prop.floor_plan_image == '':
                prop.floor_plan_image = random.choice(floor_plan_urls)
                needs_update = True
            
            if needs_update:
                prop.save()
                updated_count += 1
                
                if updated_count % 500 == 0:
                    self.stdout.write(f'  Processed {updated_count} properties...')

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Successfully added images to {updated_count} properties!'
        ))
