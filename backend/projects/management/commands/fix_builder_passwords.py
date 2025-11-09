"""
Fix builder passwords
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Reset passwords for all builder accounts'

    def handle(self, *args, **options):
        builder_credentials = [
            ('prestige.builder', 'Prestige@123'),
            ('godrej.builder', 'Godrej@123'),
            ('brigade.builder', 'Brigade@123'),
            ('sobha.builder', 'Sobha@123'),
            ('puravankara.builder', 'Puravankara@123'),
            ('embassy.builder', 'Embassy@123'),
            ('mantri.builder', 'Mantri@123'),
            ('shriram.builder', 'Shriram@123'),
            ('mahindra.builder', 'Mahindra@123'),
            ('lnt.builder', 'LnT@123'),
        ]
        
        self.stdout.write(self.style.WARNING('Resetting builder passwords...'))
        
        for username, password in builder_credentials:
            try:
                user = User.objects.get(username=username)
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'✓ Reset password for {username}'))
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'✗ User {username} not found'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ All builder passwords reset!'))
        self.stdout.write(self.style.WARNING('You can now login with the credentials from before.'))
