from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount

User = get_user_model()


class Command(BaseCommand):
    help = 'Fix OAuth users to have unusable passwords'

    def handle(self, *args, **options):
        # Find all users with social accounts (OAuth users)
        social_accounts = SocialAccount.objects.all()
        
        fixed_count = 0
        for social_account in social_accounts:
            user = social_account.user
            
            # Only fix users who currently have usable passwords
            if user.has_usable_password():
                user.set_unusable_password()
                user.save()
                fixed_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Fixed OAuth user: {user.email} (provider: {social_account.provider})'
                    )
                )
        
        if fixed_count == 0:
            self.stdout.write(self.style.SUCCESS('No OAuth users needed fixing.'))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nSuccessfully fixed {fixed_count} OAuth user(s).'
                )
            )
