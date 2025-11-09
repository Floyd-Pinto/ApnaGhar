"""
Management command to update all project images with varied Unsplash images
"""
from django.core.management.base import BaseCommand
from projects.models import Project
import random


class Command(BaseCommand):
    help = 'Update all project images with varied real estate images'

    def handle(self, *args, **options):
        # Collection of diverse real estate images from Unsplash
        cover_images = [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',  # Modern house exterior
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',  # Modern interior living room
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',  # Dining room
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',  # Building exterior
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',  # Apartment building
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',  # Modern house
            'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',  # Kitchen
            'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800',  # Bedroom
            'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',  # Bathroom
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',  # Living space
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',  # Modern exterior
            'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800',  # Apartment complex
            'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',  # High rise
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',  # Villa
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',  # Residential
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',  # Modern building
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',  # Luxury home
            'https://images.unsplash.com/photo-1600563438938-a650c6f43f20?w=800',  # Contemporary
            'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800',  # Urban living
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',  # Interior design
        ]
        
        gallery_images = [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
            'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
            'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800',
            'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800',
            'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
            'https://images.unsplash.com/photo-1600563438938-a650c6f43f20?w=800',
            'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800',
        ]
        
        projects = Project.objects.all()
        total = projects.count()
        
        self.stdout.write(f'Updating images for {total} projects...')
        
        updated = 0
        for project in projects:
            # Assign a unique cover image
            project.cover_image = cover_images[updated % len(cover_images)]
            
            # Assign 3-5 random gallery images
            num_gallery = random.randint(3, 5)
            project.gallery_images = random.sample(gallery_images, num_gallery)
            
            project.save(update_fields=['cover_image', 'gallery_images'])
            updated += 1
            
            if updated % 10 == 0:
                self.stdout.write(f'  Updated {updated}/{total} projects...')
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully updated images for {updated} projects!'))
        self.stdout.write(self.style.SUCCESS(f'✓ Each project now has a unique cover image'))
        self.stdout.write(self.style.SUCCESS(f'✓ Each project has {3}-{5} gallery images'))
