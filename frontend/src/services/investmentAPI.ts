import { apiRequest } from './api';

// Investment types
export interface InvestmentProperty {
  id: string;
  property: string;
  property_unit_number: string;
  property_type: string;
  property_price: string;
  project_name: string;
  project_id: string;
  total_tokens: number;
  token_price: string;
  available_tokens: number;
  sold_tokens: number;
  minimum_investment: string;
  maximum_investment_per_user: string | null;
  revenue_share_percentage: string;
  dividend_frequency: string;
  status: string;
  tokenization_date: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  description: string;
  terms_conditions: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  investment_property: string;
  investment_property_details: InvestmentProperty;
  user: string;
  user_email: string;
  user_name: string;
  tokens: number;
  token_price: string;
  total_amount: string;
  current_token_price: string | null;
  current_value: string | null;
  total_dividends_received: string;
  total_return: string;
  return_percentage: string;
  status: string;
  purchase_date: string | null;
  confirmation_date: string | null;
  sale_date: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  investment: string | null;
  investment_property: string;
  investment_property_details: InvestmentProperty;
  user: string;
  user_email: string;
  transaction_type: string;
  tokens: number;
  token_price: string;
  total_amount: string;
  payment: string | null;
  payment_status: string;
  status: string;
  related_user: string | null;
  related_user_email: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Dividend {
  id: string;
  investment_property: string;
  investment_property_details: InvestmentProperty;
  amount_per_token: string;
  total_amount: string;
  tokens_eligible: number;
  period_start: string;
  period_end: string;
  payment_date: string;
  status: string;
  approved_by: string | null;
  approved_by_email: string | null;
  approved_at: string | null;
  description: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface DividendPayment {
  id: string;
  dividend: string;
  dividend_details: Dividend;
  investment: string;
  investment_details: Investment;
  user: string;
  user_email: string;
  tokens: number;
  amount: string;
  payment: string | null;
  payment_reference: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvestmentRequest {
  investment_property: string;
  tokens: number;
}

export interface Portfolio {
  total_investments: number;
  total_tokens: number;
  total_invested: number;
  total_current_value: number;
  total_dividends: number;
  total_return: number;
  investments: Investment[];
}

// Investment API functions
export const investmentAPI = {
  // Properties
  getAllProperties: async (params?: { status?: string }): Promise<InvestmentProperty[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `api/investments/properties/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch investment properties');
    }

    return response.json();
  },

  getProperty: async (id: string): Promise<InvestmentProperty> => {
    const response = await apiRequest(`api/investments/properties/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch investment property');
    }

    return response.json();
  },

  // Investments
  createInvestment: async (data: CreateInvestmentRequest): Promise<Investment> => {
    const response = await apiRequest('api/investments/investments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.tokens?.[0] || 'Failed to create investment');
    }

    return response.json();
  },

  getAllInvestments: async (params?: { status?: string; investment_property?: string }): Promise<Investment[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.investment_property) queryParams.append('investment_property', params.investment_property);
    
    const url = `api/investments/investments/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch investments');
    }

    return response.json();
  },

  getInvestment: async (id: string): Promise<Investment> => {
    const response = await apiRequest(`api/investments/investments/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch investment');
    }

    return response.json();
  },

  getMyInvestments: async (): Promise<Investment[]> => {
    const response = await apiRequest('api/investments/investments/my_investments/');

    if (!response.ok) {
      throw new Error('Failed to fetch my investments');
    }

    return response.json();
  },

  getPortfolio: async (): Promise<Portfolio> => {
    const response = await apiRequest('api/investments/investments/portfolio/');

    if (!response.ok) {
      throw new Error('Failed to fetch portfolio');
    }

    return response.json();
  },

  // Transactions
  getAllTransactions: async (params?: { transaction_type?: string; status?: string; investment_property?: string }): Promise<InvestmentTransaction[]> => {
    const queryParams = new URLSearchParams();
    if (params?.transaction_type) queryParams.append('transaction_type', params.transaction_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.investment_property) queryParams.append('investment_property', params.investment_property);
    
    const url = `api/investments/transactions/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return response.json();
  },

  getTransaction: async (id: string): Promise<InvestmentTransaction> => {
    const response = await apiRequest(`api/investments/transactions/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch transaction');
    }

    return response.json();
  },

  completeTransaction: async (id: string): Promise<InvestmentTransaction> => {
    const response = await apiRequest(`api/investments/transactions/${id}/complete/`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete transaction');
    }

    return response.json();
  },

  // Dividends
  getAllDividends: async (params?: { status?: string; investment_property?: string }): Promise<Dividend[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.investment_property) queryParams.append('investment_property', params.investment_property);
    
    const url = `api/investments/dividends/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch dividends');
    }

    return response.json();
  },

  getDividend: async (id: string): Promise<Dividend> => {
    const response = await apiRequest(`api/investments/dividends/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch dividend');
    }

    return response.json();
  },

  approveDividend: async (id: string): Promise<Dividend> => {
    const response = await apiRequest(`api/investments/dividends/${id}/approve/`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve dividend');
    }

    return response.json();
  },

  // Dividend Payments
  getAllDividendPayments: async (params?: { status?: string; dividend?: string; investment?: string }): Promise<DividendPayment[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dividend) queryParams.append('dividend', params.dividend);
    if (params?.investment) queryParams.append('investment', params.investment);
    
    const url = `api/investments/dividend-payments/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error('Failed to fetch dividend payments');
    }

    return response.json();
  },

  getMyDividendPayments: async (): Promise<DividendPayment[]> => {
    const response = await apiRequest('api/investments/dividend-payments/my_dividends/');

    if (!response.ok) {
      throw new Error('Failed to fetch my dividend payments');
    }

    return response.json();
  },
};

