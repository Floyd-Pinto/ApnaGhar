from django.db import migrations


def create_site(apps, schema_editor):
    """Create or update the Site object for django.contrib.sites"""
    Site = apps.get_model('sites', 'Site')
    
    # Check if Site with ID=1 exists
    try:
        site_1 = Site.objects.get(id=1)
        # Update it to have correct domain
        site_1.domain = 'apnaghar-2emb.onrender.com'
        site_1.name = 'ApnaGhar'
        site_1.save()
    except Site.DoesNotExist:
        # Site 1 doesn't exist, check if our domain exists with different ID
        try:
            existing_site = Site.objects.get(domain='apnaghar-2emb.onrender.com')
            # Delete the existing site and create new one with ID=1
            existing_site.delete()
            Site.objects.create(
                id=1,
                domain='apnaghar-2emb.onrender.com',
                name='ApnaGhar'
            )
        except Site.DoesNotExist:
            # No site exists, create new one with ID=1
            Site.objects.create(
                id=1,
                domain='apnaghar-2emb.onrender.com',
                name='ApnaGhar'
            )


def reverse_create_site(apps, schema_editor):
    """Reverse migration - optional, can leave site in place"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_customuser_address_customuser_avatar_customuser_bio_and_more'),
        ('sites', '0002_alter_domain_unique'),  # Ensure sites migrations are run first
    ]

    operations = [
        migrations.RunPython(create_site, reverse_create_site),
    ]
