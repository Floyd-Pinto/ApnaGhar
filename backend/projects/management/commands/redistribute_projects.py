"""
Management command to redistribute all projects to the 10 existing builder accounts
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import Developer, Project
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Redistribute all projects to the 10 builder accounts'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Get the 10 builder accounts
            builder_usernames = [
                'prestige.builder', 'godrej.builder', 'brigade.builder', 'sobha.builder',
                'puravankara.builder', 'embassy.builder', 'mantri.builder', 'shriram.builder',
                'mahindra.builder', 'lnt.builder'
            ]
            
            builders = []
            for username in builder_usernames:
                try:
                    user = User.objects.get(username=username)
                    developer = Developer.objects.get(user=user)
                    builders.append(developer)
                except (User.DoesNotExist, Developer.DoesNotExist):
                    self.stdout.write(self.style.ERROR(f'Builder {username} not found!'))
                    return
            
            self.stdout.write(self.style.SUCCESS(f'Found {len(builders)} builders'))
            
            # Get all projects (regardless of current developer)
            all_projects = Project.objects.all()
            total_projects = all_projects.count()
            self.stdout.write(self.style.WARNING(f'Found {total_projects} projects to reassign'))
            
            # Delete old auto-generated developers (but keep our 10 builders) - will happen after reassignment
            builder_ids = [b.id for b in builders]
            
            if total_projects == 0:
                self.stdout.write(self.style.ERROR('No projects to distribute!'))
                return
            
            # Distribute projects evenly
            projects_per_builder = total_projects // len(builders)
            remainder = total_projects % len(builders)
            
            project_index = 0
            projects_list = list(all_projects)
            
            self.stdout.write(self.style.WARNING('Distributing projects...'))
            
            for i, builder in enumerate(builders):
                num_projects = projects_per_builder + (1 if i < remainder else 0)
                
                builder_project_ids = [
                    p.id for p in projects_list[project_index:project_index + num_projects]
                ]
                
                Project.objects.filter(id__in=builder_project_ids).update(developer=builder)
                
                builder.total_projects = num_projects
                builder.completed_projects = Project.objects.filter(
                    developer=builder, 
                    status='completed'
                ).count()
                builder.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✓ {builder.company_name}: {num_projects} projects assigned'
                    )
                )
                
                project_index += num_projects
            
            # Now delete old developers (projects are already reassigned, so no cascade)
            old_devs = Developer.objects.exclude(id__in=builder_ids)
            old_count = old_devs.count()
            old_devs.delete()
            self.stdout.write(self.style.SUCCESS(f'\n✓ Deleted {old_count} auto-generated developers'))
            
            self.stdout.write(self.style.SUCCESS(f'✓ Successfully distributed {total_projects} projects among {len(builders)} builders!'))
