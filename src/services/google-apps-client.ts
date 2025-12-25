const API_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error_code?: string;
  message?: string;
  status?: number;
}

class GoogleAppsClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('damon_token');
  }

  private setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('damon_token', token);
    } else {
      localStorage.removeItem('damon_token');
    }
  }

  private async request<T = any>(
    method: 'GET' | 'POST',
    path: string,
    body?: any,
    requiresAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(API_URL);
      url.searchParams.set('path', path);

      if (method === 'GET' && requiresAuth && this.token) {
        url.searchParams.set('token', this.token);
      }

      if (method === 'GET' && body) {
        Object.keys(body).forEach(key => {
          if (body[key] !== undefined && body[key] !== null) {
            url.searchParams.set(key, String(body[key]));
          }
        });
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method === 'POST') {
        const payload = { ...body };
        if (requiresAuth && this.token) {
          payload.token = this.token;
        }
        options.body = JSON.stringify(payload);
      }

      const response = await fetch(url.toString(), options);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        ok: false,
        error_code: 'NETWORK_ERROR',
        message: 'خطا در ارتباط با سرور',
        status: 500
      };
    }
  }

  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request<{ token: string; user: any }>('POST', '/auth/login', {
      username,
      password,
    });

    if (response.ok && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('POST', '/auth/logout', { token: this.token });
    this.setToken(null);
    return response;
  }

  async getMe(): Promise<ApiResponse<{ user: any }>> {
    return this.request('GET', '/auth/me', {}, true);
  }

  async getCategoriesList(): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/categories/list', {}, true);
  }

  async searchDevices(query: string, categoryId?: string): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/devices/search', { query, category_id: categoryId }, true);
  }

  async createProject(projectData: any): Promise<ApiResponse<{ project_id: string; status: string }>> {
    return this.request('POST', '/projects/create', projectData, true);
  }

  async getProjectsList(status?: string, projectType?: string): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/projects/list', { status, project_type: projectType }, true);
  }

  async getProjectDetail(projectId: string): Promise<ApiResponse<any>> {
    return this.request('GET', '/projects/detail', { id: projectId }, true);
  }

  async approveProject(projectId: string, note?: string): Promise<ApiResponse<any>> {
    return this.request('POST', '/projects/approve', { project_id: projectId, note }, true);
  }

  async rejectProject(projectId: string, note: string): Promise<ApiResponse<any>> {
    return this.request('POST', '/projects/reject', { project_id: projectId, note }, true);
  }

  async addComment(projectId: string, body: string, parentCommentId?: string): Promise<ApiResponse<any>> {
    return this.request('POST', '/comments/add', {
      project_id: projectId,
      body,
      parent_comment_id: parentCommentId
    }, true);
  }

  async requestQuote(
    projectId: string,
    deviceId: string,
    quantity: number = 1,
    queryText?: string
  ): Promise<ApiResponse<any>> {
    return this.request('POST', '/inquiries/quote', {
      project_id: projectId,
      device_id: deviceId,
      quantity,
      query_text_snapshot: queryText
    }, true);
  }

  async setUserPassword(username: string, password: string): Promise<ApiResponse<any>> {
    return this.request('POST', '/admin/users/set_password', { username, password }, true);
  }

  async resetPassword(username: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request('POST', '/dev/reset_password', {
      username,
      new_password: newPassword
    });
  }

  getToken(): string | null {
    return this.token;
  }

  hasToken(): boolean {
    return !!this.token;
  }
}

export const apiClient = new GoogleAppsClient();
