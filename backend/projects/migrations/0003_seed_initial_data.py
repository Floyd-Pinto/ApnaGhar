# Generated migration to seed initial project data

from django.db import migrations
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
import random

User = get_user_model()


def seed_data(apps, schema_editor):
    """Seed initial data - runs once automatically"""
    Developer = apps.get_model('projects', 'Developer')
    Project = apps.get_model('projects', 'Project')
    Property = apps.get_model('projects', 'Property')
    ConstructionMilestone = apps.get_model('projects', 'ConstructionMilestone')
    Review = apps.get_model('projects', 'Review')
    
    # Check if data already exists
    if Project.objects.exists():
        print("Data already seeded, skipping...")
        return
    
    print("Seeding initial data...")
    
    # Create users
    users = []
    user_data = [
        {'email': 'dev1@apnaghar.com', 'first_name': 'Rahul', 'last_name': 'Sharma', 'role': 'builder'},
        {'email': 'dev2@apnaghar.com', 'first_name': 'Priya', 'last_name': 'Patel', 'role': 'builder'},
        {'email': 'dev3@apnaghar.com', 'first_name': 'Amit', 'last_name': 'Singh', 'role': 'builder'},
        {'email': 'buyer1@apnaghar.com', 'first_name': 'Anjali', 'last_name': 'Verma', 'role': 'buyer'},
        {'email': 'buyer2@apnaghar.com', 'first_name': 'Vikram', 'last_name': 'Mehta', 'role': 'buyer'},
    ]
    
    for data in user_data:
        user, created = User.objects.get_or_create(
            email=data['email'],
            defaults={
                'username': data['email'].split('@')[0],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': data['role']
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
        users.append(user)
    
    # Create developers
    developers = []
    dev_data = [
        {
            'user': users[0],
            'company_name': 'Skyline Developers',
            'rera_number': 'RERA/MH/001',
            'verified': True,
            'trust_score': Decimal('4.5'),
            'description': 'Premium residential and commercial projects across Mumbai',
            'established_year': 2010,
            'total_projects': 15,
            'completed_projects': 12,
        },
        {
            'user': users[1],
            'company_name': 'Green Valley Builders',
            'rera_number': 'RERA/MH/002',
            'verified': True,
            'trust_score': Decimal('4.2'),
            'description': 'Eco-friendly sustainable housing solutions',
            'established_year': 2015,
            'total_projects': 8,
            'completed_projects': 6,
        },
        {
            'user': users[2],
            'company_name': 'Metro Constructions',
            'rera_number': 'RERA/MH/003',
            'verified': False,
            'trust_score': Decimal('3.8'),
            'description': 'Affordable housing in prime locations',
            'established_year': 2018,
            'total_projects': 5,
            'completed_projects': 3,
        },
    ]
    
    for data in dev_data:
        developer, created = Developer.objects.get_or_create(
            user=data['user'],
            defaults=data
        )
        developers.append(developer)
    
    # Create 23 projects
    project_data = [
        # Mumbai
        {'name': 'Skyline Heights', 'city': 'Mumbai', 'developer': developers[0],
         'starting_price': Decimal('8500000'), 'total_units': 120, 'status': 'ongoing',
         'lat': Decimal('19.0760'), 'lng': Decimal('72.8777')},
        {'name': 'Metro Apartments', 'city': 'Mumbai', 'developer': developers[2],
         'starting_price': Decimal('4200000'), 'total_units': 60, 'status': 'upcoming',
         'lat': Decimal('19.1136'), 'lng': Decimal('72.8697')},
        {'name': 'Coastal Paradise', 'city': 'Mumbai', 'developer': developers[0],
         'starting_price': Decimal('15000000'), 'total_units': 200, 'status': 'ongoing',
         'lat': Decimal('19.0896'), 'lng': Decimal('72.8656')},
        {'name': 'Andheri Residency', 'city': 'Mumbai', 'developer': developers[1],
         'starting_price': Decimal('6800000'), 'total_units': 95, 'status': 'completed',
         'lat': Decimal('19.1197'), 'lng': Decimal('72.8464')},
        {'name': 'Powai Lake View', 'city': 'Mumbai', 'developer': developers[0],
         'starting_price': Decimal('11500000'), 'total_units': 140, 'status': 'ongoing',
         'lat': Decimal('19.1176'), 'lng': Decimal('72.9060')},
        # Pune
        {'name': 'Green Valley Residency', 'city': 'Pune', 'developer': developers[1],
         'starting_price': Decimal('5500000'), 'total_units': 80, 'status': 'ongoing',
         'lat': Decimal('18.5204'), 'lng': Decimal('73.8567')},
        {'name': 'Eco Gardens', 'city': 'Pune', 'developer': developers[1],
         'starting_price': Decimal('6200000'), 'total_units': 90, 'status': 'completed',
         'lat': Decimal('18.5314'), 'lng': Decimal('73.8446')},
        {'name': 'Hinjewadi Tech Park Homes', 'city': 'Pune', 'developer': developers[2],
         'starting_price': Decimal('4800000'), 'total_units': 110, 'status': 'ongoing',
         'lat': Decimal('18.5912'), 'lng': Decimal('73.7389')},
        {'name': 'Koregaon Park Residency', 'city': 'Pune', 'developer': developers[0],
         'starting_price': Decimal('7500000'), 'total_units': 75, 'status': 'upcoming',
         'lat': Decimal('18.5362'), 'lng': Decimal('73.8930')},
        {'name': 'Baner Hills', 'city': 'Pune', 'developer': developers[1],
         'starting_price': Decimal('5900000'), 'total_units': 100, 'status': 'ongoing',
         'lat': Decimal('18.5590'), 'lng': Decimal('73.7845')},
        # Bangalore
        {'name': 'Luxury Towers', 'city': 'Bangalore', 'developer': developers[0],
         'starting_price': Decimal('12000000'), 'total_units': 150, 'status': 'ongoing',
         'lat': Decimal('12.9716'), 'lng': Decimal('77.5946')},
        {'name': 'Whitefield Tech Residency', 'city': 'Bangalore', 'developer': developers[2],
         'starting_price': Decimal('7200000'), 'total_units': 130, 'status': 'ongoing',
         'lat': Decimal('12.9698'), 'lng': Decimal('77.7499')},
        {'name': 'Koramangala Heights', 'city': 'Bangalore', 'developer': developers[1],
         'starting_price': Decimal('9800000'), 'total_units': 85, 'status': 'completed',
         'lat': Decimal('12.9352'), 'lng': Decimal('77.6245')},
        {'name': 'Electronic City Homes', 'city': 'Bangalore', 'developer': developers[0],
         'starting_price': Decimal('5500000'), 'total_units': 160, 'status': 'ongoing',
         'lat': Decimal('12.8456'), 'lng': Decimal('77.6603')},
        {'name': 'Indiranagar Apartments', 'city': 'Bangalore', 'developer': developers[2],
         'starting_price': Decimal('11000000'), 'total_units': 70, 'status': 'upcoming',
         'lat': Decimal('12.9784'), 'lng': Decimal('77.6408')},
        # Delhi
        {'name': 'Capital Residency', 'city': 'Delhi', 'developer': developers[0],
         'starting_price': Decimal('9500000'), 'total_units': 180, 'status': 'ongoing',
         'lat': Decimal('28.7041'), 'lng': Decimal('77.1025')},
        {'name': 'Dwarka Enclave', 'city': 'Delhi', 'developer': developers[1],
         'starting_price': Decimal('6800000'), 'total_units': 120, 'status': 'ongoing',
         'lat': Decimal('28.5921'), 'lng': Decimal('77.0460')},
        {'name': 'Rohini Gardens', 'city': 'Delhi', 'developer': developers[2],
         'starting_price': Decimal('5200000'), 'total_units': 95, 'status': 'completed',
         'lat': Decimal('28.7495'), 'lng': Decimal('77.0736')},
        {'name': 'Vasant Vihar Towers', 'city': 'Delhi', 'developer': developers[0],
         'starting_price': Decimal('18000000'), 'total_units': 60, 'status': 'upcoming',
         'lat': Decimal('28.5672'), 'lng': Decimal('77.1574')},
        # Hyderabad
        {'name': 'Hi-Tech City Residency', 'city': 'Hyderabad', 'developer': developers[1],
         'starting_price': Decimal('6500000'), 'total_units': 140, 'status': 'ongoing',
         'lat': Decimal('17.4435'), 'lng': Decimal('78.3772')},
        {'name': 'Gachibowli Apartments', 'city': 'Hyderabad', 'developer': developers[2],
         'starting_price': Decimal('5800000'), 'total_units': 110, 'status': 'ongoing',
         'lat': Decimal('17.4399'), 'lng': Decimal('78.3489')},
        {'name': 'Banjara Hills Luxury', 'city': 'Hyderabad', 'developer': developers[0],
         'starting_price': Decimal('12500000'), 'total_units': 80, 'status': 'completed',
         'lat': Decimal('17.4239'), 'lng': Decimal('78.4738')},
        {'name': 'Kukatpally Heights', 'city': 'Hyderabad', 'developer': developers[1],
         'starting_price': Decimal('4900000'), 'total_units': 125, 'status': 'upcoming',
         'lat': Decimal('17.4849'), 'lng': Decimal('78.4138')},
    ]
    
    states = {
        'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra',
        'Bangalore': 'Karnataka', 'Delhi': 'Delhi',
        'Hyderabad': 'Telangana'
    }
    
    cover_images = [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ]
    
    amenities_options = [
        ['Swimming Pool', 'Gym', 'Club House', 'Kids Play Area', '24/7 Security', 'Power Backup'],
        ['Jogging Track', 'Indoor Games', 'Landscaped Gardens', 'Yoga Deck', 'Car Parking', 'CCTV'],
        ['Tennis Court', 'Squash Court', 'Party Hall', 'Amphitheater', 'Convenience Store', 'Spa'],
        ['Basketball Court', 'Badminton Court', 'Library', 'Co-working Space', 'EV Charging', 'Cafeteria'],
    ]
    
    projects = []
    for i, data in enumerate(project_data):
        slug = data['name'].lower().replace(' ', '-')
        city = data['city']
        
        project = Project.objects.create(
            slug=slug,
            name=data['name'],
            developer=data['developer'],
            starting_price=data['starting_price'],
            total_units=data['total_units'],
            status=data['status'],
            description=f'Experience luxury living at {data["name"]}, a premium residential project in the heart of {city}.',
            project_type='residential',
            address=f'Plot No. {i+1}, Sector {(i % 20) + 1}, {city}',
            state=states.get(city, 'Maharashtra'),
            pincode=f'{400001 + i}',
            latitude=data['lat'],
            longitude=data['lng'],
            available_units=data['total_units'] - random.randint(10, min(40, data['total_units'] // 2)),
            cover_image=cover_images[i % len(cover_images)],
            gallery_images=[cover_images[(i + j) % len(cover_images)] for j in range(1, 6)],
            launch_date=timezone.now().date() - timedelta(days=random.randint(30, 365)),
            expected_completion=timezone.now().date() + timedelta(days=random.randint(180, 730)),
            total_floors=random.choice([12, 15, 18, 20, 25, 30]),
            total_area_sqft=Decimal(data['total_units'] * random.randint(800, 1200)),
            amenities=amenities_options[i % len(amenities_options)],
            verified=data['status'] != 'upcoming',
            verification_score=Decimal(random.uniform(75, 98) if data['status'] != 'upcoming' else random.uniform(50, 75)),
        )
        projects.append(project)
    
    print(f"✅ Seeded {len(projects)} projects successfully!")


def reverse_seed_data(apps, schema_editor):
    """Remove seeded data if migration is reversed"""
    Project = apps.get_model('projects', 'Project')
    Developer = apps.get_model('projects', 'Developer')
    User = get_user_model()
    
    # Delete in reverse order due to foreign keys
    Project.objects.all().delete()
    Developer.objects.all().delete()
    User.objects.filter(email__in=[
        'dev1@apnaghar.com', 'dev2@apnaghar.com', 'dev3@apnaghar.com',
        'buyer1@apnaghar.com', 'buyer2@apnaghar.com'
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0002_alter_project_verification_score'),
    ]

    operations = [
        migrations.RunPython(seed_data, reverse_seed_data),
    ]
