from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from .models import SupportTicket, SupportMessage, SupportCategory
from .serializers import (
    SupportTicketSerializer, SupportTicketCreateSerializer,
    SupportMessageSerializer, SupportMessageCreateSerializer,
    SupportCategorySerializer
)
from notifications.notification_service import NotificationService
import logging

logger = logging.getLogger(__name__)


class SupportTicketViewSet(viewsets.ModelViewSet):
    """ViewSet for Support Ticket management"""
    queryset = SupportTicket.objects.select_related(
        'user', 'assigned_to', 'resolved_by', 'closed_by'
    ).prefetch_related('messages')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'priority', 'category', 'assigned_to']
    
    def get_serializer_class(self):
        """Use different serializers for create vs other actions"""
        if self.action == 'create':
            return SupportTicketCreateSerializer
        return SupportTicketSerializer
    
    def get_queryset(self):
        """Filter tickets based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Regular users can only see their own tickets
        # Staff/admins can see all tickets
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        # Filter by query parameters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        category_filter = self.request.query_params.get('category')
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set user and handle ticket creation"""
        ticket = serializer.save(user=self.request.user)
        
        # Send notification to user
        try:
            NotificationService.create_notification(
                user=self.request.user,
                notification_type='system',
                title='Support Ticket Created',
                message=f'Your support ticket #{ticket.ticket_number} has been created successfully. We will get back to you soon.',
                channel='in_app',
                related_object_type='support_ticket',
                related_object_id=str(ticket.id),
                data={'ticket_number': ticket.ticket_number, 'subject': ticket.subject},
                action_url=f'/support/{ticket.id}',
                action_text='View Ticket',
            )
        except Exception as e:
            logger.error(f"Error sending notification for ticket creation: {str(e)}")
        
        # TODO: Auto-assign to staff if enabled
        # TODO: Send email to support team
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign ticket to a staff member (staff only)"""
        if not request.user.is_staff:
            raise PermissionDenied("Only staff members can assign tickets")
        
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to_id')
        
        if not assigned_to_id:
            return Response(
                {'error': 'assigned_to_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assigned_to = request.user.__class__.objects.get(id=assigned_to_id, is_staff=True)
            ticket.assigned_to = assigned_to
            ticket.status = 'in_progress'
            ticket.save()
            
            serializer = self.get_serializer(ticket)
            return Response(serializer.data)
        except request.user.__class__.DoesNotExist:
            return Response(
                {'error': 'Staff member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update ticket status"""
        ticket = self.get_object()
        
        # Check permissions
        if not request.user.is_staff and request.user != ticket.user:
            raise PermissionDenied("You can only update your own tickets")
        
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(SupportTicket.STATUS):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = ticket.status
        ticket.status = new_status
        
        # Handle status-specific actions
        if new_status == 'resolved' and not ticket.resolution:
            ticket.resolution = request.data.get('resolution', '')
            ticket.resolved_by = request.user if request.user.is_staff else None
        
        if new_status == 'closed':
            ticket.closed_by = request.user
        
        ticket.save()
        
        # Send notification to user if status changed by staff
        if request.user.is_staff and old_status != new_status:
            try:
                NotificationService.create_notification(
                    user=ticket.user,
                    notification_type='system',
                    title=f'Ticket #{ticket.ticket_number} Updated',
                    message=f'Your support ticket status has been updated to {new_status.replace("_", " ")}.',
                    channel='in_app',
                    related_object_type='support_ticket',
                    related_object_id=str(ticket.id),
                    data={'ticket_number': ticket.ticket_number, 'status': new_status},
                    action_url=f'/support/{ticket.id}',
                    action_text='View Ticket',
                )
            except Exception as e:
                logger.error(f"Error sending notification for ticket update: {str(e)}")
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        """Get current user's tickets"""
        tickets = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get ticket statistics (staff only)"""
        if not request.user.is_staff:
            raise PermissionDenied("Only staff members can view statistics")
        
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'open': queryset.filter(status='open').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'waiting_for_user': queryset.filter(status='waiting_for_user').count(),
            'resolved': queryset.filter(status='resolved').count(),
            'closed': queryset.filter(status='closed').count(),
            'high_priority': queryset.filter(priority__in=['high', 'urgent']).count(),
            'assigned_to_me': queryset.filter(assigned_to=request.user).count(),
        }
        
        return Response(stats)


class SupportMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for Support Message management"""
    queryset = SupportMessage.objects.select_related('ticket', 'user')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ticket', 'message_type', 'is_internal']
    
    def get_serializer_class(self):
        """Use different serializers for create vs other actions"""
        if self.action == 'create':
            return SupportMessageCreateSerializer
        return SupportMessageSerializer
    
    def get_queryset(self):
        """Filter messages based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Regular users can only see messages for their tickets (excluding internal)
        # Staff can see all messages
        if not user.is_staff:
            queryset = queryset.filter(
                Q(ticket__user=user) & Q(is_internal=False)
            )
        
        # Filter by ticket if provided
        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            queryset = queryset.filter(ticket_id=ticket_id)
        
        return queryset.order_by('created_at')
    
    def perform_create(self, serializer):
        """Handle message creation"""
        ticket = serializer.validated_data['ticket']
        
        # Check permissions
        if not self.request.user.is_staff and ticket.user != self.request.user:
            raise PermissionDenied("You can only add messages to your own tickets")
        
        message = serializer.save()
        
        # Update ticket status if needed
        if message.message_type == 'staff' and not message.is_internal:
            if ticket.status == 'open':
                ticket.status = 'in_progress'
                ticket.save(update_fields=['status'])
            
            # Send notification to user
            try:
                NotificationService.create_notification(
                    user=ticket.user,
                    notification_type='system',
                    title=f'New Reply to Ticket #{ticket.ticket_number}',
                    message=f'You have received a new reply on your support ticket: {ticket.subject}',
                    channel='email',
                    related_object_type='support_ticket',
                    related_object_id=str(ticket.id),
                    data={'ticket_number': ticket.ticket_number},
                    action_url=f'/support/{ticket.id}',
                    action_text='View Reply',
                )
            except Exception as e:
                logger.error(f"Error sending notification for message: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark message as read"""
        message = self.get_object()
        
        # Check permissions
        if not request.user.is_staff and message.ticket.user != request.user:
            raise PermissionDenied("You can only mark your own messages as read")
        
        # Only ticket owner can mark staff messages as read
        if message.message_type == 'staff' and message.ticket.user == request.user:
            message.read_by_user = True
            message.read_at = timezone.now()
            message.save(update_fields=['read_by_user', 'read_at'])
        
        serializer = self.get_serializer(message)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_ticket_messages_read(self, request):
        """Mark all messages in a ticket as read"""
        ticket_id = request.data.get('ticket_id')
        if not ticket_id:
            return Response(
                {'error': 'ticket_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ticket = SupportTicket.objects.get(id=ticket_id)
            
            # Check permissions
            if not request.user.is_staff and ticket.user != request.user:
                raise PermissionDenied("You can only mark messages for your own tickets")
            
            count = SupportMessage.objects.filter(
                ticket=ticket,
                message_type='staff',
                is_internal=False,
                read_by_user=False
            ).update(
                read_by_user=True,
                read_at=timezone.now()
            )
            
            return Response({'message': f'{count} messages marked as read'})
        except SupportTicket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class SupportCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Support Category (read-only for users)"""
    queryset = SupportCategory.objects.filter(is_active=True)
    serializer_class = SupportCategorySerializer
    permission_classes = [IsAuthenticated]
