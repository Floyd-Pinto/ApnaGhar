"""
Management command to reset developers and create 8-10 builder accounts
with properties distributed among them.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import Developer, Project
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Delete all developers and create 8-10 builder accounts with distributed projects'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Step 1: Delete all existing developers and their associated users
            self.stdout.write(self.style.WARNING('Deleting all existing developers...'))
            
            # Get all developer users
            developer_users = User.objects.filter(role='builder')
            developer_count = developer_users.count()
            
            # Delete developer users (this will cascade to Developer model)
            developer_users.delete()
            
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {developer_count} developer accounts'))
            
            # Step 2: Get all projects
            all_projects = Project.objects.all()
            total_projects = all_projects.count()
            self.stdout.write(self.style.WARNING(f'Found {total_projects} projects to reassign'))
            
            # Step 3: Create 10 builder accounts
            builder_names = [
                ('Prestige Estates', 'prestige.builder', 'Prestige@123'),
                ('Godrej Properties', 'godrej.builder', 'Godrej@123'),
                ('Brigade Group', 'brigade.builder', 'Brigade@123'),
                ('Sobha Limited', 'sobha.builder', 'Sobha@123'),
                ('Puravankara Limited', 'puravankara.builder', 'Puravankara@123'),
                ('Embassy Group', 'embassy.builder', 'Embassy@123'),
                ('Mantri Developers', 'mantri.builder', 'Mantri@123'),
                ('Shriram Properties', 'shriram.builder', 'Shriram@123'),
                ('Mahindra Lifespaces', 'mahindra.builder', 'Mahindra@123'),
                ('L&T Realty', 'lnt.builder', 'LnT@123'),
            ]
            
            builders = []
            
            self.stdout.write(self.style.WARNING('Creating 10 builder accounts...'))
            
            for company_name, username, password in builder_names:
                # Create user account
                user = User.objects.create_user(
                    username=username,
                    email=f'{username}@apnaghar.com',
                    password=password,
                    first_name=company_name.split()[0],
                    last_name='Builder',
                    role='builder'
                )
                
                # Create developer profile
                developer = Developer.objects.create(
                    user=user,
                    company_name=company_name,
                    rera_number=f'RERA/{username.upper()}/2024/001',
                    verified=True,
                    trust_score='4.5',
                    description=f'{company_name} is a leading real estate developer known for quality construction and timely delivery.',
                    established_year=2000 + len(builders),
                    total_projects=0,  # Will be updated
                    completed_projects=0
                )
                
                builders.append(developer)
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created: {company_name} (username: {username})'))
            
            # Step 4: Distribute projects evenly among builders
            self.stdout.write(self.style.WARNING('Distributing projects among builders...'))
            
            projects_per_builder = total_projects // len(builders)
            remainder = total_projects % len(builders)
            
            project_index = 0
            projects_list = list(all_projects)  # Convert to list for slicing
            
            for i, builder in enumerate(builders):
                # Calculate how many projects this builder should get
                num_projects = projects_per_builder + (1 if i < remainder else 0)
                
                # Get project IDs for this builder
                builder_project_ids = [
                    p.id for p in projects_list[project_index:project_index + num_projects]
                ]
                
                # Assign projects to this builder
                Project.objects.filter(id__in=builder_project_ids).update(developer=builder)
                
                # Update builder's project count
                builder.total_projects = num_projects
                builder.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✓ {builder.company_name}: {num_projects} projects assigned'
                    )
                )
                
                project_index += num_projects
            
            # Step 5: Print summary
            self.stdout.write(self.style.SUCCESS('\n' + '='*60))
            self.stdout.write(self.style.SUCCESS('BUILDER ACCOUNTS CREATED'))
            self.stdout.write(self.style.SUCCESS('='*60))
            self.stdout.write(self.style.WARNING('\nLogin Credentials:'))
            self.stdout.write(self.style.WARNING('-' * 60))
            
            for company_name, username, password in builder_names:
                self.stdout.write(
                    f'  Company: {company_name}\n'
                    f'  Username: {username}\n'
                    f'  Password: {password}\n'
                    f'  Email: {username}@apnaghar.com\n'
                )
            
            self.stdout.write(self.style.SUCCESS('='*60))
            self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully created {len(builders)} builders'))
            self.stdout.write(self.style.SUCCESS(f'✓ Distributed {total_projects} projects'))
            self.stdout.write(self.style.WARNING('\nYou can now login as any builder using the credentials above!'))
