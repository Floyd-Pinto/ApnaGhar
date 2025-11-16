import { apiRequest } from './api';

// Support types
export interface SupportTicket {
  id: string;
  ticket_number: string;
  user: string;
  user_email: string;
  user_name: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  assigned_to: string | null;
  assigned_to_email: string | null;
  assigned_to_name: string | null;
  related_object_type: string | null;
  related_object_id: string | null;
  attachments: any[];
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_by_name: string | null;
  closed_at: string | null;
  closed_by: string | null;
  closed_by_name: string | null;
  metadata: any;
  internal_notes: string;
  last_activity_at: string;
  last_message_at: string | null;
  first_response_at: string | null;
  resolution_time: number | null;
  messages_count: number;
  unread_messages_count: number;
  related_object_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket: string;
  user: string;
  user_email: string;
  user_name: string;
  message_type: string;
  message: string;
  attachments: any[];
  is_internal: boolean;
  metadata: any;
  read_by_user: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  default_assigned_to: string | null;
  default_priority: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketRequest {
  category: string;
  priority?: string;
  subject: string;
  description: string;
  related_object_type?: string;
  related_object_id?: string;
  attachments?: any[];
}

export interface CreateMessageRequest {
  ticket: string;
  message: string;
  attachments?: any[];
  is_internal?: boolean;
}

// Support API functions
export const supportAPI = {
  // Tickets
  createTicket: async (data: CreateTicketRequest): Promise<SupportTicket> => {
    const response = await apiRequest('api/support/tickets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.subject?.[0] || 'Failed to create ticket');
    }

    return response.json();
  },

  getAllTickets: async (params?: { status?: string; priority?: string; category?: string }): Promise<SupportTicket[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    
    const url = `api/support/tickets/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch tickets');
    }

    return response.json();
  },

  getTicket: async (id: string): Promise<SupportTicket> => {
    const response = await apiRequest(`api/support/tickets/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch ticket');
    }

    return response.json();
  },

  getMyTickets: async (): Promise<SupportTicket[]> => {
    const response = await apiRequest('api/support/tickets/my_tickets/');

    if (!response.ok) {
      throw new Error('Failed to fetch my tickets');
    }

    return response.json();
  },

  updateTicketStatus: async (id: string, status: string, resolution?: string): Promise<SupportTicket> => {
    const response = await apiRequest(`api/support/tickets/${id}/update_status/`, {
      method: 'POST',
      body: JSON.stringify({ status, resolution }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update ticket status');
    }

    return response.json();
  },

  assignTicket: async (id: string, assignedToId: string): Promise<SupportTicket> => {
    const response = await apiRequest(`api/support/tickets/${id}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to_id: assignedToId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign ticket');
    }

    return response.json();
  },

  getTicketStats: async (): Promise<{
    total: number;
    open: number;
    in_progress: number;
    waiting_for_user: number;
    resolved: number;
    closed: number;
    high_priority: number;
    assigned_to_me: number;
  }> => {
    const response = await apiRequest('api/support/tickets/stats/');

    if (!response.ok) {
      throw new Error('Failed to fetch ticket statistics');
    }

    return response.json();
  },

  // Messages
  createMessage: async (data: CreateMessageRequest): Promise<SupportMessage> => {
    const response = await apiRequest('api/support/messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.message?.[0] || 'Failed to create message');
    }

    return response.json();
  },

  getMessages: async (ticketId?: string): Promise<SupportMessage[]> => {
    const url = ticketId 
      ? `api/support/messages/?ticket=${ticketId}`
      : 'api/support/messages/';
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  },

  markMessageRead: async (id: string): Promise<SupportMessage> => {
    const response = await apiRequest(`api/support/messages/${id}/mark_read/`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to mark message as read');
    }

    return response.json();
  },

  markTicketMessagesRead: async (ticketId: string): Promise<{ message: string }> => {
    const response = await apiRequest('api/support/messages/mark_ticket_messages_read/', {
      method: 'POST',
      body: JSON.stringify({ ticket_id: ticketId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark messages as read');
    }

    return response.json();
  },

  // Categories
  getCategories: async (): Promise<SupportCategory[]> => {
    const response = await apiRequest('api/support/categories/');

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  },
};

