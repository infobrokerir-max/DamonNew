import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  USERS, CATEGORIES, DEVICES, SETTINGS, PROJECTS, COMMENTS, INQUIRIES 
} from '../lib/mock-db';
import { 
  User, Project, Device, Settings, ProjectComment, ProjectInquiry, Role, PublicDevice, Category, PriceBreakdown, InquiryStatus 
} from '../lib/types';
import { calculatePrice } from '../lib/pricing';

interface AppState {
  currentUser: User | null;
  users: User[];
  categories: Category[];
  devices: Device[];
  settings: Settings;
  projects: Project[];
  comments: ProjectComment[];
  inquiries: ProjectInquiry[];
  
  // Sync Status
  isSyncing: boolean;
  syncError: string | null;
  
  // Auth
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  // User Management
  createUser: (user: Omit<User, 'id' | 'is_active'>) => void;
  deleteUser: (userId: string) => void;

  // Category Management
  createCategory: (name: string, desc?: string) => void;
  updateCategory: (id: string, name: string, desc?: string) => void;
  deleteCategory: (id: string) => void;

  // Device Management
  createDevice: (device: Omit<Device, 'id' | 'is_active'>) => void;
  updateDevice: (id: string, device: Partial<Omit<Device, 'id' | 'is_active'>>) => void;
  deleteDevice: (id: string) => void;

  // Project Actions
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'status'>) => void;
  updateProjectStatus: (projectId: string, status: Project['status'], note?: string) => void;
  deleteProject: (projectId: string) => void;
  
  // Inquiry Actions
  requestInquiry: (projectId: string, deviceId: string) => void;
  approveInquiry: (inquiryId: string) => void;
  rejectInquiry: (inquiryId: string) => void;
  
  // Comment Actions
  addComment: (projectId: string, body: string, parentId?: string) => void;
  
  // Admin Actions
  updateSettings: (newSettings: Partial<Settings>) => void;
  
  // Google Sheets Sync
  syncWithGoogleSheets: () => Promise<void>;
}

// Helper to send data to Google Sheets (Fire and Forget or Await)
const syncAction = async (action: string, payload: any, state: AppState) => {
  const url = state.settings.google_script_url;
  if (!url) return;

  try {
    // We use no-cors mode usually for Google Scripts if we don't need response, 
    // but here we want to ensure it's saved.
    // Note: Google Apps Script Web App must be deployed as "Anyone" for this to work from browser without OAuth.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
  } catch (e) {
    console.error("Google Sync Error:", e);
  }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: USERS,
      categories: CATEGORIES,
      devices: DEVICES,
      settings: SETTINGS,
      projects: PROJECTS,
      comments: COMMENTS,
      inquiries: INQUIRIES,
      
      isSyncing: false,
      syncError: null,

      login: (username, password) => {
        const user = get().users.find(u => u.username === username && u.password === password);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => set({ currentUser: null }),

      createUser: (userData) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;

        const newUser: User = {
          id: `u-${Date.now()}`,
          is_active: true,
          ...userData
        };
        set(state => ({ users: [...state.users, newUser] }));
        syncAction('create_user', newUser, get());
      },

      deleteUser: (userId) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;
        if (userId === currentUser.id) return;
        set(state => ({ users: state.users.filter(u => u.id !== userId) }));
        syncAction('delete_user', { id: userId }, get());
      },

      // --- Category Management ---
      createCategory: (name, desc) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;
        const newCat: Category = { id: `c-${Date.now()}`, category_name: name, description: desc };
        set(state => ({ categories: [...state.categories, newCat] }));
        syncAction('create_category', newCat, get());
      },

      updateCategory: (id, name, desc) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;
        const updated = { id, category_name: name, description: desc };
        set(state => ({
          categories: state.categories.map(c => 
            c.id === id ? { ...c, ...updated } : c
          )
        }));
        syncAction('update_category', updated, get());
      },

      deleteCategory: (id) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;
        set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
        syncAction('delete_category', { id }, get());
      },

      // --- Device Management ---
      createDevice: (deviceData) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;
        const newDevice: Device = { id: `d-${Date.now()}`, is_active: true, ...deviceData };
        set(state => ({ devices: [...state.devices, newDevice] }));
        syncAction('create_device', newDevice, get());
      },

      updateDevice: (id, deviceData) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;
        set(state => ({
          devices: state.devices.map(d => 
            d.id === id ? { ...d, ...deviceData } : d
          )
        }));
        syncAction('update_device', { id, ...deviceData }, get());
      },

      deleteDevice: (id) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;
        set(state => ({ devices: state.devices.filter(d => d.id !== id) }));
        syncAction('delete_device', { id }, get());
      },

      createProject: (projectData) => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        const newProject: Project = {
          id: `p-${Date.now()}`,
          created_by_user_id: currentUser.id,
          status: 'pending_approval',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...projectData,
        };
        set(state => ({ projects: [newProject, ...state.projects] }));
        syncAction('create_project', newProject, get());
      },

      updateProjectStatus: (projectId, status, note) => {
        const { currentUser } = get();
        if (!currentUser || (currentUser.role !== 'sales_manager' && currentUser.role !== 'admin')) return;

        const updateData = { 
          status, 
          updated_at: new Date().toISOString(),
          approval_decision_by: currentUser.id,
          approval_decision_at: new Date().toISOString(),
          approval_note: note 
        };

        set(state => ({
          projects: state.projects.map(p => 
            p.id === projectId ? { ...p, ...updateData } : p
          ),
          comments: [...state.comments, {
            id: `cm-sys-${Date.now()}`,
            project_id: projectId,
            author_user_id: currentUser.id,
            author_role_snapshot: currentUser.role,
            body: `وضعیت پروژه به «${status}» تغییر یافت.${note ? ` توضیح: ${note}` : ''}`,
            created_at: new Date().toISOString()
          }]
        }));
        
        syncAction('update_project_status', { id: projectId, ...updateData }, get());
      },

      deleteProject: (projectId) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;

        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          // Cleanup related data
          comments: state.comments.filter(c => c.project_id !== projectId),
          inquiries: state.inquiries.filter(i => i.project_id !== projectId)
        }));
        syncAction('delete_project', { id: projectId }, get());
      },

      requestInquiry: (projectId, deviceId) => {
        const { currentUser, devices, settings, projects } = get();
        if (!currentUser) return;

        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        
        if (currentUser.role === 'employee' && project.status !== 'approved' && project.status !== 'in_progress' && project.status !== 'quoted') {
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

        const newInquiry: ProjectInquiry = {
          id: `inq-${Date.now()}`,
          project_id: projectId,
          requested_by_user_id: currentUser.id,
          device_id: device.id,
          category_id: device.category_id,
          quantity: 1,
          status: 'pending',
          sell_price_eur_snapshot: breakdown.FinalSellPrice,
          calculation_breakdown: breakdown,
          created_at: new Date().toISOString(),
        };

        set(state => ({ inquiries: [newInquiry, ...state.inquiries] }));
        syncAction('create_inquiry', newInquiry, get());
      },

      approveInquiry: (inquiryId) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;

        const updateData = { status: 'approved' as InquiryStatus, admin_decision_at: new Date().toISOString() };

        set(state => ({
          inquiries: state.inquiries.map(i => 
            i.id === inquiryId ? { ...i, ...updateData } : i
          )
        }));
        syncAction('update_inquiry_status', { id: inquiryId, ...updateData }, get());
      },

      rejectInquiry: (inquiryId) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;

        const updateData = { status: 'rejected' as InquiryStatus, admin_decision_at: new Date().toISOString() };

        set(state => ({
          inquiries: state.inquiries.map(i => 
            i.id === inquiryId ? { ...i, ...updateData } : i
          )
        }));
        syncAction('update_inquiry_status', { id: inquiryId, ...updateData }, get());
      },

      addComment: (projectId, body, parentId) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const newComment: ProjectComment = {
          id: `cm-${Date.now()}`,
          project_id: projectId,
          author_user_id: currentUser.id,
          author_role_snapshot: currentUser.role,
          body,
          parent_comment_id: parentId,
          created_at: new Date().toISOString(),
        };
        set(state => ({ comments: [...state.comments, newComment] }));
        syncAction('create_comment', newComment, get());
      },

      updateSettings: (newSettings) => {
        const { currentUser } = get();
        if (currentUser?.role !== 'admin') return;
        set(state => ({ settings: { ...state.settings, ...newSettings } }));
        // Note: We don't typically sync settings to a table row in this simple model, 
        // but we could if we had a 'Settings' sheet.
      },

      syncWithGoogleSheets: async () => {
        const { settings } = get();
        if (!settings.google_script_url) {
          set({ syncError: 'آدرس اسکریپت گوگل وارد نشده است.' });
          return;
        }

        set({ isSyncing: true, syncError: null });

        try {
          const response = await fetch(settings.google_script_url);
          if (!response.ok) throw new Error('Network response was not ok');
          
          const data = await response.json();
          
          // Merge strategy: Server overwrites local for simplicity in this prototype
          // In a real app, you'd want smarter merging.
          if (data.users) set({ users: data.users });
          if (data.projects) set({ projects: data.projects });
          if (data.inquiries) set({ inquiries: data.inquiries });
          if (data.devices) set({ devices: data.devices });
          if (data.categories) set({ categories: data.categories });
          if (data.comments) set({ comments: data.comments });
          
          set({ 
            isSyncing: false, 
            settings: { ...settings, last_sync_at: new Date().toISOString() } 
          });
          
        } catch (error) {
          console.error('Sync failed:', error);
          set({ isSyncing: false, syncError: 'خطا در ارتباط با گوگل شیت. لطفا آدرس را بررسی کنید.' });
        }
      }
    }),
    {
      name: 'damon-service-storage-v3', // Updated to v3 to force reload of new defaults
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        projects: state.projects,
        comments: state.comments,
        inquiries: state.inquiries,
        settings: state.settings,
        users: state.users,
        categories: state.categories,
        devices: state.devices
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

export const useDevices = (): (Device | PublicDevice)[] => {
  const store = useStore();
  const user = store.currentUser;
  if (!user) return [];
  if (user.role === 'admin') return store.devices;
  
  // For both 'employee' and 'sales_manager', we hide confidential fields (P, L, W)
  // This ensures Sales Manager also cannot see Factory Price (P)
  return store.devices.map(({ factory_pricelist_eur, length_meter, weight_unit, ...rest }) => rest);
};
