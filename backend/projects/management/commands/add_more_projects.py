"""
Management command to add 23 more projects to reach 73 total
"""
from django.core.management.base import BaseCommand
from projects.models import Developer, Project, Property, ConstructionMilestone
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.utils.text import slugify
import random


class Command(BaseCommand):
    help = 'Add 23 more projects to reach 73 total'

    def handle(self, *args, **options):
        builders = list(Developer.objects.all())
        self.stdout.write(f'Found {len(builders)} builders')
        
        cities_data = {
            'Mumbai': {'state': 'Maharashtra', 'localities': ['Andheri', 'Bandra', 'Powai', 'Thane', 'Malad'], 'lat': 19.0760, 'lng': 72.8777},
            'Pune': {'state': 'Maharashtra', 'localities': ['Hinjewadi', 'Baner', 'Kharadi', 'Wakad', 'Aundh'], 'lat': 18.5204, 'lng': 73.8567},
            'Bangalore': {'state': 'Karnataka', 'localities': ['Whitefield', 'Electronic City', 'HSR Layout', 'Indiranagar'], 'lat': 12.9716, 'lng': 77.5946},
            'Delhi': {'state': 'Delhi', 'localities': ['Dwarka', 'Rohini', 'Vasant Kunj', 'Saket'], 'lat': 28.7041, 'lng': 77.1025},
        }
        
        prefixes = ['Skyline', 'Green Valley', 'Metro', 'Royal', 'Premium', 'Elite', 'Grand', 'Luxury', 'Paradise', 'Heritage']
        suffixes = ['Heights', 'Residency', 'Towers', 'Apartments', 'Homes', 'Enclave', 'Gardens', 'Park']
        
        amenities_pool = ['Swimming Pool', 'Gym', 'Clubhouse', 'Kids Play Area', 'Parking', '24/7 Security', 'Power Backup', 'Lift', 'Landscaped Gardens']
        
        created = 0
        current_total = Project.objects.count()
        
        for i in range(23):
            builder = builders[i % len(builders)]
            city = random.choice(list(cities_data.keys()))
            city_info = cities_data[city]
            locality = random.choice(city_info['localities'])
            
            name = f"{random.choice(prefixes)} {random.choice(suffixes)} Phase {i+1}"
            slug = slugify(f"{name}-{current_total+i+1}")
            
            project = Project.objects.create(
                name=name,
                slug=slug,
                developer=builder,
                description=f"{name} offers premium living with modern amenities in {locality}, {city}. Experience luxury and comfort at its best.",
                city=city,
                state=city_info['state'],
                pincode=str(random.randint(400001, 560100)),
                address=f"Plot No. {100+i}, Sector {random.randint(1, 50)}, {locality}, {city}",
                latitude=Decimal(str(city_info['lat'] + random.uniform(-0.05, 0.05))),
                longitude=Decimal(str(city_info['lng'] + random.uniform(-0.05, 0.05))),
                total_units=random.choice([80, 100, 120, 150, 200]),
                available_units=random.randint(20, 80),
                starting_price=Decimal(random.randint(4000000, 8000000)),
                total_area_sqft=Decimal(random.randint(50000, 200000)),
                project_type='residential',
                status=random.choice(['upcoming', 'ongoing', 'completed']),
                launch_date=timezone.now().date() - timedelta(days=random.randint(100, 600)),
                expected_completion=timezone.now().date() + timedelta(days=random.randint(200, 800)),
                amenities=random.sample(amenities_pool, random.randint(5, 8)),
                verified=True,
                verification_score=Decimal(random.randint(75, 95)),
                total_floors=random.randint(10, 25),
                cover_image='https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                gallery_images=[
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
                ]
            )
            
            # Add 2-3 property types
            property_configs = [
                {'type': '2 BHK', 'carpet': 800, 'price': 6000000},
                {'type': '3 BHK', 'carpet': 1200, 'price': 9000000},
                {'type': '4 BHK', 'carpet': 1600, 'price': 12000000},
            ]
            
            for idx, config in enumerate(random.sample(property_configs, 2)):
                for unit_num in range(1, random.randint(3, 6)):
                    Property.objects.create(
                        project=project,
                        unit_number=f"{chr(65+idx)}{unit_num:03d}",
                        property_type=config['type'].lower().replace(' ', ''),
                        carpet_area=Decimal(config['carpet']),
                        built_up_area=Decimal(config['carpet'] * 1.2),
                        super_built_up_area=Decimal(config['carpet'] * 1.35),
                        price=Decimal(config['price']),
                        bedrooms=int(config['type'][0]),
                        bathrooms=int(config['type'][0]),
                        balconies=random.randint(1, 2),
                        status='available',
                        features=[random.choice(['Corner Unit', 'Park Facing', 'Road Facing', 'Premium'])]
                    )
            
            created += 1
        
        # Update builder stats
        for builder in builders:
            builder.total_projects = Project.objects.filter(developer=builder).count()
            builder.completed_projects = Project.objects.filter(developer=builder, status='completed').count()
            builder.save()
        
        total_now = Project.objects.count()
        self.stdout.write(self.style.SUCCESS(f'\n✓ Created {created} new projects!'))
        self.stdout.write(self.style.SUCCESS(f'✓ Total projects now: {total_now}'))
        
        # Show distribution
        self.stdout.write(self.style.WARNING('\nProject Distribution:'))
        for builder in builders:
            count = Project.objects.filter(developer=builder).count()
            self.stdout.write(f'  {builder.company_name}: {count} projects')
