from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F
from projects.models import Project


class Command(BaseCommand):
    help = (
        "Keep up to N projects per city and delete the rest. "
        "Defaults to 10 per city for the five seeded cities."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--per-city',
            type=int,
            default=10,
            help='Number of projects to keep per city (default: 10)'
        )
        parser.add_argument(
            '--cities',
            type=str,
            default='Mumbai,Pune,Bangalore,Delhi,Hyderabad',
            help='Comma-separated list of cities to prune (default: the five seeded cities)'
        )
        parser.add_argument(
            '--order',
            type=str,
            choices=['newest', 'oldest', 'views', 'random'],
            default='newest',
            help='Which projects to KEEP when selecting top N: newest|oldest|views|random (default: newest)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without performing deletions'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Actually perform deletions (required to delete)'
        )

    def handle(self, *args, **options):
        per_city = options['per_city']
        cities = [c.strip() for c in options['cities'].split(',') if c.strip()]
        order = options['order']
        dry_run = options['dry_run']
        force = options['force']

        self.stdout.write(self.style.WARNING('Prune command starting'))
        self.stdout.write(f'Keeping up to {per_city} projects per city for: {cities}')
        self.stdout.write(f'Selection order: {order}')

        keep_ids = set()

        for city in cities:
            qs = Project.objects.filter(city__iexact=city)
            if order == 'newest':
                qs = qs.order_by('-created_at')
            elif order == 'oldest':
                qs = qs.order_by('created_at')
            elif order == 'views':
                qs = qs.order_by('-views_count')
            else:
                qs = qs.order_by('?')

            top = list(qs.values_list('id', flat=True)[:per_city])
            self.stdout.write(f'  {city}: found {qs.count()} projects, keeping {len(top)}')
            keep_ids.update(top)

        # All project ids to keep
        keep_ids = set(keep_ids)

        to_delete_qs = Project.objects.exclude(id__in=keep_ids).filter(city__in=cities)
        total_to_delete = to_delete_qs.count()
        total_projects = Project.objects.count()

        self.stdout.write('')
        self.stdout.write(self.style.NOTICE(f'Total projects in DB: {total_projects}'))
        self.stdout.write(self.style.NOTICE(f'Projects to delete (in selected cities): {total_to_delete}'))

        sample = list(to_delete_qs.values('id', 'name', 'slug', 'city')[:20])
        if sample:
            self.stdout.write('Sample projects that would be deleted (up to 20):')
            for s in sample:
                self.stdout.write(f"  - {s['name']} ({s['city']}) slug={s['slug']} id={s['id']}")

        if dry_run or not force:
            self.stdout.write('')
            if dry_run:
                self.stdout.write(self.style.SUCCESS('Dry-run complete. No changes made.'))
            else:
                self.stdout.write(self.style.WARNING('No --force provided. To actually delete run again with --force'))
            return

        # Confirm again
        confirm = input('Type YES to confirm permanent deletion: ') if force else 'no'
        if confirm != 'YES':
            self.stdout.write(self.style.ERROR('Aborted by user.'))
            return

        # Perform deletion inside an atomic transaction
        with transaction.atomic():
            deleted_count, _ = to_delete_qs.delete()

        self.stdout.write(self.style.SUCCESS(f'Deletion complete. {deleted_count} objects deleted (includes cascaded related rows).'))
        remaining = Project.objects.count()
        self.stdout.write(self.style.NOTICE(f'Projects remaining in DB: {remaining}'))

        self.stdout.write(self.style.WARNING('Done. Remember to verify related tables (properties, milestones, reviews).'))
