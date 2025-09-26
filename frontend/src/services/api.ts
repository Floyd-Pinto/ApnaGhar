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
    const response = await fetch(joinURL(API_BASE_URL, 'api/auth/login/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
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