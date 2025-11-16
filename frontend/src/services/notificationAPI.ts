import { apiRequest } from './api';

// Notification types
export interface Notification {
  id: string;
  user: string;
  user_email: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  related_object_type: string | null;
  related_object_id: string | null;
  data: any;
  action_url: string | null;
  action_text: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  email_sent: boolean;
  sms_sent: boolean;
  push_sent: boolean;
  related_object_url: string | null;
}

export interface NotificationPreference {
  id: string;
  user: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  type_preferences: { [key: string]: boolean };
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  digest_enabled: boolean;
  digest_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface MarkReadRequest {
  notification_ids: string[];
}

// Notification API functions
export const notificationAPI = {
  // Get all notifications (filtered by user)
  getAll: async (params?: { unread_only?: boolean; type?: string; status?: string }): Promise<Notification[]> => {
    const queryParams = new URLSearchParams();
    if (params?.unread_only) queryParams.append('unread_only', 'true');
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `api/notifications/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  },

  // Get a single notification
  get: async (id: string): Promise<Notification> => {
    const response = await apiRequest(`api/notifications/notifications/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch notification');
    }

    return response.json();
  },

  // Get recent notifications (last 10)
  getRecent: async (): Promise<Notification[]> => {
    const response = await apiRequest('api/notifications/notifications/recent/');

    if (!response.ok) {
      throw new Error('Failed to fetch recent notifications');
    }

    return response.json();
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiRequest('api/notifications/notifications/unread_count/');

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    return response.json();
  },

  // Mark notification as read
  markRead: async (id: string): Promise<{ message: string; notification: Notification }> => {
    const response = await apiRequest(`api/notifications/notifications/${id}/mark_read/`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return response.json();
  },

  // Mark all notifications as read
  markAllRead: async (): Promise<{ message: string }> => {
    const response = await apiRequest('api/notifications/notifications/mark_all_read/', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return response.json();
  },

  // Mark multiple notifications as read
  markMultipleRead: async (notificationIds: string[]): Promise<{ message: string }> => {
    const response = await apiRequest('api/notifications/notifications/mark_multiple_read/', {
      method: 'POST',
      body: JSON.stringify({ notification_ids: notificationIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }

    return response.json();
  },

  // Get notification preferences
  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await apiRequest('api/notifications/preferences/my_preferences/');

    if (!response.ok) {
      throw new Error('Failed to fetch notification preferences');
    }

    return response.json();
  },

  // Update notification preferences
  updatePreferences: async (data: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await apiRequest('api/notifications/preferences/update_preferences/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update notification preferences');
    }

    return response.json();
  },
};

