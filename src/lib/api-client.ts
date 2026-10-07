/**
 * Unified API Client Adapter
 * 
 * Provides a clean interface for UI components to call backend services.
 * Easily switch backend target between Next.js API (/api/v1) and Golang API (e.g. http://localhost:8080/api/v1)
 * by changing NEXT_PUBLIC_API_BASE_URL in .env.local!
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export interface CustomerDTO {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface InvoiceItemDTO {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceDTO {
  id?: string;
  invoiceNumber: string;
  status: string;
  issueDate?: string;
  dueDate: string;
  taxRate: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  customerId: string;
  customer?: CustomerDTO;
  items: InvoiceItemDTO[];
}

export interface CompanyProfileDTO {
  id?: string;
  workspaceId?: string;
  legalName: string;
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  logoUrl?: string;
  website?: string;
  currency?: string;
  timezone?: string;
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  companyProfile?: CompanyProfileDTO;
  _count?: {
    invoices?: number;
    customers?: number;
    members?: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error [${response.status}]: ${errorText || response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Workspaces / Multi-Company API
  async getWorkspaces(): Promise<WorkspaceDTO[]> {
    return this.fetcher('/workspaces');
  }

  async createWorkspace(workspace: { name: string; type?: string }): Promise<WorkspaceDTO> {
    return this.fetcher('/workspaces', {
      method: 'POST',
      body: JSON.stringify(workspace),
    });
  }

  async inviteWorkspaceMember(workspaceId: string, email: string): Promise<{ invitation: any; activationUrl: string }> {
    return this.fetcher(`/workspaces/${workspaceId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Health check endpoint
  async getHealth(): Promise<{ status: string; engine: string; timestamp: string }> {
    return this.fetcher('/health');
  }

  // Customers API
  async getCustomers(): Promise<CustomerDTO[]> {
    return this.fetcher('/customers');
  }

  async createCustomer(customer: Omit<CustomerDTO, 'id'>): Promise<CustomerDTO> {
    return this.fetcher('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  // Invoices API
  async getInvoices(): Promise<InvoiceDTO[]> {
    return this.fetcher('/invoices');
  }

  async getInvoiceById(id: string): Promise<InvoiceDTO> {
    return this.fetcher(`/invoices/${id}`);
  }

  async createInvoice(invoice: Omit<InvoiceDTO, 'id' | 'totalAmount'>): Promise<InvoiceDTO> {
    return this.fetcher('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  }

  async updateInvoiceStatus(id: string, status: InvoiceDTO['status']): Promise<InvoiceDTO> {
    return this.fetcher(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteInvoice(id: string): Promise<{ success: boolean }> {
    return this.fetcher(`/invoices/${id}`, {
      method: 'DELETE',
      });
  }
}

export const apiClient = new ApiClient();
