import { create } from 'zustand';
import {
  User, Project, Device, Settings, ProjectComment, ProjectInquiry, Category, PublicDevice
} from '../lib/types';

interface AppState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;

  fetchProjects: (filters?: { status?: string; project_type?: string }) => Promise<Project[]>;
  fetchProjectDetail: (projectId: string) => Promise<any>;
  createProject: (projectData: any) => Promise<any>;
  approveProject: (projectId: string, note?: string) => Promise<any>;
  rejectProject: (projectId: string, note: string) => Promise<any>;

  fetchCategories: () => Promise<Category[]>;
  searchDevices: (query?: string, categoryId?: string) => Promise<Device[]>;

  requestQuote: (projectId: string, deviceId: string, quantity?: number, queryText?: string) => Promise<any>;

  addComment: (projectId: string, body: string, parentCommentId?: string) => Promise<any>;

  setPassword: (username: string, password: string) => Promise<any>;
}

async function apiCall(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      }
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'خطا در ارتباط با سرور');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (result.ok && result.data?.user) {
        set({ currentUser: result.data.user, isLoading: false });
        return true;
      }

      set({ isLoading: false, error: result.error || 'نام کاربری یا رمز عبور اشتباه است' });
      return false;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'خطا در ورود' });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiCall('/api/logout', { method: 'POST' });
      set({ currentUser: null });
    } catch (error) {
      console.error('Logout error:', error);
      set({ currentUser: null });
    }
  },

  fetchCurrentUser: async () => {
    try {
      const result = await apiCall('/api/me');
      if (result.ok && result.data?.user) {
        set({ currentUser: result.data.user });
      } else {
        set({ currentUser: null });
      }
    } catch (error) {
      set({ currentUser: null });
    }
  },

  fetchProjects: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      let url = '/api/projects/list';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.project_type) params.append('project_type', filters.project_type);
        if (params.toString()) url += `?${params.toString()}`;
      }

      const result = await apiCall(url);
      set({ isLoading: false });
      return result.data?.projects || [];
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  fetchProjectDetail: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiCall(`/api/projects/detail?id=${projectId}`);
      set({ isLoading: false });
      return result.data;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      return null;
    }
  },

  createProject: async (projectData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiCall('/api/projects/create', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
      set({ isLoading: false });
      return result.data;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  approveProject: async (projectId, note) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiCall('/api/projects/approve', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, note })
      });
      set({ isLoading: false });
      return result.data;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  rejectProject: async (projectId, note) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiCall('/api/projects/reject', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, note })
      });
      set({ isLoading: false });
      return result.data;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  fetchCategories: async () => {
    try {
      const result = await apiCall('/api/categories/list');
      return result.data?.categories || [];
    } catch (error) {
      return [];
    }
  },

  searchDevices: async (query, categoryId) => {
    try {
      let url = '/api/devices/search';
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (categoryId) params.append('category_id', categoryId);
      if (params.toString()) url += `?${params.toString()}`;

      const result = await apiCall(url);
      return result.data?.devices || [];
    } catch (error) {
      return [];
    }
  },

  requestQuote: async (projectId, deviceId, quantity, queryText) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiCall('/api/inquiries/quote', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          device_id: deviceId,
          quantity,
          query_text_snapshot: queryText
        })
      });
      set({ isLoading: false });
      return result.data;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  addComment: async (projectId, body, parentCommentId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiCall('/api/comments/add', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          body,
          parent_comment_id: parentCommentId
        })
      });
      set({ isLoading: false });
      return result.data;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  setPassword: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiCall('/api/admin/users/set_password', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      set({ isLoading: false });
      return result.data;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  }
}));

export const useProjects = () => {
  return [];
};

export const useDevices = (): (Device | PublicDevice)[] => {
  return [];
};
