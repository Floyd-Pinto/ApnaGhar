# Generated migration to seed large dataset (200+ projects)

from django.db import migrations
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
import random

User = get_user_model()


def seed_large_dataset(apps, schema_editor):
    """Seed 200+ projects with properties across multiple cities"""
    Developer = apps.get_model('projects', 'Developer')
    Project = apps.get_model('projects', 'Project')
    Property = apps.get_model('projects', 'Property')
    ConstructionMilestone = apps.get_model('projects', 'ConstructionMilestone')
    
    # Skip if already seeded
    if Project.objects.count() >= 200:
        print("Large dataset already seeded, skipping...")
        return
    
    print("Seeding large dataset (200+ projects)...")
    
    # Get existing developers or create more
    developers = list(Developer.objects.all())
    if not developers:
        print("No developers found! Run previous migration first.")
        return
    
    # Expanded city data with localities
    cities_data = {
        'Mumbai': {
            'state': 'Maharashtra',
            'localities': ['Andheri', 'Borivali', 'Malad', 'Kandivali', 'Bandra', 'Powai', 'Vikhroli', 
                          'Thane', 'Mulund', 'Ghatkopar', 'Kurla', 'Chembur', 'Worli', 'Lower Parel', 
                          'Dadar', 'Mahim', 'Santacruz', 'Juhu', 'Versova', 'Goregaon'],
            'base_lat': 19.0760, 'base_lng': 72.8777
        },
        'Pune': {
            'state': 'Maharashtra',
            'localities': ['Hinjewadi', 'Baner', 'Wakad', 'Pimple Saudagar', 'Kharadi', 'Viman Nagar', 
                          'Koregaon Park', 'Kalyani Nagar', 'Magarpatta', 'Hadapsar', 'Kothrud', 'Warje', 
                          'Aundh', 'Pashan', 'Bavdhan', 'Sus', 'Ravet', 'Punawale'],
            'base_lat': 18.5204, 'base_lng': 73.8567
        },
        'Bangalore': {
            'state': 'Karnataka',
            'localities': ['Whitefield', 'Electronic City', 'Marathahalli', 'Sarjapur Road', 'HSR Layout', 
                          'Koramangala', 'Indiranagar', 'Bellandur', 'Yelahanka', 'Hebbal', 'JP Nagar', 
                          'Jayanagar', 'BTM Layout', 'Bannerghatta Road', 'Hennur', 'Thanisandra'],
            'base_lat': 12.9716, 'base_lng': 77.5946
        },
        'Delhi': {
            'state': 'Delhi',
            'localities': ['Dwarka', 'Rohini', 'Pitampura', 'Janakpuri', 'Vasant Kunj', 'Saket', 
                          'Greater Kailash', 'Lajpat Nagar', 'Nehru Place', 'Mayur Vihar', 'Preet Vihar', 
                          'Noida Extension', 'Crossing Republik', 'Indirapuram', 'Vaishali'],
            'base_lat': 28.7041, 'base_lng': 77.1025
        },
        'Hyderabad': {
            'state': 'Telangana',
            'localities': ['Gachibowli', 'Hi-Tech City', 'Madhapur', 'Kondapur', 'Kukatpally', 'Miyapur', 
                          'Banjara Hills', 'Jubilee Hills', 'Manikonda', 'Financial District', 'Kokapet', 
                          'Narsingi', 'Kompally', 'Bachupally', 'Nizampet'],
            'base_lat': 17.4435, 'base_lng': 78.3772
        },
        'Gurgaon': {
            'state': 'Haryana',
            'localities': ['Sector 37', 'Sector 82', 'Sector 89', 'Golf Course Road', 'Sohna Road', 
                          'New Gurgaon', 'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'Sector 56', 
                          'Sector 63', 'Nirvana Country', 'South City', 'Palam Vihar'],
            'base_lat': 28.4595, 'base_lng': 77.0266
        },
        'Noida': {
            'state': 'Uttar Pradesh',
            'localities': ['Sector 62', 'Sector 76', 'Sector 137', 'Sector 150', 'Greater Noida West', 
                          'Noida Extension', 'Sector 16', 'Sector 18', 'Sector 44', 'Sector 52', 
                          'Sector 74', 'Sector 104', 'Sector 120', 'Sector 168'],
            'base_lat': 28.5355, 'base_lng': 77.3910
        },
        'Chennai': {
            'state': 'Tamil Nadu',
            'localities': ['OMR', 'Thoraipakkam', 'Sholinganallur', 'Velachery', 'Adyar', 'Anna Nagar', 
                          'T Nagar', 'Porur', 'Ambattur', 'Avadi', 'Perumbakkam', 'Pallikaranai', 
                          'Guindy', 'Kodambakkam', 'Nungambakkam'],
            'base_lat': 13.0827, 'base_lng': 80.2707
        }
    }
    
    # Project name templates
    project_prefixes = ['Skyline', 'Green Valley', 'Metro', 'Royal', 'Premium', 'Elite', 'Grand', 
                       'Luxury', 'Paradise', 'Heritage', 'Crown', 'Imperial', 'Prestige', 'Pinnacle', 
                       'Azure', 'Emerald', 'Pearl', 'Diamond', 'Platinum', 'Golden', 'Silver Oak', 
                       'Maple', 'Cedar', 'Willow', 'Sunshine', 'Moonlight', 'Star', 'Galaxy']
    
    project_suffixes = ['Heights', 'Residency', 'Towers', 'Apartments', 'Homes', 'Enclave', 'Gardens', 
                       'Park', 'Vista', 'Palms', 'Meadows', 'Valley', 'Hills', 'Crest', 'Ridge', 
                       'Woods', 'Springs', 'Lakes', 'Bay', 'Square', 'Plaza', 'Avenue', 'Boulevard', 
                       'Greens', 'Oasis', 'Retreat', 'Sanctuary', 'Paradise']
    
    # Property types with realistic configurations
    property_configs = {
        '1bhk': {'bedrooms': 1, 'bathrooms': 1, 'balconies': 1, 'area_range': (450, 650), 'price_multiplier': 0.7},
        '2bhk': {'bedrooms': 2, 'bathrooms': 2, 'balconies': 1, 'area_range': (800, 1100), 'price_multiplier': 1.0},
        '2.5bhk': {'bedrooms': 2, 'bathrooms': 2, 'balconies': 2, 'area_range': (1000, 1250), 'price_multiplier': 1.15},
        '3bhk': {'bedrooms': 3, 'bathrooms': 2, 'balconies': 2, 'area_range': (1200, 1600), 'price_multiplier': 1.4},
        '3.5bhk': {'bedrooms': 3, 'bathrooms': 3, 'balconies': 2, 'area_range': (1500, 1800), 'price_multiplier': 1.6},
        '4bhk': {'bedrooms': 4, 'bathrooms': 3, 'balconies': 2, 'area_range': (1800, 2400), 'price_multiplier': 2.0},
        '5bhk': {'bedrooms': 5, 'bathrooms': 4, 'balconies': 3, 'area_range': (2500, 3500), 'price_multiplier': 2.8},
    }
    
    # Amenities pool
    amenities_pool = [
        ['Swimming Pool', 'Gym', 'Club House', 'Kids Play Area', '24/7 Security', 'Power Backup', 'Intercom'],
        ['Jogging Track', 'Indoor Games', 'Landscaped Gardens', 'Yoga Deck', 'Multipurpose Hall', 'CCTV', 'Lift'],
        ['Tennis Court', 'Squash Court', 'Party Hall', 'Amphitheater', 'Convenience Store', 'Spa', 'Salon'],
        ['Basketball Court', 'Badminton Court', 'Library', 'Co-working Space', 'EV Charging', 'Cafeteria', 'ATM'],
        ['Mini Theatre', 'Guest Rooms', 'Meditation Room', 'Senior Citizen Area', 'Pet Park', 'Cycling Track'],
        ['Rooftop Garden', 'BBQ Area', 'Card Room', 'Billiards', 'Table Tennis', 'Skating Rink', 'Art Studio'],
    ]
    
    cover_images = [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
        'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    ]
    
    wings = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    statuses = ['ongoing', 'ongoing', 'ongoing', 'upcoming', 'completed']  # More ongoing projects
    
    projects_created = 0
    properties_created = 0
    
    # Generate 210 projects
    for i in range(210):
        # Select random city and locality
        city_name = random.choice(list(cities_data.keys()))
        city_info = cities_data[city_name]
        locality = random.choice(city_info['localities'])
        
        # Generate project name
        project_name = f"{locality} {random.choice(project_suffixes)}"
        if random.random() > 0.6:
            project_name = f"{random.choice(project_prefixes)} {locality}"
        
        slug = f"{project_name.lower().replace(' ', '-')}-{i}"
        
        # Random developer
        developer = random.choice(developers)
        
        # Project configuration
        status = random.choice(statuses)
        total_floors = random.choice([8, 10, 12, 15, 18, 20, 25, 30, 35, 40])
        num_wings = random.choices([1, 2, 3, 4, 5, 6], weights=[10, 30, 25, 20, 10, 5])[0]
        units_per_floor = random.randint(2, 8)
        total_units = total_floors * units_per_floor * num_wings
        
        # Base price varies by city
        city_price_multiplier = {
            'Mumbai': 1.5, 'Bangalore': 1.3, 'Delhi': 1.2, 'Gurgaon': 1.3,
            'Pune': 1.0, 'Hyderabad': 0.9, 'Noida': 0.8, 'Chennai': 0.85
        }
        base_price = Decimal(random.randint(35, 85) * 100000) * Decimal(city_price_multiplier.get(city_name, 1.0))
        
        # Location with slight variation
        lat_offset = (random.random() - 0.5) * 0.2
        lng_offset = (random.random() - 0.5) * 0.2
        
        # Amenities
        num_amenity_sets = random.randint(1, 3)
        selected_amenities = []
        for _ in range(num_amenity_sets):
            selected_amenities.extend(random.choice(amenities_pool))
        amenities = list(set(selected_amenities))[:15]  # Limit to 15 unique
        
        # Create project
        project = Project.objects.create(
            slug=slug,
            name=project_name,
            developer=developer,
            starting_price=base_price,
            total_units=total_units,
            status=status,
            description=f'Experience luxury living at {project_name}, a premium residential project in {locality}, {city_name}. Featuring modern architecture, world-class amenities, and excellent connectivity.',
            project_type='residential',
            address=f'Plot No. {random.randint(1, 500)}, {locality}, {city_name}',
            city=locality,
            state=city_info['state'],
            pincode=f'{random.randint(100000, 899999)}',
            latitude=Decimal(city_info['base_lat'] + lat_offset),
            longitude=Decimal(city_info['base_lng'] + lng_offset),
            available_units=total_units - random.randint(int(total_units * 0.1), int(total_units * 0.4)),
            cover_image=random.choice(cover_images),
            gallery_images=[random.choice(cover_images) for _ in range(5)],
            launch_date=timezone.now().date() - timedelta(days=random.randint(30, 730)),
            expected_completion=timezone.now().date() + timedelta(days=random.randint(180, 1095)),
            total_floors=total_floors,
            total_area_sqft=Decimal(total_units * random.randint(900, 1400)),
            amenities=amenities,
            verified=status != 'upcoming' and random.random() > 0.3,
            verification_score=Decimal(random.uniform(75, 98) if status != 'upcoming' else random.uniform(50, 75)),
            views_count=random.randint(5, 500),
        )
        projects_created += 1
        
        # Create properties for each wing
        property_types_distribution = {
            '1bhk': 0.1, '2bhk': 0.35, '2.5bhk': 0.15, 
            '3bhk': 0.25, '3.5bhk': 0.08, '4bhk': 0.05, '5bhk': 0.02
        }
        
        unit_counter = 1
        for wing_idx in range(num_wings):
            wing_name = wings[wing_idx] if num_wings > 1 else None
            
            # Randomly select property types for this wing
            wing_property_types = random.choices(
                list(property_types_distribution.keys()),
                weights=list(property_types_distribution.values()),
                k=random.randint(1, 3)
            )
            
            # Create properties (sample 15-30% of units)
            num_properties_to_create = random.randint(
                max(5, int(total_units / num_wings * 0.15)),
                int(total_units / num_wings * 0.30)
            )
            
            for _ in range(num_properties_to_create):
                property_type = random.choice(wing_property_types)
                config = property_configs[property_type]
                
                unit_number = f"{wing_name}{unit_counter:02d}" if wing_name else f"A{unit_counter:02d}"
                floor_number = random.randint(1, total_floors)
                carpet_area = Decimal(random.randint(*config['area_range']))
                
                # Price calculation with floor premium
                floor_premium = 1 + (floor_number / total_floors * 0.2)  # Up to 20% for top floors
                property_price = base_price * Decimal(config['price_multiplier']) * Decimal(floor_premium)
                property_price += (carpet_area * Decimal(random.randint(3000, 6000)))
                
                property_status = random.choices(
                    ['available', 'booked', 'sold'],
                    weights=[0.60, 0.25, 0.15]
                )[0]
                
                Property.objects.create(
                    project=project,
                    unit_number=unit_number,
                    property_type=property_type,
                    floor_number=floor_number,
                    tower=wing_name,
                    carpet_area=carpet_area,
                    bedrooms=config['bedrooms'],
                    bathrooms=config['bathrooms'],
                    balconies=config['balconies'],
                    price=property_price,
                    status=property_status,
                    features=['Modular Kitchen', 'Wooden Flooring', 'Spacious Balcony', 'Vastu Compliant'][:random.randint(2, 4)]
                )
                properties_created += 1
                unit_counter += 1
        
        if (i + 1) % 50 == 0:
            print(f"Progress: {i + 1}/210 projects created...")
    
    print(f"✅ Seeded {projects_created} projects with {properties_created} properties!")
    print(f"📊 Total projects in database: {Project.objects.count()}")


def reverse_large_dataset(apps, schema_editor):
    """Remove large dataset if migration is reversed"""
    Project = apps.get_model('projects', 'Project')
    Property = apps.get_model('projects', 'Property')
    
    # Delete projects created by this migration (those with count > 23)
    if Project.objects.count() > 23:
        projects_to_delete = Project.objects.all()[23:]
        Property.objects.filter(project__in=projects_to_delete).delete()
        for project in projects_to_delete:
            project.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_seed_initial_data'),
    ]

    operations = [
        migrations.RunPython(seed_large_dataset, reverse_large_dataset),
    ]
