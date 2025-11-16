import { apiRequest } from './api';

// Payment types
export interface Payment {
  id: string;
  transaction_id: string;
  payment_id: string | null;
  order_id: string | null;
  user: string;
  user_email: string;
  user_name: string;
  booking: string | null;
  booking_number: string | null;
  amount: string;
  currency: string;
  status: string;
  payment_method: string;
  payment_type: string;
  gateway: string;
  gateway_transaction_id: string | null;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  gateway_signature: string | null;
  description: string | null;
  notes: any;
  metadata: any;
  initiated_at: string;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  failure_code: string | null;
  refund_id: string | null;
  refund_amount: string | null;
  refund_status: string | null;
  refund_reason: string | null;
  webhook_received: boolean;
  property_details: any | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRefund {
  id: string;
  refund_id: string;
  payment: string;
  payment_transaction_id: string;
  amount: string;
  currency: string;
  status: string;
  gateway_refund_id: string | null;
  reason: string | null;
  notes: any;
  gateway_response: any;
  initiated_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  booking_id?: string;
  amount: string | number;
  currency?: string;
  payment_method: string;
  payment_type?: string;
  description?: string;
  notes?: any;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Payment API functions
export const paymentAPI = {
  // Create a payment (initiate payment)
  create: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await apiRequest('api/payments/payments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.gateway?.[0] || error.detail || error.non_field_errors?.[0] || 'Failed to create payment');
    }

    return response.json();
  },

  // Get all payments (filtered by user role)
  getAll: async (params?: { status?: string; payment_method?: string; booking?: string }): Promise<Payment[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.booking) queryParams.append('booking', params.booking);
    
    const url = `api/payments/payments/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }

    return response.json();
  },

  // Get a single payment
  get: async (id: string): Promise<Payment> => {
    const response = await apiRequest(`api/payments/payments/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch payment');
    }

    return response.json();
  },

  // Get my payments
  getMyPayments: async (): Promise<Payment[]> => {
    const response = await apiRequest('api/payments/payments/my_payments/');

    if (!response.ok) {
      throw new Error('Failed to fetch my payments');
    }

    return response.json();
  },

  // Get payments for a booking
  getBookingPayments: async (bookingId: string): Promise<Payment[]> => {
    const response = await apiRequest(`api/payments/payments/booking_payments/?booking_id=${bookingId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch booking payments');
    }

    return response.json();
  },

  // Verify a payment
  verify: async (id: string, data: VerifyPaymentRequest): Promise<{ message: string; payment: Payment }> => {
    const response = await apiRequest(`api/payments/payments/${id}/verify/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.signature?.[0] || 'Failed to verify payment');
    }

    return response.json();
  },

  // Create a refund
  createRefund: async (data: { payment: string; amount?: string | number; reason?: string; notes?: any }): Promise<PaymentRefund> => {
    const response = await apiRequest('api/payments/refunds/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.gateway?.[0] || error.detail || 'Failed to create refund');
    }

    return response.json();
  },

  // Get refunds
  getRefunds: async (paymentId?: string): Promise<PaymentRefund[]> => {
    const url = paymentId 
      ? `api/payments/refunds/?payment=${paymentId}`
      : 'api/payments/refunds/';
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch refunds');
    }

    return response.json();
  },
};

