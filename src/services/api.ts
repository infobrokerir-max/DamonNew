import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from './google-apps-client';
import {
  User, Project, Device, Category, ProjectComment, ProjectInquiry, PublicDevice
} from '../lib/types';

interface AppState {
  currentUser: User | null;
  categories: Category[];
  projects: Project[];

  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUserData: () => Promise<void>;

  loadCategories: () => Promise<void>;

  searchDevices: (query: string, categoryId?: string) => Promise<PublicDevice[]>;

  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<boolean>;
  loadProjects: (status?: string, projectType?: string) => Promise<void>;
  getProjectDetail: (projectId: string) => Promise<any>;
  approveProject: (projectId: string, note?: string) => Promise<boolean>;
  rejectProject: (projectId: string, note: string) => Promise<boolean>;

  addComment: (projectId: string, body: string, parentId?: string) => Promise<boolean>;

  requestQuote: (projectId: string, deviceId: string, quantity?: number) => Promise<any>;

  setUserPassword: (username: string, password: string) => Promise<boolean>;

  clearError: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      categories: [],
      projects: [],

      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.login(username, password);

        if (response.ok && response.data) {
          const user: User = {
            id: response.data.user.id,
            full_name: response.data.user.full_name,
            username: response.data.user.username,
            role: response.data.user.role as any,
            is_active: true,
          };

          set({ currentUser: user, isLoading: false });
          return true;
        } else {
          set({
            error: response.message || 'خطا در ورود به سیستم',
            isLoading: false
          });
          return false;
        }
      },

      logout: async () => {
        await apiClient.logout();
        set({ currentUser: null, categories: [], projects: [] });
      },

      loadUserData: async () => {
        if (!apiClient.hasToken()) return;

        const response = await apiClient.getMe();

        if (response.ok && response.data) {
          const user: User = {
            id: response.data.user.id,
            full_name: response.data.user.full_name,
            username: response.data.user.username,
            role: response.data.user.role as any,
            is_active: response.data.user.is_active,
          };

          set({ currentUser: user });
        } else {
          set({ currentUser: null });
        }
      },

      loadCategories: async () => {
        set({ isLoading: true, error: null });

        const response = await apiClient.getCategoriesList();

        if (response.ok && response.data) {
          const categories: Category[] = response.data.map((cat: any) => ({
            id: cat.id,
            category_name: cat.category_name,
            description: cat.description || '',
            is_active: true,
          }));

          set({ categories, isLoading: false });
        } else {
          set({
            error: response.message || 'خطا در دریافت دسته‌بندی‌ها',
            isLoading: false
          });
        }
      },

      searchDevices: async (query, categoryId) => {
        const response = await apiClient.searchDevices(query, categoryId);

        if (response.ok && response.data) {
          return response.data.map((dev: any) => ({
            device_id: dev.device_id,
            category_id: dev.category_id,
            category_name: dev.category_name,
            model_name: dev.model_name,
          }));
        }

        return [];
      },

      createProject: async (projectData) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.createProject({
          project_name: projectData.project_name,
          employer_name: projectData.employer_name,
          project_type: projectData.project_type,
          address_text: projectData.address_text,
          tehran_lat: projectData.tehran_lat,
          tehran_lng: projectData.tehran_lng,
          additional_info: projectData.additional_info || '',
          assigned_sales_manager_id: projectData.assigned_sales_manager_id || '',
        });

        if (response.ok) {
          set({ isLoading: false });
          get().loadProjects();
          return true;
        } else {
          set({
            error: response.message || 'خطا در ایجاد پروژه',
            isLoading: false
          });
          return false;
        }
      },

      loadProjects: async (status, projectType) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.getProjectsList(status, projectType);

        if (response.ok && response.data) {
          const projects: Project[] = response.data.map((proj: any) => ({
            id: proj.id,
            created_by_user_id: proj.created_by_user_id,
            assigned_sales_manager_id: proj.assigned_sales_manager_id || '',
            project_name: proj.project_name,
            employer_name: proj.employer_name,
            project_type: proj.project_type,
            address_text: proj.address_text,
            tehran_lat: proj.tehran_lat,
            tehran_lng: proj.tehran_lng,
            additional_info: proj.additional_info || '',
            status: proj.status as any,
            approval_decision_by: proj.approval_decision_by || '',
            approval_decision_at: proj.approval_decision_at || '',
            approval_note: proj.approval_note || '',
            created_at: proj.created_at,
            updated_at: proj.updated_at,
          }));

          set({ projects, isLoading: false });
        } else {
          set({
            error: response.message || 'خطا در دریافت پروژه‌ها',
            isLoading: false
          });
        }
      },

      getProjectDetail: async (projectId) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.getProjectDetail(projectId);

        set({ isLoading: false });

        if (response.ok && response.data) {
          return response.data;
        } else {
          set({ error: response.message || 'خطا در دریافت جزئیات پروژه' });
          return null;
        }
      },

      approveProject: async (projectId, note) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.approveProject(projectId, note);

        if (response.ok) {
          set({ isLoading: false });
          get().loadProjects();
          return true;
        } else {
          set({
            error: response.message || 'خطا در تایید پروژه',
            isLoading: false
          });
          return false;
        }
      },

      rejectProject: async (projectId, note) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.rejectProject(projectId, note);

        if (response.ok) {
          set({ isLoading: false });
          get().loadProjects();
          return true;
        } else {
          set({
            error: response.message || 'خطا در رد پروژه',
            isLoading: false
          });
          return false;
        }
      },

      addComment: async (projectId, body, parentId) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.addComment(projectId, body, parentId);

        if (response.ok) {
          set({ isLoading: false });
          return true;
        } else {
          set({
            error: response.message || 'خطا در ارسال نظر',
            isLoading: false
          });
          return false;
        }
      },

      requestQuote: async (projectId, deviceId, quantity = 1) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.requestQuote(projectId, deviceId, quantity);

        set({ isLoading: false });

        if (response.ok && response.data) {
          return response.data;
        } else {
          set({ error: response.message || 'خطا در دریافت قیمت' });
          return null;
        }
      },

      setUserPassword: async (username, password) => {
        set({ isLoading: true, error: null });

        const response = await apiClient.setUserPassword(username, password);

        if (response.ok) {
          set({ isLoading: false });
          return true;
        } else {
          set({
            error: response.message || 'خطا در تنظیم رمز عبور',
            isLoading: false
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'damon-service-storage-v4',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);

export const useProjects = () => {
  const store = useStore();
  return store.projects;
};

export const useDevices = (): PublicDevice[] => {
  return [];
};
