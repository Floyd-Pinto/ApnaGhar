from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site


class Command(BaseCommand):
    help = 'Setup Site object for django.contrib.sites'

    def handle(self, *args, **options):
        site, created = Site.objects.get_or_create(
            id=1,
            defaults={
                'domain': 'apnaghar-2emb.onrender.com',
                'name': 'ApnaGhar'
            }
        )
        
        if not created:
            # Update existing site
            site.domain = 'apnaghar-2emb.onrender.com'
            site.name = 'ApnaGhar'
            site.save()
            self.stdout.write(
                self.style.SUCCESS(f'Updated Site: {site.domain}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Created Site: {site.domain}')
            )
