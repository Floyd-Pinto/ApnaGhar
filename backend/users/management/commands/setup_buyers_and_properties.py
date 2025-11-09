from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import Project
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Delete all buyer accounts and create 25-30 new buyers with some property assignments'

    def handle(self, *args, **kwargs):
        # Delete all existing buyer accounts
        self.stdout.write(self.style.WARNING('Deleting all existing buyer accounts...'))
        deleted_count = User.objects.filter(role='buyer').delete()[0]
        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted_count} buyer accounts'))

        # Create 30 buyer accounts
        self.stdout.write(self.style.WARNING('Creating 30 new buyer accounts...'))
        
        buyers = []
        buyer_data = [
            {'first_name': 'Rahul', 'last_name': 'Sharma', 'email': 'rahul.sharma@example.com'},
            {'first_name': 'Priya', 'last_name': 'Patel', 'email': 'priya.patel@example.com'},
            {'first_name': 'Amit', 'last_name': 'Kumar', 'email': 'amit.kumar@example.com'},
            {'first_name': 'Sneha', 'last_name': 'Desai', 'email': 'sneha.desai@example.com'},
            {'first_name': 'Vikram', 'last_name': 'Singh', 'email': 'vikram.singh@example.com'},
            {'first_name': 'Ananya', 'last_name': 'Reddy', 'email': 'ananya.reddy@example.com'},
            {'first_name': 'Rajesh', 'last_name': 'Verma', 'email': 'rajesh.verma@example.com'},
            {'first_name': 'Kavya', 'last_name': 'Nair', 'email': 'kavya.nair@example.com'},
            {'first_name': 'Arjun', 'last_name': 'Mehta', 'email': 'arjun.mehta@example.com'},
            {'first_name': 'Ishita', 'last_name': 'Gupta', 'email': 'ishita.gupta@example.com'},
            {'first_name': 'Karan', 'last_name': 'Joshi', 'email': 'karan.joshi@example.com'},
            {'first_name': 'Divya', 'last_name': 'Iyer', 'email': 'divya.iyer@example.com'},
            {'first_name': 'Sanjay', 'last_name': 'Pandey', 'email': 'sanjay.pandey@example.com'},
            {'first_name': 'Neha', 'last_name': 'Kapoor', 'email': 'neha.kapoor@example.com'},
            {'first_name': 'Rohan', 'last_name': 'Malhotra', 'email': 'rohan.malhotra@example.com'},
            {'first_name': 'Pooja', 'last_name': 'Shah', 'email': 'pooja.shah@example.com'},
            {'first_name': 'Aditya', 'last_name': 'Rao', 'email': 'aditya.rao@example.com'},
            {'first_name': 'Ritu', 'last_name': 'Agarwal', 'email': 'ritu.agarwal@example.com'},
            {'first_name': 'Manish', 'last_name': 'Sinha', 'email': 'manish.sinha@example.com'},
            {'first_name': 'Simran', 'last_name': 'Chawla', 'email': 'simran.chawla@example.com'},
            {'first_name': 'Kunal', 'last_name': 'Banerjee', 'email': 'kunal.banerjee@example.com'},
            {'first_name': 'Aarti', 'last_name': 'Mishra', 'email': 'aarti.mishra@example.com'},
            {'first_name': 'Varun', 'last_name': 'Thakur', 'email': 'varun.thakur@example.com'},
            {'first_name': 'Shruti', 'last_name': 'Bose', 'email': 'shruti.bose@example.com'},
            {'first_name': 'Nikhil', 'last_name': 'Saxena', 'email': 'nikhil.saxena@example.com'},
            {'first_name': 'Anjali', 'last_name': 'Pillai', 'email': 'anjali.pillai@example.com'},
            {'first_name': 'Deepak', 'last_name': 'Jain', 'email': 'deepak.jain@example.com'},
            {'first_name': 'Megha', 'last_name': 'Kulkarni', 'email': 'megha.kulkarni@example.com'},
            {'first_name': 'Vishal', 'last_name': 'Chopra', 'email': 'vishal.chopra@example.com'},
            {'first_name': 'Tanya', 'last_name': 'Khanna', 'email': 'tanya.khanna@example.com'},
        ]

        for i, data in enumerate(buyer_data, 1):
            username = f"buyer{i}"
            buyer = User.objects.create_user(
                username=username,
                email=data['email'],
                password='buyer123',  # Default password for all buyers
                first_name=data['first_name'],
                last_name=data['last_name'],
                role='buyer',
                phone=f'+91-98765{43210 + i}',
                is_active=True
            )
            buyers.append(buyer)
            self.stdout.write(self.style.SUCCESS(f'Created buyer: {username} ({data["first_name"]} {data["last_name"]})'))

        self.stdout.write(self.style.SUCCESS(f'\nTotal buyers created: {len(buyers)}'))

        # Get all available projects
        projects = list(Project.objects.all())
        if not projects:
            self.stdout.write(self.style.ERROR('No projects found in database. Please create projects first.'))
            return

        self.stdout.write(self.style.WARNING(f'\nFound {len(projects)} projects in database'))

        # Assign properties to some buyers (about 40-50% of buyers)
        num_buyers_with_properties = random.randint(12, 15)
        buyers_to_assign = random.sample(buyers, num_buyers_with_properties)

        self.stdout.write(self.style.WARNING(f'\nAssigning properties to {num_buyers_with_properties} buyers...'))

        assigned_count = 0
        for buyer in buyers_to_assign:
            # Each buyer can own 1-3 properties
            num_properties = random.randint(1, 3)
            selected_projects = random.sample(projects, min(num_properties, len(projects)))
            
            # Initialize saved_projects if it's empty
            if not buyer.saved_projects:
                buyer.saved_projects = []
            
            for project in selected_projects:
                # Add project ID to saved_projects (as property owned)
                project_id_str = str(project.id)
                if project_id_str not in buyer.saved_projects:
                    buyer.saved_projects.append(project_id_str)
                    assigned_count += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'  ✓ Assigned {project.name} to {buyer.first_name} {buyer.last_name}'
                    ))
            
            buyer.save()

        self.stdout.write(self.style.SUCCESS(f'\n✅ Setup complete!'))
        self.stdout.write(self.style.SUCCESS(f'   - Total buyers: {len(buyers)}'))
        self.stdout.write(self.style.SUCCESS(f'   - Buyers with properties: {num_buyers_with_properties}'))
        self.stdout.write(self.style.SUCCESS(f'   - Total property assignments: {assigned_count}'))
        self.stdout.write(self.style.WARNING(f'\n📝 Default password for all buyers: buyer123'))
        self.stdout.write(self.style.WARNING(f'   Login format: buyer1, buyer2, ... buyer30'))
