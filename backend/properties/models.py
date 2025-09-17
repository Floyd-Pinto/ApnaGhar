from django.db import models
from users.models import CustomUser
from decimal import Decimal

class Property(models.Model):
    PROPERTY_TYPE_CHOICES = [
        ('HOUSE', 'House'),
        ('APARTMENT', 'Apartment'),
        ('VILLA', 'Villa'),
        ('PLOT', 'Plot'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    price = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=Decimal('0.00')
    )
    # Making location nullable initially, can be made required later
    location = models.CharField(max_length=200, null=True, blank=True)
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Properties"

    def __str__(self):
        return f"{self.title} - {self.location or 'No location'}"
