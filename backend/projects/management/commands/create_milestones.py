"""
Management command to create construction milestones for all projects
"""
from django.core.management.base import BaseCommand
from projects.models import Project, ConstructionMilestone
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create construction milestones for all projects that dont have them'

    def handle(self, *args, **options):
        projects = Project.objects.all()
        total = projects.count()
        
        self.stdout.write(f'Creating milestones for {total} projects...')
        
        # Standard milestone templates based on project status
        milestone_templates = {
            'completed': [
                {'title': 'Foundation & Excavation', 'phase': 1, 'status': 'completed', 'progress': 100, 'days_from_start': 0},
                {'title': 'Structural Framework', 'phase': 2, 'status': 'completed', 'progress': 100, 'days_from_start': 90},
                {'title': 'Plumbing & Electrical', 'phase': 3, 'status': 'completed', 'progress': 100, 'days_from_start': 180},
                {'title': 'Interior Finishing', 'phase': 4, 'status': 'completed', 'progress': 100, 'days_from_start': 270},
                {'title': 'Handover & Possession', 'phase': 5, 'status': 'completed', 'progress': 100, 'days_from_start': 360},
            ],
            'ongoing': [
                {'title': 'Foundation & Excavation', 'phase': 1, 'status': 'completed', 'progress': 100, 'days_from_start': 0},
                {'title': 'Structural Framework', 'phase': 2, 'status': 'completed', 'progress': 100, 'days_from_start': 90},
                {'title': 'Plumbing & Electrical', 'phase': 3, 'status': 'in_progress', 'progress': 65, 'days_from_start': 180},
                {'title': 'Interior Finishing', 'phase': 4, 'status': 'pending', 'progress': 0, 'days_from_start': 270},
                {'title': 'Handover & Possession', 'phase': 5, 'status': 'pending', 'progress': 0, 'days_from_start': 360},
            ],
            'upcoming': [
                {'title': 'Foundation & Excavation', 'phase': 1, 'status': 'pending', 'progress': 0, 'days_from_start': 0},
                {'title': 'Structural Framework', 'phase': 2, 'status': 'pending', 'progress': 0, 'days_from_start': 90},
                {'title': 'Plumbing & Electrical', 'phase': 3, 'status': 'pending', 'progress': 0, 'days_from_start': 180},
                {'title': 'Interior Finishing', 'phase': 4, 'status': 'pending', 'progress': 0, 'days_from_start': 270},
                {'title': 'Handover & Possession', 'phase': 5, 'status': 'pending', 'progress': 0, 'days_from_start': 360},
            ],
        }
        
        milestone_descriptions = {
            'Foundation & Excavation': 'Site preparation, excavation work, foundation laying, and plinth beam construction.',
            'Structural Framework': 'Column, beam, and slab construction. Completion of structural framework for all floors.',
            'Plumbing & Electrical': 'Internal and external plumbing, electrical wiring, HVAC installation, and utility connections.',
            'Interior Finishing': 'Flooring, wall finishes, painting, fixture installation, and final touches.',
            'Handover & Possession': 'Final inspections, quality checks, documentation, and handover to buyers.',
        }
        
        created_count = 0
        skipped_count = 0
        
        for project in projects:
            # Skip if project already has milestones
            if project.milestones.exists():
                skipped_count += 1
                continue
            
            # Get appropriate template based on project status
            status = project.status or 'upcoming'
            templates = milestone_templates.get(status, milestone_templates['upcoming'])
            
            # Determine dates
            start_date = project.launch_date or timezone.now().date()
            
            # Create milestones
            for template in templates:
                target_date = start_date + timedelta(days=template['days_from_start'])
                
                # Set start_date and completion_date based on status
                milestone_start = None
                milestone_completion = None
                
                if template['status'] == 'completed':
                    milestone_start = start_date + timedelta(days=template['days_from_start'])
                    milestone_completion = milestone_start + timedelta(days=30)
                elif template['status'] == 'in_progress':
                    milestone_start = start_date + timedelta(days=template['days_from_start'])
                
                ConstructionMilestone.objects.create(
                    project=project,
                    title=template['title'],
                    description=milestone_descriptions[template['title']],
                    phase_number=template['phase'],
                    target_date=target_date,
                    start_date=milestone_start,
                    completion_date=milestone_completion,
                    status=template['status'],
                    progress_percentage=Decimal(str(template['progress'])),
                    verified=template['status'] == 'completed',
                    notes=f"Phase {template['phase']} of construction"
                )
            
            created_count += 1
            
            if created_count % 10 == 0:
                self.stdout.write(f'  Created milestones for {created_count} projects...')
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully created milestones for {created_count} projects!'))
        self.stdout.write(self.style.WARNING(f'⊘ Skipped {skipped_count} projects (already have milestones)'))
        
        # Show summary
        total_milestones = ConstructionMilestone.objects.count()
        completed_milestones = ConstructionMilestone.objects.filter(status='completed').count()
        in_progress_milestones = ConstructionMilestone.objects.filter(status='in_progress').count()
        pending_milestones = ConstructionMilestone.objects.filter(status='pending').count()
        
        self.stdout.write(self.style.WARNING('\nMilestone Summary:'))
        self.stdout.write(f'  Total Milestones: {total_milestones}')
        self.stdout.write(f'  Completed: {completed_milestones}')
        self.stdout.write(f'  In Progress: {in_progress_milestones}')
        self.stdout.write(f'  Pending: {pending_milestones}')
