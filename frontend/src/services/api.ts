const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to join URLs properly
const joinURL = (base: string, path: string): string => {
  const cleanBase = base.replace(/\/+$/, ''); // Remove trailing slashes
  const cleanPath = path.replace(/^\/+/, ''); // Remove leading slashes
  return `${cleanBase}/${cleanPath}`;
};

// Types for API responses
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'buyer' | 'builder';
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  theme_preference?: 'light' | 'dark';
  language?: string;
  timezone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
  profile_visibility?: boolean;
  show_activity_status?: boolean;
  date_joined?: string;
  is_active?: boolean;
  is_staff?: boolean;
  has_usable_password?: boolean;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  theme_preference?: 'light' | 'dark';
  language?: string;
  timezone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
  profile_visibility?: boolean;
  show_activity_status?: boolean;
}

export interface AuthResponse {
  success: string;
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  role: 'buyer' | 'builder';
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// API functions
export const authAPI = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const url = joinURL(API_BASE_URL, 'api/auth/login/');
    console.log("Login Endpoint attempt to:", url);
    console.log("API_BASE_URL:", API_BASE_URL);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials for CORS
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        console.log("Response not ok:", response);
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      return response.json();
    } catch (error) {
      console.error("Login fetch error:", error);
      throw error;
    }
  },

  // Register user
  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/register/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  },

  // Refresh token
  refresh: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/refresh/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  // Logout user
  logout: async (refreshToken: string): Promise<void> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/logout/'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  },

  // Get user profile
  getProfile: async (): Promise<User> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/profile/'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },

  // Update user profile
  updateProfile: async (profileData: ProfileUpdateRequest): Promise<{ message: string; user: User }> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/profile/'), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }

    return response.json();
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<{ message: string }> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/change-password/'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.old_password?.[0] || error.new_password?.[0] || error.new_password_confirm?.[0] || 'Failed to change password');
    }

    return response.json();
  },

  // Update username
  updateUsername: async (username: string): Promise<{ message: string; username: string }> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/update-username/'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.username?.[0] || 'Failed to update username');
    }

    return response.json();
  },

  // Set initial password (for OAuth users)
  setInitialPassword: async (newPassword: string, newPasswordConfirm: string): Promise<{ message: string }> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/set-initial-password/'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.new_password?.[0] || error.new_password_confirm?.[0] || error.non_field_errors?.[0] || 'Failed to set password');
    }

    return response.json();
  },

  // Update user role
  updateRole: async (role: 'buyer' | 'builder'): Promise<{ message: string; role: string }> => {
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/update-role/'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.role?.[0] || error.non_field_errors?.[0] || 'Failed to update role');
    }

    return response.json();
  },

  // Get Google OAuth URL
  getGoogleAuthUrl: (): string => {
    // Use allauth's Google login URL instead of dj-rest-auth
    return joinURL(API_BASE_URL, 'accounts/google/login/');
  },
};

// Generic API wrapper with auto token refresh
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const headers = getAuthHeaders();
  
  let response = await fetch(joinURL(API_BASE_URL, url), {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // If token expired, try to refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const { access } = await authAPI.refresh(refreshToken);
        localStorage.setItem('access_token', access);
        
        // Retry original request with new token
        response = await fetch(joinURL(API_BASE_URL, url), {
          ...options,
          headers: {
            ...getAuthHeaders(),
            ...options.headers,
          },
        });
      } catch (error) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }
  }

  return response;
};

// Booking types
export interface Booking {
  id: string;
  booking_number: string;
  property: string;
  property_details: {
    id: string;
    unit_number: string;
    property_type: string;
    floor_number: number | null;
    tower: string | null;
    carpet_area: string;
    current_price: string;
    current_status: string;
  };
  buyer: string;
  buyer_name: string;
  buyer_email: string;
  status: string;
  property_price: string;
  token_amount: string;
  total_amount: string;
  amount_paid: string;
  amount_due: string;
  payment_schedule: any;
  booking_date: string;
  token_payment_date: string | null;
  confirmation_date: string | null;
  agreement_date: string | null;
  expected_possession_date: string | null;
  cancellation_date: string | null;
  completion_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_gateway: string | null;
  agreement_document_url: string | null;
  agreement_document_hash: string | null;
  additional_documents: any[];
  cancellation_reason: string | null;
  cancellation_initiated_by: string | null;
  refund_amount: string | null;
  refund_status: string | null;
  refund_reference: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  cancellation_policy: string;
  special_conditions: string;
  notes: string;
  metadata: any;
  project_name: string;
  project_id: string;
  property_unit_number: string;
  property_type: string;
  property_price_current: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingRequest {
  property_id: string;
  token_amount?: string | number;
  payment_method?: string;
  terms_accepted: boolean;
  expected_possession_date?: string;
  special_conditions?: string;
  notes?: string;
}

// Booking API functions
export const bookingAPI = {
  // Create a booking
  create: async (data: CreateBookingRequest): Promise<Booking> => {
    const response = await apiRequest('api/projects/bookings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.property?.[0] || error.detail || 'Failed to create booking');
    }

    return response.json();
  },

  // Get all bookings (filtered by user role)
  getAll: async (params?: { status?: string; property_id?: string; project_id?: string }): Promise<Booking[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.property_id) queryParams.append('property_id', params.property_id);
    if (params?.project_id) queryParams.append('project_id', params.project_id);
    
    const url = `api/projects/bookings/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    return response.json();
  },

  // Get a single booking
  get: async (id: string): Promise<Booking> => {
    const response = await apiRequest(`api/projects/bookings/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch booking');
    }

    return response.json();
  },

  // Get my bookings
  getMyBookings: async (): Promise<Booking[]> => {
    const response = await apiRequest('api/projects/bookings/my_bookings/');

    if (!response.ok) {
      throw new Error('Failed to fetch my bookings');
    }

    return response.json();
  },

  // Get active bookings
  getActiveBookings: async (): Promise<Booking[]> => {
    const response = await apiRequest('api/projects/bookings/active_bookings/');

    if (!response.ok) {
      throw new Error('Failed to fetch active bookings');
    }

    return response.json();
  },

  // Confirm a booking (builder only)
  confirm: async (id: string): Promise<{ message: string; booking: Booking }> => {
    const response = await apiRequest(`api/projects/bookings/${id}/confirm/`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm booking');
    }

    return response.json();
  },

  // Cancel a booking
  cancel: async (id: string, cancellation_reason?: string): Promise<{ message: string; booking: Booking }> => {
    const response = await apiRequest(`api/projects/bookings/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ cancellation_reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel booking');
    }

    return response.json();
  },

  // Update payment
  updatePayment: async (
    id: string,
    data: {
      amount_paid?: string | number;
      payment_method?: string;
      payment_reference?: string;
      payment_gateway?: string;
    }
  ): Promise<{ message: string; booking: Booking }> => {
    const response = await apiRequest(`api/projects/bookings/${id}/update_payment/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update payment');
    }

    return response.json();
  },
};