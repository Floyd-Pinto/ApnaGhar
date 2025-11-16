import { apiRequest } from './api';

// Analytics types
export interface AnalyticsEvent {
  id: string;
  event_type: string;
  user: string | null;
  user_email: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  related_object_type: string | null;
  related_object_id: string | null;
  metadata: any;
  properties: any;
  country: string | null;
  region: string | null;
  city: string | null;
  created_at: string;
}

export interface AnalyticsMetric {
  id: string;
  metric_type: string;
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_projects: number;
  new_projects: number;
  project_views: number;
  total_properties: number;
  available_properties: number;
  booked_properties: number;
  sold_properties: number;
  property_views: number;
  total_bookings: number;
  new_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  total_revenue: number;
  booking_revenue: number;
  token_revenue: number;
  pending_revenue: number;
  total_payments: number;
  completed_payments: number;
  failed_payments: number;
  payment_amount: number;
  booking_conversion_rate: number;
  payment_conversion_rate: number;
  page_views: number;
  unique_visitors: number;
  avg_session_duration: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  users: {
    total: number;
    new: number;
    active: number;
  };
  projects: {
    total: number;
    new: number;
  };
  properties: {
    total: number;
    available: number;
    booked: number;
    sold: number;
  };
  bookings: {
    total: number;
    new: number;
    confirmed: number;
  };
  revenue: {
    total: number;
    pending: number;
  };
  payments: {
    total: number;
    completed: number;
  };
}

export interface ChartData {
  dates: string[];
  revenue?: number[];
  bookings?: number[];
}

export interface TrackEventRequest {
  event_type: string;
  related_object_type?: string;
  related_object_id?: string;
  metadata?: any;
  properties?: any;
}

// Analytics API functions
export const analyticsAPI = {
  // Track event
  trackEvent: async (data: TrackEventRequest): Promise<AnalyticsEvent> => {
    const response = await apiRequest('api/analytics/events/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Fail silently for analytics tracking
      throw new Error('Failed to track event');
    }

    return response.json();
  },

  // Dashboard
  getDashboardStats: async (params?: { date_from?: string; date_to?: string }): Promise<DashboardStats> => {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    
    const url = `api/analytics/dashboard/stats/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard statistics');
    }

    return response.json();
  },

  getRevenueChart: async (days: number = 30): Promise<ChartData> => {
    const response = await apiRequest(`api/analytics/dashboard/revenue_chart/?days=${days}`);

    if (!response.ok) {
      throw new Error('Failed to fetch revenue chart data');
    }

    return response.json();
  },

  getBookingChart: async (days: number = 30): Promise<ChartData> => {
    const response = await apiRequest(`api/analytics/dashboard/booking_chart/?days=${days}`);

    if (!response.ok) {
      throw new Error('Failed to fetch booking chart data');
    }

    return response.json();
  },

  // Metrics
  getAllMetrics: async (params?: { metric_type?: string; date?: string }): Promise<AnalyticsMetric[]> => {
    const queryParams = new URLSearchParams();
    if (params?.metric_type) queryParams.append('metric_type', params.metric_type);
    if (params?.date) queryParams.append('date', params.date);
    
    const url = `api/analytics/metrics/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }

    return response.json();
  },

  calculateDailyMetrics: async (date?: string): Promise<AnalyticsMetric> => {
    const response = await apiRequest('api/analytics/metrics/calculate_daily/', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate daily metrics');
    }

    return response.json();
  },
};

// Helper function to track events (non-blocking)
export const trackEvent = async (eventType: string, data?: {
  related_object_type?: string;
  related_object_id?: string;
  metadata?: any;
  properties?: any;
}) => {
  try {
    await analyticsAPI.trackEvent({
      event_type: eventType,
      ...data,
    });
  } catch (error) {
    // Fail silently for analytics
    console.error('Analytics tracking error:', error);
  }
};

