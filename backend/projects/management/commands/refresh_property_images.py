from django.core.management.base import BaseCommand
from projects.models import Property
import random


class Command(BaseCommand):
    help = 'Replace all property images with fresh new variety of images'

    def handle(self, *args, **kwargs):
        # Fresh new property interior images from Unsplash
        unit_photo_urls = [
            # Modern Living Rooms
            'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
            
            # Luxurious Bedrooms
            'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800',
            'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800',
            
            # Modern Kitchens
            'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800',
            'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800',
            'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800',
            'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800',
            
            # Elegant Bathrooms
            'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
            'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800',
            'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800',
            
            # Dining Areas
            'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
            'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
            'https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=800',
            
            # Balconies & Outdoor Spaces
            'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
            'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
            
            # Home Office/Study
            'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
            'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
            'https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800',
            'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800',
        ]
        
        # Fresh floor plan images
        floor_plan_urls = [
            'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
            'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=800',
            'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
            'https://images.unsplash.com/photo-1554034483-04fda0d3507b?w=800',
            'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800',
            'https://images.unsplash.com/photo-1593642532400-2682810df593?w=800',
            'https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=800',
            'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800',
            'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
            'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
        ]

        properties = Property.objects.all()
        total = properties.count()
        updated_count = 0

        self.stdout.write(f'Replacing images for {total} properties...')
        self.stdout.write('This will take a few moments...')

        for prop in properties:
            # Replace unit photos with 2-5 new random photos
            num_photos = random.randint(2, 5)
            prop.unit_photos = [
                {
                    'url': url,
                    'description': f'{prop.property_type.upper()} {["living room", "bedroom", "kitchen", "bathroom", "dining area"][idx % 5]}',
                    'uploaded_at': '2025-11-09T12:00:00Z'
                }
                for idx, url in enumerate(random.sample(unit_photo_urls, num_photos))
            ]
            
            # Replace floor plan with a new random one
            prop.floor_plan_image = random.choice(floor_plan_urls)
            
            prop.save()
            updated_count += 1
            
            if updated_count % 1000 == 0:
                self.stdout.write(f'  Processed {updated_count}/{total} properties...')

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Successfully replaced images for all {updated_count} properties!'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'✓ Each property now has {num_photos} fresh unit photos and a new floor plan'
        ))
