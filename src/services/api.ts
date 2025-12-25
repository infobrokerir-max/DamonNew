import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  User, Project, Device, Settings, ProjectComment, ProjectInquiry, Category, PublicDevice, PriceBreakdown, InquiryStatus, Role
} from '../lib/types';
import { calculatePrice } from '../lib/pricing';

interface AppState {
  currentUser: User | null;
  users: User[];
  categories: Category[];
  devices: Device[];
  settings: Settings | null;
  projects: Project[];
  comments: ProjectComment[];
  inquiries: ProjectInquiry[];

  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  fetchUsers: () => Promise<void>;
  createUser: (user: Omit<User, 'id' | 'is_active'>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  fetchCategories: () => Promise<void>;
  createCategory: (name: string, desc?: string) => Promise<void>;
  updateCategory: (id: string, name: string, desc?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  fetchDevices: () => Promise<void>;
  createDevice: (device: Omit<Device, 'id' | 'is_active'>) => Promise<void>;
  updateDevice: (id: string, device: Partial<Omit<Device, 'id' | 'is_active'>>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;

  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;

  fetchProjects: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<void>;
  updateProjectStatus: (projectId: string, status: Project['status'], note?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  fetchInquiries: () => Promise<void>;
  requestInquiry: (projectId: string, deviceId: string) => Promise<void>;
  approveInquiry: (inquiryId: string) => Promise<void>;
  rejectInquiry: (inquiryId: string) => Promise<void>;

  fetchComments: (projectId: string) => Promise<void>;
  addComment: (projectId: string, body: string, parentId?: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  categories: [],
  devices: [],
  settings: null,
  projects: [],
  comments: [],
  inquiries: [],

  isLoading: false,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          set({ currentUser: profile as User });
          await Promise.all([
            get().fetchCategories(),
            get().fetchDevices(),
            get().fetchSettings(),
            get().fetchProjects(),
            get().fetchUsers(),
            get().fetchInquiries()
          ]);
        }
      }
    } catch (error) {
      console.error('Initialization error:', error);
      set({ error: 'خطا در بارگذاری اطلاعات' });
    }
  },

  login: async (username, password) => {
    try {
      set({ isLoading: true, error: null });

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .maybeSingle();

      if (!profile) {
        set({ error: 'نام کاربری یا رمز عبور اشتباه است', isLoading: false });
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@damon.local`,
        password: password,
      });

      if (error) {
        set({ error: 'نام کاربری یا رمز عبور اشتباه است', isLoading: false });
        return false;
      }

      if (data.user) {
        set({ currentUser: profile as User, isLoading: false });
        await get().initialize();
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      set({ error: 'خطا در ورود', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      currentUser: null,
      users: [],
      categories: [],
      devices: [],
      settings: null,
      projects: [],
      comments: [],
      inquiries: []
    });
  },

  fetchUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ users: data as User[] });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  },

  createUser: async (userData) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${userData.username}@damon.local`,
        password: userData.password || '123456',
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: userData.full_name,
            username: userData.username,
            role: userData.role,
            is_active: true,
          });

        if (profileError) throw profileError;
        await get().fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      set({ error: 'خطا در ایجاد کاربر' });
    }
  },

  deleteUser: async (userId) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin' || userId === currentUser.id) return;

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      await get().fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  },

  fetchCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name');

      if (error) throw error;
      set({ categories: data as Category[] });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  createCategory: async (name, desc) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('categories')
        .insert({ category_name: name, description: desc });

      if (error) throw error;
      await get().fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  },

  updateCategory: async (id, name, desc) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('categories')
        .update({ category_name: name, description: desc })
        .eq('id', id);

      if (error) throw error;
      await get().fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  },

  deleteCategory: async (id) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  },

  fetchDevices: async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('model_name');

      if (error) throw error;
      set({ devices: data as Device[] });
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  },

  createDevice: async (deviceData) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('devices')
        .insert({ ...deviceData, is_active: true });

      if (error) throw error;
      await get().fetchDevices();
    } catch (error) {
      console.error('Error creating device:', error);
    }
  },

  updateDevice: async (id, deviceData) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('devices')
        .update(deviceData)
        .eq('id', id);

      if (error) throw error;
      await get().fetchDevices();
    } catch (error) {
      console.error('Error updating device:', error);
    }
  },

  deleteDevice: async (id) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  },

  fetchSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      set({ settings: data as Settings });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const { currentUser, settings } = get();
      if (currentUser?.role !== 'admin' || !settings) return;

      const { error } = await supabase
        .from('settings')
        .update({ ...newSettings, updated_at: new Date().toISOString() })
        .eq('id', settings.id);

      if (error) throw error;
      await get().fetchSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  },

  fetchProjects: async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ projects: data as Project[] });
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  },

  createProject: async (projectData) => {
    try {
      const { currentUser } = get();
      if (!currentUser) return;

      const { error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          created_by_user_id: currentUser.id,
          status: 'pending_approval',
        });

      if (error) throw error;
      await get().fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      set({ error: 'خطا در ایجاد پروژه' });
    }
  },

  updateProjectStatus: async (projectId, status, note) => {
    try {
      const { currentUser } = get();
      if (!currentUser || (currentUser.role !== 'sales_manager' && currentUser.role !== 'admin')) return;

      const { error } = await supabase
        .from('projects')
        .update({
          status,
          updated_at: new Date().toISOString(),
          approval_decision_by: currentUser.id,
          approval_decision_at: new Date().toISOString(),
          approval_note: note,
        })
        .eq('id', projectId);

      if (error) throw error;

      await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          author_user_id: currentUser.id,
          author_role_snapshot: currentUser.role,
          body: `وضعیت پروژه به «${status}» تغییر یافت.${note ? ` توضیح: ${note}` : ''}`,
        });

      await get().fetchProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  },

  deleteProject: async (projectId) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await get().fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  },

  fetchInquiries: async () => {
    try {
      const { data, error } = await supabase
        .from('project_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ inquiries: data as ProjectInquiry[] });
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  },

  requestInquiry: async (projectId, deviceId) => {
    try {
      const { currentUser, devices, settings, projects } = get();
      if (!currentUser || !settings) return;

      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      if (currentUser.role === 'employee' &&
          project.status !== 'approved' &&
          project.status !== 'in_progress' &&
          project.status !== 'quoted') {
        alert("استعلام فقط برای پروژه‌های تایید شده مجاز است.");
        return;
      }

      const device = devices.find(d => d.id === deviceId);
      if (!device) return;

      const breakdown = calculatePrice(
        device.factory_pricelist_eur,
        device.length_meter,
        device.weight_unit,
        settings
      );

      const { error } = await supabase
        .from('project_inquiries')
        .insert({
          project_id: projectId,
          requested_by_user_id: currentUser.id,
          device_id: device.id,
          category_id: device.category_id,
          quantity: 1,
          status: 'pending',
          sell_price_eur_snapshot: breakdown.FinalSellPrice,
          calculation_breakdown: breakdown,
        });

      if (error) throw error;
      await get().fetchInquiries();
    } catch (error) {
      console.error('Error creating inquiry:', error);
    }
  },

  approveInquiry: async (inquiryId) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('project_inquiries')
        .update({
          status: 'approved',
          admin_decision_at: new Date().toISOString(),
        })
        .eq('id', inquiryId);

      if (error) throw error;
      await get().fetchInquiries();
    } catch (error) {
      console.error('Error approving inquiry:', error);
    }
  },

  rejectInquiry: async (inquiryId) => {
    try {
      const { currentUser } = get();
      if (currentUser?.role !== 'admin') return;

      const { error } = await supabase
        .from('project_inquiries')
        .update({
          status: 'rejected',
          admin_decision_at: new Date().toISOString(),
        })
        .eq('id', inquiryId);

      if (error) throw error;
      await get().fetchInquiries();
    } catch (error) {
      console.error('Error rejecting inquiry:', error);
    }
  },

  fetchComments: async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ comments: data as ProjectComment[] });
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  },

  addComment: async (projectId, body, parentId) => {
    try {
      const { currentUser } = get();
      if (!currentUser) return;

      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          author_user_id: currentUser.id,
          author_role_snapshot: currentUser.role,
          body,
          parent_comment_id: parentId,
        });

      if (error) throw error;
      await get().fetchComments(projectId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  },
}));

export const useProjects = () => {
  const store = useStore();
  const user = store.currentUser;
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'sales_manager') return store.projects;
  return store.projects.filter(p => p.created_by_user_id === user.id);
};

export const useDevices = (): (Device | PublicDevice)[] => {
  const store = useStore();
  const user = store.currentUser;
  if (!user) return [];
  if (user.role === 'admin') return store.devices;

  return store.devices.map(({ factory_pricelist_eur, length_meter, weight_unit, ...rest }) => rest);
};
