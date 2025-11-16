from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import InvestmentProperty, Investment, InvestmentTransaction, Dividend, DividendPayment
from .serializers import (
    InvestmentPropertySerializer,
    InvestmentSerializer, InvestmentCreateSerializer,
    InvestmentTransactionSerializer,
    DividendSerializer,
    DividendPaymentSerializer,
)
from .investment_service import InvestmentService
from payments.models import Payment
import logging

logger = logging.getLogger(__name__)


class InvestmentPropertyViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Investment Property (read-only for users, full CRUD for staff)"""
    queryset = InvestmentProperty.objects.select_related('property__project')
    serializer_class = InvestmentPropertySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    
    def get_queryset(self):
        """Filter properties based on status"""
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status', 'active')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-created_at')


class InvestmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Investment management"""
    queryset = Investment.objects.select_related('investment_property__property__project', 'user')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'investment_property']
    
    def get_serializer_class(self):
        """Use different serializers for create vs other actions"""
        if self.action == 'create':
            return InvestmentCreateSerializer
        return InvestmentSerializer
    
    def get_queryset(self):
        """Filter investments based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Regular users can only see their own investments
        # Staff can see all investments
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create investment and transaction"""
        investment = serializer.save(user=self.request.user)
        
        # Create transaction
        transaction = InvestmentService.create_investment_transaction(
            investment_property=investment.investment_property,
            user=self.request.user,
            tokens=investment.tokens,
            transaction_type='buy'
        )
        
        # Link transaction to investment
        investment.transactions.add(transaction)
        
        return investment
    
    @action(detail=False, methods=['get'])
    def my_investments(self, request):
        """Get current user's investments"""
        investments = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(investments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def portfolio(self, request):
        """Get current user's investment portfolio"""
        portfolio = InvestmentService.get_user_portfolio(request.user)
        
        # Serialize investments
        investments_serializer = InvestmentSerializer(portfolio['investments'], many=True)
        
        return Response({
            'total_investments': portfolio['total_investments'],
            'total_tokens': portfolio['total_tokens'],
            'total_invested': float(portfolio['total_invested']),
            'total_current_value': portfolio['total_current_value'],
            'total_dividends': float(portfolio['total_dividends']),
            'total_return': portfolio['total_return'],
            'investments': investments_serializer.data,
        })


class InvestmentTransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for Investment Transaction management"""
    queryset = InvestmentTransaction.objects.select_related(
        'investment_property__property__project', 'user', 'payment'
    )
    serializer_class = InvestmentTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['transaction_type', 'status', 'investment_property']
    
    def get_queryset(self):
        """Filter transactions based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Regular users can only see their own transactions
        # Staff can see all transactions
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a transaction (staff only)"""
        if not request.user.is_staff:
            raise PermissionDenied("Only staff members can complete transactions")
        
        transaction = self.get_object()
        
        try:
            completed_transaction = InvestmentService.complete_investment_transaction(transaction)
            serializer = self.get_serializer(completed_transaction)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class DividendViewSet(viewsets.ModelViewSet):
    """ViewSet for Dividend management"""
    queryset = Dividend.objects.select_related('investment_property__property__project', 'approved_by')
    serializer_class = DividendSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'investment_property']
    
    def get_queryset(self):
        """Filter dividends based on user role"""
        user = self.request.user
        
        # Regular users can only see dividends for their investments
        # Staff can see all dividends
        if not user.is_staff:
            # Get user's investment properties
            investment_properties = InvestmentProperty.objects.filter(
                investments__user=user,
                investments__status__in=['confirmed', 'active']
            ).distinct()
            return super().get_queryset().filter(investment_property__in=investment_properties)
        
        return super().get_queryset()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a dividend (staff only)"""
        if not request.user.is_staff:
            raise PermissionDenied("Only staff members can approve dividends")
        
        dividend = self.get_object()
        dividend.status = 'approved'
        dividend.approved_by = request.user
        dividend.save()
        
        serializer = self.get_serializer(dividend)
        return Response(serializer.data)


class DividendPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Dividend Payment (read-only for users)"""
    queryset = DividendPayment.objects.select_related(
        'dividend__investment_property__property__project',
        'investment', 'user', 'payment'
    )
    serializer_class = DividendPaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'dividend', 'investment']
    
    def get_queryset(self):
        """Filter dividend payments based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Regular users can only see their own dividend payments
        # Staff can see all dividend payments
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def my_dividends(self, request):
        """Get current user's dividend payments"""
        dividend_payments = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(dividend_payments, many=True)
        return Response(serializer.data)
