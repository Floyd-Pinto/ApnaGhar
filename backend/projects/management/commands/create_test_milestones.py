from django.core.management.base import BaseCommand
from projects.models import Project, ConstructionMilestone
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Create test milestones for a project'

    def add_arguments(self, parser):
        parser.add_argument('project_id', type=str, help='Project UUID')

    def handle(self, *args, **options):
        project_id = options['project_id']
        
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Project with ID {project_id} not found'))
            return

        # Delete existing milestones for this project
        ConstructionMilestone.objects.filter(project=project).delete()

        # Create sample milestones
        milestones_data = [
            {
                'phase_number': 1,
                'title': 'Site Preparation & Foundation',
                'description': 'Land clearing, excavation, and foundation work',
                'status': 'completed',
                'progress_percentage': 100.0,
                'target_date': datetime.now().date() - timedelta(days=90),
                'start_date': datetime.now().date() - timedelta(days=120),
                'completion_date': datetime.now().date() - timedelta(days=85),
            },
            {
                'phase_number': 2,
                'title': 'Structural Framework',
                'description': 'Column and beam construction, floor slabs',
                'status': 'in_progress',
                'progress_percentage': 65.0,
                'target_date': datetime.now().date() + timedelta(days=30),
                'start_date': datetime.now().date() - timedelta(days=30),
            },
            {
                'phase_number': 3,
                'title': 'Walls & Partitions',
                'description': 'Brick work, interior walls, and partitions',
                'status': 'in_progress',
                'progress_percentage': 40.0,
                'target_date': datetime.now().date() + timedelta(days=60),
                'start_date': datetime.now().date() - timedelta(days=10),
            },
            {
                'phase_number': 4,
                'title': 'Plumbing & Electrical',
                'description': 'Installation of plumbing and electrical systems',
                'status': 'pending',
                'progress_percentage': 15.0,
                'target_date': datetime.now().date() + timedelta(days=90),
            },
            {
                'phase_number': 5,
                'title': 'Finishing Work',
                'description': 'Flooring, painting, fixtures installation',
                'status': 'pending',
                'progress_percentage': 0.0,
                'target_date': datetime.now().date() + timedelta(days=120),
            },
        ]

        created_count = 0
        for milestone_data in milestones_data:
            milestone = ConstructionMilestone.objects.create(
                project=project,
                **milestone_data
            )
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created milestone: Phase {milestone.phase_number} - {milestone.title}'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} milestones for project: {project.name}'
            )
        )
