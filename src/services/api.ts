import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User, Project, Device, Settings, ProjectComment, ProjectInquiry, Role, PublicDevice, Category
} from '../lib/types';
import { apiClient } from '../lib/api-client';

interface AppState {
  currentUser: User | null;
  categories: Category[];
  devices: Device[];
  projects: Project[];
  comments: ProjectComment[];
  inquiries: ProjectInquiry[];

  isLoading: boolean;
  error: string | null;

  // Auth
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;

  // Category Management
  loadCategories: () => Promise<void>;

  // Device Management
  searchDevices: (query?: string, categoryId?: string) => Promise<void>;

  // Project Actions
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<string | null>;
  loadProjects: (filters?: { status?: string; project_type?: string }) => Promise<void>;
  loadProjectDetail: (projectId: string) => Promise<void>;
  approveProject: (projectId: string, note?: string) => Promise<void>;
  rejectProject: (projectId: string, note: string) => Promise<void>;

  // Comment Actions
  addComment: (projectId: string, body: string, parentId?: string) => Promise<void>;

  // Inquiry Actions
  quoteInquiry: (projectId: string, deviceId: string, quantity: number) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      categories: [],
      devices: [],
      projects: [],
      comments: [],
      inquiries: [],

      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.login(username, password);
          if (response.ok && response.data?.user) {
            const user: User = {
              id: response.data.user.id,
              full_name: response.data.user.full_name,
              username: response.data.user.username,
              role: response.data.user.role,
              is_active: true,
            };
            set({ currentUser: user, isLoading: false });
            return true;
          } else {
            set({ error: response.message || 'فشل ورود', isLoading: false });
            return false;
          }
        } catch (e) {
          set({ error: 'خطا در ورود', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.logout();
          set({ currentUser: null, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
        }
      },

      initializeAuth: async () => {
        const response = await apiClient.getMe();
        if (response.ok && response.data?.user) {
          const user: User = {
            id: response.data.user.id,
            full_name: response.data.user.full_name,
            username: response.data.user.username,
            role: response.data.user.role,
            is_active: true,
          };
          set({ currentUser: user });
        } else {
          set({ currentUser: null });
        }
      },

      loadCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.getCategories();
          if (response.ok && response.data) {
            set({ categories: response.data, isLoading: false });
          } else {
            set({ error: response.message || 'فشل بارگذاری دسته‌ها', isLoading: false });
          }
        } catch (e) {
          set({ error: 'خطا در بارگذاری دسته‌ها', isLoading: false });
        }
      },

      searchDevices: async (query, categoryId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.searchDevices(query, categoryId);
          if (response.ok && response.data) {
            set({ devices: response.data, isLoading: false });
          } else {
            set({ error: response.message || 'فشل جستجوی دستگاه‌ها', isLoading: false });
          }
        } catch (e) {
          set({ error: 'خطا در جستجوی دستگاه‌ها', isLoading: false });
        }
      },

      createProject: async (projectData) => {
        const { currentUser } = get();
        if (!currentUser) return null;

        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.createProject(projectData);
          if (response.ok && response.data?.project_id) {
            set({ isLoading: false });
            return response.data.project_id;
          } else {
            set({ error: response.message || 'فشل ایجاد پروژه', isLoading: false });
            return null;
          }
        } catch (e) {
          set({ error: 'خطا در ایجاد پروژه', isLoading: false });
          return null;
        }
      },

      loadProjects: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.listProjects(filters);
          if (response.ok && response.data) {
            set({ projects: response.data, isLoading: false });
          } else {
            set({ error: response.message || 'فشل بارگذاری پروژه‌ها', isLoading: false });
          }
        } catch (e) {
          set({ error: 'خطا در بارگذاری پروژه‌ها', isLoading: false });
        }
      },

      loadProjectDetail: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.getProjectDetail(projectId);
          if (response.ok && response.data) {
            set(state => ({
              projects: state.projects.map(p => p.id === projectId ? response.data!.project : p),
              comments: response.data.comments || [],
              inquiries: response.data.inquiries || [],
              isLoading: false,
            }));
          } else {
            set({ error: response.message || 'فشل بارگذاری جزئیات پروژه', isLoading: false });
          }
        } catch (e) {
          set({ error: 'خطا در بارگذاری جزئیات پروژه', isLoading: false });
        }
      },

      approveProject: async (projectId, note) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.approveProject(projectId, note);
          if (response.ok) {
            await get().loadProjects();
          } else {
            set({ error: response.message || 'فشل تایید پروژه', isLoading: false });
          }
        } catch (e) {
          set({ error: 'خطا در تایید پروژه', isLoading: false });
        }
      },

      rejectProject: async (projectId, note) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.rejectProject(projectId, note);
          if (response.ok) {
            await get().loadProjects();
          } else {
            set({ error: response.message || 'فشل رد پروژه', isLoading: false });
          }
        } catch (e) {
          set({ error: 'خطا در رد پروژه', isLoading: false });
        }
      },

      addComment: async (projectId, body, parentId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.addComment(projectId, body, parentId);
          if (response.ok) {
            await get().loadProjectDetail(projectId);
          } else {
            set({ error: response.message || 'فشل افزودن نظر', isLoading: false });
          }
        } catch (e) {
          set({ error: 'خطا در افزودن نظر', isLoading: false });
        }
      },

      quoteInquiry: async (projectId, deviceId, quantity) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.quoteInquiry(projectId, deviceId, quantity);
          if (response.ok && response.data) {
            set(state => ({
              inquiries: [response.data!, ...state.inquiries],
              isLoading: false,
            }));
          } else {
            set({ error: response.message || 'فشل محاسبه قیمت', isLoading: false });
          }
        } catch (e) {
          set({ error: 'خطا در محاسبه قیمت', isLoading: false });
        }
      },
    }),
    {
      name: 'damon-service-storage-v4',
      partialize: (state) => ({
        currentUser: state.currentUser,
        categories: state.categories,
        devices: state.devices,
        projects: state.projects,
        comments: state.comments,
        inquiries: state.inquiries,
      }),
    }
  )
);

export const useProjects = () => {
  const store = useStore();
  const user = store.currentUser;
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'sales_manager') return store.projects;
  return store.projects.filter(p => p.created_by_user_id === user.id);
};

export const useDevices = () => {
  const store = useStore();
  return store.devices;
};
