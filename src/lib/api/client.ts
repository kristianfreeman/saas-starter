import type { ApiResponse, ApiError, PaginationParams } from './types';

export interface ApiClientConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  token?: string;
}

export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private token?: string;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/v1';
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.token = config.token;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | undefined): void {
    this.token = token;
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return `?${searchParams.toString()}`;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}${this.buildQueryString(params)}`;
    const headers = { ...this.headers };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Include cookies for session auth
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiClientError(
          data.error?.message || 'Request failed',
          data.error?.code || 'UNKNOWN_ERROR',
          response.status,
          data.error?.details
        );
      }
      
      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK_ERROR',
        0
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  /**
   * POST request
   */
  async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  /**
   * PUT request
   */
  async put<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }
}

/**
 * API Client Error
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Pre-configured API client instance
 */
export const apiClient = new ApiClient();

/**
 * Profile API
 */
export const profileApi = {
  async get() {
    return apiClient.get<any>('/profile');
  },
  
  async update(data: { full_name?: string; avatar_url?: string; bio?: string }) {
    return apiClient.put<any>('/profile', data);
  },
};

/**
 * Projects API
 */
export const projectsApi = {
  async list(params?: PaginationParams) {
    return apiClient.get<any[]>('/projects', params);
  },
  
  async get(id: string) {
    return apiClient.get<any>(`/projects/${id}`);
  },
  
  async create(data: { name: string; description?: string; is_public?: boolean }) {
    return apiClient.post<any>('/projects', data);
  },
  
  async update(id: string, data: Partial<{ name: string; description: string; is_public: boolean }>) {
    return apiClient.put<any>(`/projects/${id}`, data);
  },
  
  async delete(id: string) {
    return apiClient.delete<void>(`/projects/${id}`);
  },
};