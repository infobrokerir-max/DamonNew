const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWeH17Ut3BQEvbdLB13e7WerluTExLqZOut1XgFjlCS4W4d06dfwCP1y2lTos9hUy7/exec';

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error_code?: string;
  message?: string;
  status?: number;
}

interface AuthUser {
  id: string;
  full_name: string;
  username: string;
  role: 'admin' | 'sales_manager' | 'employee';
}

interface Category {
  id: string;
  category_name: string;
  description?: string;
}

interface Device {
  device_id: string;
  category_id: string;
  category_name: string;
  model_name: string;
  factory_pricelist_eur?: number;
  length_meter?: number;
  weight_unit?: number;
}

interface Project {
  id: string;
  project_name: string;
  employer_name: string;
  project_type: string;
  address_text: string;
  tehran_lat: number;
  tehran_lng: number;
  status: string;
  created_by_user_id: string;
  assigned_sales_manager_id?: string;
  additional_info?: string;
  approval_note?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectDetail {
  project: Project;
  status_history: any[];
  comments: any[];
  inquiries: any[];
}

interface Inquiry {
  id: string;
  project_id: string;
  requested_by_user_id: string;
  device_id: string;
  category_id: string;
  quantity: number;
  category_name: string;
  model_name: string;
  sell_price_eur: number;
  sell_price_irr?: number;
  factory_pricelist_eur?: number;
  length_meter?: number;
  weight_unit?: number;
  created_at: string;
}

const getToken = () => localStorage.getItem('token');
const setToken = (token: string) => localStorage.setItem('token', token);
const clearToken = () => localStorage.removeItem('token');

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: any
): Promise<ApiResponse<T>> {
  const token = getToken();
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('path', path);

  if (method === 'GET' && token) {
    url.searchParams.append('token', token);
  }

  const fetchOptions: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (method === 'POST') {
    fetchOptions.body = JSON.stringify({
      ...body,
      path,
      token,
    });
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    return {
      ok: false,
      error_code: 'NETWORK_ERROR',
      message: `خطا در ارتباط: ${error instanceof Error ? error.message : 'نامشخص'}`,
      status: 0,
    };
  }
}

export const apiClient = {
  // Auth
  async login(username: string, password: string) {
    const response = await request<{ token: string; user: AuthUser }>('POST', '/auth/login', {
      username,
      password,
      ip_address: '',
      user_agent: navigator.userAgent,
    });
    if (response.ok && response.data?.token) {
      setToken(response.data.token);
    }
    return response;
  },

  async logout() {
    await request('POST', '/auth/logout');
    clearToken();
  },

  async getMe() {
    return request<{ user: AuthUser }>('GET', '/auth/me');
  },

  // Categories
  async getCategories() {
    return request<Category[]>('GET', '/categories/list');
  },

  // Devices
  async searchDevices(query?: string, categoryId?: string) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (categoryId) params.append('category_id', categoryId);
    const path = `/devices/search?${params.toString()}`;
    return request<Device[]>('GET', path);
  },

  // Projects
  async createProject(data: {
    project_name: string;
    employer_name: string;
    project_type: string;
    address_text: string;
    tehran_lat: number;
    tehran_lng: number;
    additional_info?: string;
    assigned_sales_manager_id?: string;
  }) {
    return request<{ project_id: string; status: string }>('POST', '/projects/create', data);
  },

  async listProjects(filters?: { status?: string; project_type?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.project_type) params.append('project_type', filters.project_type);
    const path = `/projects/list?${params.toString()}`;
    return request<Project[]>('GET', path);
  },

  async getProjectDetail(projectId: string) {
    return request<ProjectDetail>('GET', `/projects/detail?id=${projectId}`);
  },

  async approveProject(projectId: string, note?: string) {
    return request('POST', '/projects/approve', {
      project_id: projectId,
      note: note || '',
    });
  },

  async rejectProject(projectId: string, note: string) {
    return request('POST', '/projects/reject', {
      project_id: projectId,
      note,
    });
  },

  // Comments
  async addComment(projectId: string, body: string, parentCommentId?: string) {
    return request('POST', '/comments/add', {
      project_id: projectId,
      body,
      parent_comment_id: parentCommentId || '',
    });
  },

  // Inquiries
  async quoteInquiry(projectId: string, deviceId: string, quantity: number = 1) {
    return request<Inquiry>('POST', '/inquiries/quote', {
      project_id: projectId,
      device_id: deviceId,
      quantity,
      query_text_snapshot: '',
    });
  },

  // Admin
  async setUserPassword(username: string, password: string) {
    return request('POST', '/admin/users/set_password', {
      username,
      password,
    });
  },
};
