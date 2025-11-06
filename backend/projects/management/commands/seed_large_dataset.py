from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify
from projects.models import Developer, Project, Property, ConstructionMilestone
from decimal import Decimal
import random
from datetime import datetime, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds database with 210+ realistic projects across multiple cities'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='If set, delete existing seeded data without prompting'
        )
        parser.add_argument(
            '--total',
            type=int,
            default=50,
            help='Total number of projects to create across all cities (default: 50)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting large dataset seed...'))
        
        # Check if already seeded (use --total to control target)
        force = options.get('force')
        total_target = options.get('total') or 0
        existing = Project.objects.count()
        if existing >= total_target and total_target > 0:
            if force:
                self.stdout.write(self.style.WARNING(f'Database has {existing} projects — --force provided, deleting existing seeded data...'))
                Property.objects.all().delete()
                ConstructionMilestone.objects.all().delete()
                Project.objects.all().delete()
                Developer.objects.all().delete()
            else:
                self.stdout.write(self.style.WARNING(f'Database already has {existing} projects which is >= target ({total_target}).'))
                response = input('Delete existing data and re-seed? (yes/no): ')
                if response.lower() != 'yes':
                    return
                self.stdout.write(self.style.WARNING('Deleting existing data...'))
                Property.objects.all().delete()
                ConstructionMilestone.objects.all().delete()
                Project.objects.all().delete()
                Developer.objects.all().delete()
        
        # Create developers
        self.stdout.write('Creating developers...')
        developers = self.create_developers()
        
        # City configurations
        # Base city list (counts will be computed from the --total argument)
        cities = [
            ('Mumbai', 'Maharashtra', (19.0760, 72.8777)),
            ('Pune', 'Maharashtra', (18.5204, 73.8567)),
            ('Bangalore', 'Karnataka', (12.9716, 77.5946)),
            ('Delhi', 'Delhi', (28.7041, 77.1025)),
            ('Hyderabad', 'Telangana', (17.3850, 78.4867)),
        ]

        # Distribute total_target across cities evenly
        total_created = 0
        total_target = total_target or 50
        num_cities = len(cities)
        base = total_target // num_cities
        remainder = total_target % num_cities
        city_counts = [base + (1 if idx < remainder else 0) for idx in range(num_cities)]

        for idx, (city, state, coords) in enumerate(cities):
            count = city_counts[idx]
            if count <= 0:
                continue
            self.stdout.write(f'\nSeeding {count} projects for {city}...')
            created = self.seed_city_projects(city, state, coords, count, developers)
            total_created += created
            self.stdout.write(self.style.SUCCESS(f'✓ {city}: {created} projects created (Total: {total_created})'))
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Seeding complete! Created {total_created} projects.'))
        self.stdout.write(f'Total developers: {Developer.objects.count()}')
        self.stdout.write(f'Total properties: {Property.objects.count()}')
        self.stdout.write(f'Total milestones: {ConstructionMilestone.objects.count()}')

    def create_developers(self):
        """Create 15 developers"""
        dev_data = [
            ('Skyline Developers', 'RERA/MH/001', True, '4.5', 'Premium luxury housing specialists'),
            ('Green Valley Builders', 'RERA/MH/002', True, '4.2', 'Eco-friendly sustainable housing'),
            ('Metro Constructions', 'RERA/KA/003', False, '3.8', 'Affordable housing experts'),
            ('Prestige Group', 'RERA/KA/004', True, '4.7', 'Luxury real estate leader'),
            ('Sobha Limited', 'RERA/KA/005', True, '4.6', 'Quality craftsmanship'),
            ('Godrej Properties', 'RERA/MH/006', True, '4.5', 'Trusted real estate brand'),
            ('DLF Limited', 'RERA/DL/007', True, '4.4', 'India\'s largest real estate company'),
            ('Brigade Group', 'RERA/KA/008', True, '4.3', 'Innovative urban living'),
            ('Lodha Group', 'RERA/MH/009', True, '4.8', 'World-class real estate'),
            ('Mahindra Lifespace', 'RERA/MH/010', True, '4.2', 'Sustainable communities'),
            ('Oberoi Realty', 'RERA/MH/011', True, '4.7', 'Luxury redefined'),
            ('Phoenix Mills', 'RERA/MH/012', True, '4.1', 'Mixed-use developments'),
            ('Hiranandani Group', 'RERA/MH/013', True, '4.5', 'Premium townships'),
            ('Kolte-Patil', 'RERA/MH/014', True, '4.0', 'Quality & value'),
            ('Puravankara', 'RERA/KA/015', True, '4.3', 'Customer-centric approach'),
        ]
        
        developers = []
        for i, (company, rera, verified, trust, desc) in enumerate(dev_data, 1):
            # reuse existing user/developer if present to avoid unique constraint errors
            email = f'dev{i}@apnaghar.com'
            username = f'developer{i}'
            with transaction.atomic():
                existing_user = User.objects.filter(email=email).first()
                if existing_user:
                    # if developer record exists, reuse it; otherwise create developer linked to existing user
                    dev, created_dev = Developer.objects.get_or_create(
                        user=existing_user,
                        defaults={
                            'company_name': company,
                            'rera_number': rera,
                            'verified': verified,
                            'trust_score': Decimal(trust),
                            'description': desc,
                            'established_year': random.randint(2005, 2020),
                            'total_projects': random.randint(5, 50),
                            'completed_projects': random.randint(3, 30)
                        }
                    )
                    developers.append(dev)
                else:
                    user = User.objects.create_user(
                        email=email,
                        username=username,
                        password='testpass123',
                        first_name=company.split()[0],
                        last_name='Admin',
                        role='builder'
                    )
                    dev = Developer.objects.create(
                        user=user,
                        company_name=company,
                        rera_number=rera,
                        verified=verified,
                        trust_score=Decimal(trust),
                        description=desc,
                        established_year=random.randint(2005, 2020),
                        total_projects=random.randint(5, 50),
                        completed_projects=random.randint(3, 30)
                    )
                    developers.append(dev)
        
        return developers

    def seed_city_projects(self, city, state, coords, count, developers):
        """Seed projects for a city in batches"""
        lat_base, lon_base = coords
        project_names = self.generate_project_names(city, count)
        
        created = 0
        batch_size = 10
        
        for i in range(0, count, batch_size):
            batch_end = min(i + batch_size, count)
            self.stdout.write(f'  Batch {i//batch_size + 1}: Creating projects {i+1}-{batch_end}...')

            for j in range(i, batch_end):
                try:
                    # create each project in its own atomic block so failures don't abort the whole batch
                    with transaction.atomic():
                        project = self.create_project(
                            project_names[j],
                            city,
                            state,
                            lat_base,
                            lon_base,
                            random.choice(developers)
                        )

                        # Create properties (1-3 wings)
                        num_wings = random.randint(1, 3)
                        self.create_properties(project, num_wings)

                        # Create milestones for ongoing/completed projects
                        if project.status in ['ongoing', 'completed']:
                            self.create_milestones(project)

                        created += 1
                        self.stdout.write(f'    Created project {j+1}: {project.name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'    Error creating project {j+1}: {str(e)}'))

            self.stdout.write(f'    ✓ Batch {i//batch_size + 1} complete')
        
        return created

    def generate_project_names(self, city, count):
        """Generate unique project names for a city"""
        prefixes = ['Royal', 'Grand', 'Elite', 'Premium', 'Luxury', 'Paradise', 'Golden', 
                    'Silver', 'Pearl', 'Diamond', 'Emerald', 'Sapphire', 'Ruby', 'Crystal',
                    'Harmony', 'Serenity', 'Tranquil', 'Peaceful', 'Blissful', 'Divine']
        
        suffixes = ['Heights', 'Towers', 'Residency', 'Apartments', 'Homes', 'Enclave',
                    'Gardens', 'Paradise', 'Vista', 'Horizon', 'Greens', 'Park', 'Plaza',
                    'Court', 'Square', 'Manor', 'Estate', 'Palazzo', 'Villa', 'Retreat']
        
        landmarks = {
            'Mumbai': ['Andheri', 'Powai', 'Bandra', 'Goregaon', 'Malad', 'Kandivali', 'Borivali', 'Thane'],
            'Pune': ['Hinjewadi', 'Baner', 'Wakad', 'Kharadi', 'Viman Nagar', 'Hadapsar', 'Aundh'],
            'Bangalore': ['Whitefield', 'Electronic City', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Bellandur'],
            'Delhi': ['Dwarka', 'Rohini', 'Vasant Vihar', 'Saket', 'Noida', 'Gurgaon'],
            'Hyderabad': ['Gachibowli', 'Hi-Tech City', 'Banjara Hills', 'Jubilee Hills', 'Kukatpally'],
        }
        
        names = []
        used = set()
        
        for i in range(count):
            while True:
                if i < len(landmarks.get(city, [])):
                    # Use landmark-based names first
                    landmark = landmarks[city][i % len(landmarks[city])]
                    suffix = random.choice(suffixes)
                    name = f"{landmark} {suffix}"
                else:
                    # Use prefix+suffix combinations
                    prefix = random.choice(prefixes)
                    suffix = random.choice(suffixes)
                    name = f"{prefix} {suffix}"
                    if random.random() > 0.7:
                        name = f"{city} {name}"
                
                if name not in used:
                    used.add(name)
                    names.append(name)
                    break
        
        return names

    def create_project(self, name, city, state, lat_base, lon_base, developer):
        """Create a single project"""
        status = random.choice(['ongoing', 'upcoming', 'completed'])
        
        # Random location offset (±0.1 degrees ~11km)
        lat = lat_base + random.uniform(-0.1, 0.1)
        lon = lon_base + random.uniform(-0.1, 0.1)
        
        # Price based on city
        city_price_multipliers = {
            'Mumbai': (8000000, 20000000),
            'Pune': (4000000, 12000000),
            'Bangalore': (5000000, 15000000),
            'Delhi': (6000000, 18000000),
            'Hyderabad': (4000000, 10000000),
        }
        min_price, max_price = city_price_multipliers.get(city, (4000000, 10000000))
        starting_price = Decimal(random.randint(min_price, max_price))
        
        total_units = random.randint(40, 300)
        available_units = int(total_units * random.uniform(0.4, 0.9))
        
        launch_date = datetime.now().date() - timedelta(days=random.randint(0, 730))
        completion_date = launch_date + timedelta(days=random.randint(365, 1095))
        
        images = [
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        ]
        
        amenities_pool = [
            'Swimming Pool', 'Gym', 'Clubhouse', 'Kids Play Area', 'Parking',
            'Security', 'Power Backup', 'Landscaped Gardens', 'Jogging Track',
            'Indoor Games', 'Tennis Court', 'Basketball Court', 'Yoga Room',
            'Party Hall', 'Amphitheater', 'Library', 'Spa', 'Sauna', 'Squash Court'
        ]
        
        # ensure unique slug
        base_slug = slugify(name)[:250]
        slug = base_slug
        suffix = 1
        while Project.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{suffix}"
            suffix += 1

        project = Project.objects.create(
            developer=developer,
            name=name,
            slug=slug,
            description=f"Experience luxury living at {name}, a premium residential project in {city}. "
                       f"Featuring modern architecture, world-class amenities, and excellent connectivity.",
            project_type='residential',
            status=status,
            address=f"Plot No. {random.randint(1, 99)}, Sector {random.randint(1, 50)}, {city}",
            city=city,
            state=state,
            pincode=f"{random.randint(400001, 500099)}",
            latitude=Decimal(str(lat)),
            longitude=Decimal(str(lon)),
            starting_price=starting_price,
            total_units=total_units,
            available_units=available_units,
            cover_image=random.choice(images),
            gallery_images=random.sample(images, k=random.randint(3, 5)),
            launch_date=launch_date,
            expected_completion=completion_date,
            total_floors=random.randint(5, 30),
            total_area_sqft=Decimal(total_units * random.randint(800, 1500)),
            amenities=random.sample(amenities_pool, k=random.randint(6, 12)),
            verified=random.choice([True, False]),
            verification_score=Decimal(str(round(random.uniform(50, 99), 2))),
            views_count=random.randint(0, 500)
        )
        
        return project

    def create_properties(self, project, num_wings):
        """Create properties for a project"""
        property_types = ['1bhk', '2bhk', '3bhk', '4bhk', 'penthouse']
        type_configs = {
            '1bhk': (500, 700, 1, 1),
            '2bhk': (800, 1100, 2, 2),
            '3bhk': (1100, 1500, 3, 3),
            '4bhk': (1400, 2000, 4, 4),
            'penthouse': (2000, 3500, 4, 5),
        }
        
        wing_names = ['A', 'B', 'C', 'D', 'E']
        properties = []
        
        units_per_wing = project.total_units // num_wings
        unit_counter = 1
        
        for wing_idx in range(num_wings):
            wing_name = wing_names[wing_idx] if num_wings > 1 else None
            
            for _ in range(units_per_wing):
                prop_type = random.choice(property_types)
                min_area, max_area, bedrooms, bathrooms = type_configs[prop_type]
                
                carpet_area = random.randint(min_area, max_area)
                price_variation = random.uniform(0.9, 1.3)
                price = float(project.starting_price) * price_variation
                
                properties.append(Property(
                    project=project,
                    unit_number=f"{wing_name}{unit_counter:02d}" if wing_name else f"{unit_counter:03d}",
                    property_type=prop_type,
                    floor_number=random.randint(1, project.total_floors),
                    tower=wing_name,
                    carpet_area=Decimal(carpet_area),
                    bedrooms=bedrooms,
                    bathrooms=bathrooms,
                    balconies=random.randint(1, 2),
                    price=Decimal(str(price)),
                    status=random.choice(['available', 'available', 'available', 'booked', 'sold']),
                    features=['Modular Kitchen', 'Wooden Flooring', 'Spacious Balcony']
                ))
                unit_counter += 1
                
                if unit_counter > project.total_units:
                    break
        
        Property.objects.bulk_create(properties, batch_size=100)

    def create_milestones(self, project):
        """Create construction milestones"""
        milestones_data = [
            ('Foundation', 'Foundation and basement work completed'),
            ('Structure', 'RCC framework and structure completed'),
            ('Walls', 'Brick work and plastering completed'),
            ('Plumbing', 'Internal plumbing and electrical work'),
            ('Flooring', 'Flooring and tiling work in progress'),
            ('Finishing', 'Painting and finishing work'),
        ]
        
        milestones = []
        start_date = project.launch_date
        
        num_milestones = 4 if project.status == 'ongoing' else 6

        for i in range(num_milestones):
            name, desc = milestones_data[i]
            target = start_date + timedelta(days=90 * (i + 1)) if start_date else None
            completion = target if project.status == 'completed' else None
            progress = Decimal(str(random.randint(60, 100))) if project.status in ['ongoing', 'completed'] else Decimal('0')

            milestones.append(ConstructionMilestone(
                project=project,
                title=name,
                description=desc,
                phase_number=i + 1,
                target_date=target or project.launch_date or datetime.now().date(),
                start_date=project.launch_date,
                completion_date=completion,
                status='completed' if project.status == 'completed' else 'in_progress',
                progress_percentage=progress,
                verified=True if project.verified else False,
                images=[
                    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
                    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
                ],
                notes='Auto-seeded milestone.'
            ))
        
        ConstructionMilestone.objects.bulk_create(milestones)
