"""
Analytics service for calculating metrics and generating reports
"""
from django.db.models import Count, Sum, Avg, Q, F, DecimalField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, TruncYear
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from projects.models import Project, Property, Booking
from payments.models import Payment
from users.models import CustomUser
from .models import AnalyticsEvent, AnalyticsMetric
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics calculations and aggregations"""
    
    @staticmethod
    def track_event(event_type, user=None, related_object_type=None, related_object_id=None, 
                    metadata=None, properties=None, session_id=None, ip_address=None, 
                    user_agent=None, country=None, region=None, city=None):
        """Track an analytics event"""
        try:
            event = AnalyticsEvent.objects.create(
                event_type=event_type,
                user=user,
                related_object_type=related_object_type,
                related_object_id=related_object_id,
                metadata=metadata or {},
                properties=properties or {},
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                country=country,
                region=region,
                city=city,
            )
            return event
        except Exception as e:
            logger.error(f"Error tracking analytics event: {str(e)}")
            return None
    
    @staticmethod
    def calculate_daily_metrics(date=None):
        """Calculate daily analytics metrics for a specific date"""
        if date is None:
            date = timezone.now().date()
        
        # Start and end of day
        start_datetime = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_datetime = start_datetime + timedelta(days=1)
        
        # User Metrics
        total_users = CustomUser.objects.count()
        new_users = CustomUser.objects.filter(created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        active_users = AnalyticsEvent.objects.filter(
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).values('user').distinct().count()
        
        # Project Metrics
        total_projects = Project.objects.count()
        new_projects = Project.objects.filter(created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        project_views = AnalyticsEvent.objects.filter(
            event_type='project_view',
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).count()
        
        # Property Metrics
        total_properties = Property.objects.count()
        available_properties = Property.objects.filter(status='available').count()
        booked_properties = Property.objects.filter(status='booked').count()
        sold_properties = Property.objects.filter(status='sold').count()
        property_views = AnalyticsEvent.objects.filter(
            event_type='property_view',
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).count()
        
        # Booking Metrics
        total_bookings = Booking.objects.count()
        new_bookings = Booking.objects.filter(created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        confirmed_bookings = Booking.objects.filter(status='confirmed', created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        cancelled_bookings = Booking.objects.filter(status='cancelled', created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        completed_bookings = Booking.objects.filter(status='completed', created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        
        # Revenue Metrics
        revenue_data = Payment.objects.filter(
            status='completed',
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).aggregate(
            total=Sum('amount', default=Decimal('0'))
        )
        payment_amount = revenue_data['total'] or Decimal('0')
        
        booking_revenue = Booking.objects.filter(
            status__in=['confirmed', 'token_paid', 'payment_in_progress', 'completed'],
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).aggregate(
            total=Sum('total_amount', default=Decimal('0'))
        )['total'] or Decimal('0')
        
        token_revenue = Booking.objects.filter(
            status__in=['token_paid', 'confirmed', 'payment_in_progress', 'completed'],
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).aggregate(
            total=Sum('token_amount', default=Decimal('0'))
        )['total'] or Decimal('0')
        
        pending_revenue = Booking.objects.filter(
            status__in=['pending', 'token_paid', 'confirmed'],
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).aggregate(
            total=Sum('amount_due', default=Decimal('0'))
        )['total'] or Decimal('0')
        
        total_revenue = booking_revenue
        
        # Payment Metrics
        total_payments = Payment.objects.filter(created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        completed_payments = Payment.objects.filter(status='completed', created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        failed_payments = Payment.objects.filter(status='failed', created_at__gte=start_datetime, created_at__lt=end_datetime).count()
        
        # Conversion Metrics
        property_views_count = property_views
        booking_conversion_rate = Decimal('0')
        if property_views_count > 0:
            booking_conversion_rate = (Decimal(str(new_bookings)) / Decimal(str(property_views_count))) * Decimal('100')
        
        booking_count = new_bookings
        payment_conversion_rate = Decimal('0')
        if booking_count > 0:
            payment_conversion_rate = (Decimal(str(completed_payments)) / Decimal(str(booking_count))) * Decimal('100')
        
        # Engagement Metrics
        page_views = AnalyticsEvent.objects.filter(
            event_type='page_view',
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).count()
        
        unique_visitors = AnalyticsEvent.objects.filter(
            created_at__gte=start_datetime,
            created_at__lt=end_datetime
        ).values('session_id').distinct().count()
        
        # Create or update metric
        metric, created = AnalyticsMetric.objects.update_or_create(
            metric_type='daily',
            date=date,
            defaults={
                'total_users': total_users,
                'new_users': new_users,
                'active_users': active_users,
                'total_projects': total_projects,
                'new_projects': new_projects,
                'project_views': project_views,
                'total_properties': total_properties,
                'available_properties': available_properties,
                'booked_properties': booked_properties,
                'sold_properties': sold_properties,
                'property_views': property_views,
                'total_bookings': total_bookings,
                'new_bookings': new_bookings,
                'confirmed_bookings': confirmed_bookings,
                'cancelled_bookings': cancelled_bookings,
                'completed_bookings': completed_bookings,
                'total_revenue': total_revenue,
                'booking_revenue': booking_revenue,
                'token_revenue': token_revenue,
                'pending_revenue': pending_revenue,
                'total_payments': total_payments,
                'completed_payments': completed_payments,
                'failed_payments': failed_payments,
                'payment_amount': payment_amount,
                'booking_conversion_rate': booking_conversion_rate,
                'payment_conversion_rate': payment_conversion_rate,
                'page_views': page_views,
                'unique_visitors': unique_visitors,
            }
        )
        
        return metric
    
    @staticmethod
    def get_dashboard_stats(user=None, date_from=None, date_to=None):
        """Get dashboard statistics"""
        if date_from is None:
            date_from = timezone.now().date() - timedelta(days=30)
        if date_to is None:
            date_to = timezone.now().date()
        
        start_datetime = timezone.make_aware(datetime.combine(date_from, datetime.min.time()))
        end_datetime = timezone.make_aware(datetime.combine(date_to, datetime.max.time())) + timedelta(days=1)
        
        # Filter by user if provided (for builder/buyer dashboards)
        user_filter = Q()
        if user:
            if user.role == 'builder':
                # Builder can see their own projects' analytics
                user_filter = Q(project__developer__user=user) | Q(booking__property__project__developer__user=user)
            elif user.role == 'buyer':
                # Buyer can see their own bookings
                user_filter = Q(booking__buyer=user)
        
        # Base queries
        bookings_query = Booking.objects.all()
        payments_query = Payment.objects.all()
        projects_query = Project.objects.all()
        properties_query = Property.objects.all()
        
        # Apply user filter if provided
        if user_filter:
            bookings_query = bookings_query.filter(user_filter)
            # For payments, filter by booking or user
            if user and user.role == 'builder':
                payments_query = payments_query.filter(booking__property__project__developer__user=user)
            elif user and user.role == 'buyer':
                payments_query = payments_query.filter(user=user)
            if user and user.role == 'builder':
                projects_query = projects_query.filter(developer__user=user)
                properties_query = properties_query.filter(project__developer__user=user)
        
        # Overall Stats
        stats = {
            'users': {
                'total': CustomUser.objects.count() if not user or user.is_staff else 1,
                'new': CustomUser.objects.filter(created_at__gte=start_datetime, created_at__lt=end_datetime).count() if not user or user.is_staff else 0,
                'active': AnalyticsEvent.objects.filter(
                    created_at__gte=start_datetime,
                    created_at__lt=end_datetime
                ).values('user').distinct().count() if not user or user.is_staff else 1,
            },
            'projects': {
                'total': projects_query.count(),
                'new': projects_query.filter(created_at__gte=start_datetime, created_at__lt=end_datetime).count(),
            },
            'properties': {
                'total': properties_query.count(),
                'available': properties_query.filter(status='available').count(),
                'booked': properties_query.filter(status='booked').count(),
                'sold': properties_query.filter(status='sold').count(),
            },
            'bookings': {
                'total': bookings_query.count(),
                'new': bookings_query.filter(created_at__gte=start_datetime, created_at__lt=end_datetime).count(),
                'confirmed': bookings_query.filter(
                    status='confirmed',
                    created_at__gte=start_datetime,
                    created_at__lt=end_datetime
                ).count(),
            },
            'revenue': {
                'total': float(bookings_query.filter(
                    status__in=['confirmed', 'token_paid', 'payment_in_progress', 'completed']
                ).aggregate(total=Sum('total_amount', default=Decimal('0')))['total'] or Decimal('0')),
                'pending': float(bookings_query.filter(
                    status__in=['pending', 'token_paid', 'confirmed']
                ).aggregate(total=Sum('amount_due', default=Decimal('0')))['total'] or Decimal('0')),
            },
            'payments': {
                'total': payments_query.filter(
                    created_at__gte=start_datetime,
                    created_at__lt=end_datetime
                ).count(),
                'completed': payments_query.filter(
                    status='completed',
                    created_at__gte=start_datetime,
                    created_at__lt=end_datetime
                ).count(),
            },
        }
        
        return stats
    
    @staticmethod
    def get_revenue_chart_data(user=None, days=30):
        """Get revenue chart data for the last N days"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        dates = []
        revenue = []
        
        current_date = start_date
        while current_date <= end_date:
            dates.append(current_date.isoformat())
            
            # Calculate revenue for this date
            start_datetime = timezone.make_aware(datetime.combine(current_date, datetime.min.time()))
            end_datetime = start_datetime + timedelta(days=1)
            
            user_filter = Q()
            if user and user.role == 'builder':
                user_filter = Q(property__project__developer__user=user)
            elif user and user.role == 'buyer':
                user_filter = Q(buyer=user)
            
            daily_revenue = Booking.objects.filter(
                user_filter,
                status__in=['confirmed', 'token_paid', 'payment_in_progress', 'completed'],
                created_at__gte=start_datetime,
                created_at__lt=end_datetime
            ).aggregate(total=Sum('total_amount', default=Decimal('0')))['total'] or Decimal('0')
            
            revenue.append(float(daily_revenue))
            
            current_date += timedelta(days=1)
        
        return {
            'dates': dates,
            'revenue': revenue,
        }
    
    @staticmethod
    def get_booking_chart_data(user=None, days=30):
        """Get booking chart data for the last N days"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        dates = []
        bookings = []
        
        current_date = start_date
        while current_date <= end_date:
            dates.append(current_date.isoformat())
            
            start_datetime = timezone.make_aware(datetime.combine(current_date, datetime.min.time()))
            end_datetime = start_datetime + timedelta(days=1)
            
            user_filter = Q()
            if user and user.role == 'builder':
                user_filter = Q(property__project__developer__user=user)
            elif user and user.role == 'buyer':
                user_filter = Q(buyer=user)
            
            daily_bookings = Booking.objects.filter(
                user_filter,
                created_at__gte=start_datetime,
                created_at__lt=end_datetime
            ).count()
            
            bookings.append(daily_bookings)
            
            current_date += timedelta(days=1)
        
        return {
            'dates': dates,
            'bookings': bookings,
        }

