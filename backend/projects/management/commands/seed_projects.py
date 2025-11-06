from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import Developer, Project, Property, ConstructionMilestone, Review
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample projects, developers, and construction data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to seed database...'))
        
        # Create sample users for developers
        users = self.create_sample_users()
        
        # Create developers
        developers = self.create_developers(users)
        
        # Create projects
        projects = self.create_projects(developers)
        
        # Create properties
        self.create_properties(projects)
        
        # Create construction milestones
        self.create_milestones(projects)
        
        # Create reviews
        self.create_reviews(projects, users)
        
        self.stdout.write(self.style.SUCCESS('✅ Database seeded successfully!'))
        self.stdout.write(self.style.SUCCESS(f'Created: {len(developers)} developers, {len(projects)} projects'))

    def create_sample_users(self):
        """Create sample users if they don't exist"""
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
                self.stdout.write(f'Created user: {user.email}')
            users.append(user)
        
        return users

    def create_developers(self, users):
        """Create developer profiles"""
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
            if created:
                self.stdout.write(f'Created developer: {developer.company_name}')
            developers.append(developer)
        
        return developers

    def create_projects(self, developers):
        """Create sample projects"""
        projects = []
        
        project_data = [
            # Mumbai Projects
            {
                'name': 'Skyline Heights', 'city': 'Mumbai', 'developer': developers[0],
                'starting_price': Decimal('8500000'), 'total_units': 120, 'status': 'ongoing',
                'lat': Decimal('19.0760'), 'lng': Decimal('72.8777')
            },
            {
                'name': 'Metro Apartments', 'city': 'Mumbai', 'developer': developers[2],
                'starting_price': Decimal('4200000'), 'total_units': 60, 'status': 'upcoming',
                'lat': Decimal('19.1136'), 'lng': Decimal('72.8697')
            },
            {
                'name': 'Coastal Paradise', 'city': 'Mumbai', 'developer': developers[0],
                'starting_price': Decimal('15000000'), 'total_units': 200, 'status': 'ongoing',
                'lat': Decimal('19.0896'), 'lng': Decimal('72.8656')
            },
            {
                'name': 'Andheri Residency', 'city': 'Mumbai', 'developer': developers[1],
                'starting_price': Decimal('6800000'), 'total_units': 95, 'status': 'completed',
                'lat': Decimal('19.1197'), 'lng': Decimal('72.8464')
            },
            {
                'name': 'Powai Lake View', 'city': 'Mumbai', 'developer': developers[0],
                'starting_price': Decimal('11500000'), 'total_units': 140, 'status': 'ongoing',
                'lat': Decimal('19.1176'), 'lng': Decimal('72.9060')
            },
            # Pune Projects
            {
                'name': 'Green Valley Residency', 'city': 'Pune', 'developer': developers[1],
                'starting_price': Decimal('5500000'), 'total_units': 80, 'status': 'ongoing',
                'lat': Decimal('18.5204'), 'lng': Decimal('73.8567')
            },
            {
                'name': 'Eco Gardens', 'city': 'Pune', 'developer': developers[1],
                'starting_price': Decimal('6200000'), 'total_units': 90, 'status': 'completed',
                'lat': Decimal('18.5314'), 'lng': Decimal('73.8446')
            },
            {
                'name': 'Hinjewadi Tech Park Homes', 'city': 'Pune', 'developer': developers[2],
                'starting_price': Decimal('4800000'), 'total_units': 110, 'status': 'ongoing',
                'lat': Decimal('18.5912'), 'lng': Decimal('73.7389')
            },
            {
                'name': 'Koregaon Park Residency', 'city': 'Pune', 'developer': developers[0],
                'starting_price': Decimal('7500000'), 'total_units': 75, 'status': 'upcoming',
                'lat': Decimal('18.5362'), 'lng': Decimal('73.8930')
            },
            {
                'name': 'Baner Hills', 'city': 'Pune', 'developer': developers[1],
                'starting_price': Decimal('5900000'), 'total_units': 100, 'status': 'ongoing',
                'lat': Decimal('18.5590'), 'lng': Decimal('73.7845')
            },
            # Bangalore Projects
            {
                'name': 'Luxury Towers', 'city': 'Bangalore', 'developer': developers[0],
                'starting_price': Decimal('12000000'), 'total_units': 150, 'status': 'ongoing',
                'lat': Decimal('12.9716'), 'lng': Decimal('77.5946')
            },
            {
                'name': 'Whitefield Tech Residency', 'city': 'Bangalore', 'developer': developers[2],
                'starting_price': Decimal('7200000'), 'total_units': 130, 'status': 'ongoing',
                'lat': Decimal('12.9698'), 'lng': Decimal('77.7499')
            },
            {
                'name': 'Koramangala Heights', 'city': 'Bangalore', 'developer': developers[1],
                'starting_price': Decimal('9800000'), 'total_units': 85, 'status': 'completed',
                'lat': Decimal('12.9352'), 'lng': Decimal('77.6245')
            },
            {
                'name': 'Electronic City Homes', 'city': 'Bangalore', 'developer': developers[0],
                'starting_price': Decimal('5500000'), 'total_units': 160, 'status': 'ongoing',
                'lat': Decimal('12.8456'), 'lng': Decimal('77.6603')
            },
            {
                'name': 'Indiranagar Apartments', 'city': 'Bangalore', 'developer': developers[2],
                'starting_price': Decimal('11000000'), 'total_units': 70, 'status': 'upcoming',
                'lat': Decimal('12.9784'), 'lng': Decimal('77.6408')
            },
            # Delhi Projects
            {
                'name': 'Capital Residency', 'city': 'Delhi', 'developer': developers[0],
                'starting_price': Decimal('9500000'), 'total_units': 180, 'status': 'ongoing',
                'lat': Decimal('28.7041'), 'lng': Decimal('77.1025')
            },
            {
                'name': 'Dwarka Enclave', 'city': 'Delhi', 'developer': developers[1],
                'starting_price': Decimal('6800000'), 'total_units': 120, 'status': 'ongoing',
                'lat': Decimal('28.5921'), 'lng': Decimal('77.0460')
            },
            {
                'name': 'Rohini Gardens', 'city': 'Delhi', 'developer': developers[2],
                'starting_price': Decimal('5200000'), 'total_units': 95, 'status': 'completed',
                'lat': Decimal('28.7495'), 'lng': Decimal('77.0736')
            },
            {
                'name': 'Vasant Vihar Towers', 'city': 'Delhi', 'developer': developers[0],
                'starting_price': Decimal('18000000'), 'total_units': 60, 'status': 'upcoming',
                'lat': Decimal('28.5672'), 'lng': Decimal('77.1574')
            },
            # Hyderabad Projects
            {
                'name': 'Hi-Tech City Residency', 'city': 'Hyderabad', 'developer': developers[1],
                'starting_price': Decimal('6500000'), 'total_units': 140, 'status': 'ongoing',
                'lat': Decimal('17.4435'), 'lng': Decimal('78.3772')
            },
            {
                'name': 'Gachibowli Apartments', 'city': 'Hyderabad', 'developer': developers[2],
                'starting_price': Decimal('5800000'), 'total_units': 110, 'status': 'ongoing',
                'lat': Decimal('17.4399'), 'lng': Decimal('78.3489')
            },
            {
                'name': 'Banjara Hills Luxury', 'city': 'Hyderabad', 'developer': developers[0],
                'starting_price': Decimal('12500000'), 'total_units': 80, 'status': 'completed',
                'lat': Decimal('17.4239'), 'lng': Decimal('78.4738')
            },
            {
                'name': 'Kukatpally Heights', 'city': 'Hyderabad', 'developer': developers[1],
                'starting_price': Decimal('4900000'), 'total_units': 125, 'status': 'upcoming',
                'lat': Decimal('17.4849'), 'lng': Decimal('78.4138')
            },
        ]
        
        states = {
            'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra',
            'Bangalore': 'Karnataka', 'Delhi': 'Delhi',
            'Hyderabad': 'Telangana'
        }
        
        # Placeholder images - will be replaced with Cloudinary later
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
        
        for i, data in enumerate(project_data):
            slug = data['name'].lower().replace(' ', '-')
            city = data['city']
            
            project, created = Project.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': data['name'],
                    'developer': data['developer'],
                    'starting_price': data['starting_price'],
                    'total_units': data['total_units'],
                    'status': data['status'],
                    'description': f'Experience luxury living at {data["name"]}, a premium residential project in the heart of {city}. Featuring modern architecture, world-class amenities, and excellent connectivity.',
                    'project_type': 'residential',
                    'address': f'Plot No. {i+1}, Sector {(i % 20) + 1}, {city}',
                    'state': states.get(city, 'Maharashtra'),
                    'pincode': f'{400001 + i}',
                    'latitude': data['lat'],
                    'longitude': data['lng'],
                    'available_units': data['total_units'] - random.randint(10, min(40, data['total_units'] // 2)),
                    'cover_image': cover_images[i % len(cover_images)],
                    'gallery_images': [cover_images[(i + j) % len(cover_images)] for j in range(1, 6)],
                    'launch_date': timezone.now().date() - timedelta(days=random.randint(30, 365)),
                    'expected_completion': timezone.now().date() + timedelta(days=random.randint(180, 730)),
                    'total_floors': random.choice([12, 15, 18, 20, 25, 30]),
                    'total_area_sqft': Decimal(data['total_units'] * random.randint(800, 1200)),
                    'amenities': amenities_options[i % len(amenities_options)],
                    'verified': data['status'] != 'upcoming',
                    'verification_score': Decimal(random.uniform(75, 98) if data['status'] != 'upcoming' else random.uniform(50, 75)),
                }
            )
            if created:
                self.stdout.write(f'Created project: {project.name}')
            projects.append(project)
        
        return projects

    def create_properties(self, projects):
        """Create property units for each project"""
        property_types = ['2bhk', '3bhk', '4bhk']
        
        for project in projects:
            for i in range(min(10, project.total_units)):  # Create 10 sample units
                unit_number = f'{chr(65 + i // 10)}{(i % 10) + 1:02d}'
                prop_type = random.choice(property_types)
                bedrooms = int(prop_type[0])
                
                Property.objects.get_or_create(
                    project=project,
                    unit_number=unit_number,
                    defaults={
                        'property_type': prop_type,
                        'floor_number': (i % 10) + 1,
                        'carpet_area': Decimal(random.randint(800, 1500)),
                        'bedrooms': bedrooms,
                        'bathrooms': bedrooms,
                        'balconies': random.randint(1, 2),
                        'price': project.starting_price + Decimal(random.randint(0, 2000000)),
                        'status': random.choice(['available', 'available', 'booked']),
                        'features': ['Modular Kitchen', 'Wooden Flooring', 'Spacious Balcony'],
                    }
                )

    def create_milestones(self, projects):
        """Create construction milestones"""
        milestone_titles = [
            'Foundation & Plinth',
            'Structural Framework',
            'Brickwork & Masonry',
            'Electrical & Plumbing',
            'Plastering & Finishing',
            'Final Inspection',
        ]
        
        for project in projects:
            if project.status != 'upcoming':
                for i, title in enumerate(milestone_titles):
                    ConstructionMilestone.objects.get_or_create(
                        project=project,
                        phase_number=i + 1,
                        defaults={
                            'title': title,
                            'description': f'{title} work for {project.name}',
                            'target_date': project.launch_date + timedelta(days=(i + 1) * 60),
                            'status': 'completed' if i < 3 else 'in_progress' if i == 3 else 'pending',
                            'progress_percentage': Decimal(100 if i < 3 else (50 if i == 3 else 0)),
                            'verified': i < 3,
                            'images': [f'https://images.unsplash.com/photo-{1560518883+i}-construction?w=600'] * 3,
                        }
                    )

    def create_reviews(self, projects, users):
        """Create sample reviews"""
        comments = [
            'Excellent project with great amenities',
            'Good location and construction quality',
            'Value for money, highly recommended',
            'Amazing architecture and planning',
        ]
        
        buyer_users = [u for u in users if u.role == 'buyer']
        
        for project in projects[:3]:  # Only first 3 projects
            for user in buyer_users[:2]:  # Only first 2 buyers
                Review.objects.get_or_create(
                    project=project,
                    user=user,
                    defaults={
                        'rating': random.randint(4, 5),
                        'title': 'Great Experience',
                        'comment': random.choice(comments),
                        'location_rating': random.randint(4, 5),
                        'amenities_rating': random.randint(4, 5),
                        'value_rating': random.randint(3, 5),
                        'verified_buyer': random.choice([True, False]),
                    }
                )
