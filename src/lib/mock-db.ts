import { User, Category, Device, Settings, Project, ProjectComment, ProjectInquiry } from './types';

// --- SEED DATA ---

export const USERS: User[] = [
  { id: 'u-admin', full_name: 'مدیر سیستم', username: 'admin', password: 'sasan', role: 'admin', is_active: true },
  { id: 'u-sales', full_name: 'مدیر فروش', username: 'sales', password: '123', role: 'sales_manager', is_active: true },
  { id: 'u-emp1', full_name: 'کارمند یک', username: 'emp1', password: '123', role: 'employee', is_active: true },
  { id: 'u-emp2', full_name: 'کارمند دو', username: 'emp2', password: '123', role: 'employee', is_active: true },
];

export const CATEGORIES: Category[] = [
  { id: 'c-1', category_name: 'چیلر تراکمی' },
  { id: 'c-2', category_name: 'VRF' },
  { id: 'c-3', category_name: 'هواساز' },
];

export const DEVICES: Device[] = [
  // Chiller
  { id: 'd-1', model_name: 'CH-2000-X', category_id: 'c-1', factory_pricelist_eur: 50000, length_meter: 4.5, weight_unit: 2000, is_active: true },
  { id: 'd-2', model_name: 'CH-4000-Pro', category_id: 'c-1', factory_pricelist_eur: 85000, length_meter: 6.2, weight_unit: 3500, is_active: true },
  // VRF
  { id: 'd-3', model_name: 'VRF-Outdoor-12HP', category_id: 'c-2', factory_pricelist_eur: 12000, length_meter: 1.2, weight_unit: 400, is_active: true },
  { id: 'd-4', model_name: 'VRF-Indoor-Cassette', category_id: 'c-2', factory_pricelist_eur: 800, length_meter: 0.8, weight_unit: 40, is_active: true },
  // AHU
  { id: 'd-5', model_name: 'AHU-10000-CFM', category_id: 'c-3', factory_pricelist_eur: 15000, length_meter: 3.0, weight_unit: 1200, is_active: true },
  { id: 'd-6', model_name: 'AHU-25000-CFM', category_id: 'c-3', factory_pricelist_eur: 28000, length_meter: 5.5, weight_unit: 2100, is_active: true },
];

export const SETTINGS: Settings = {
  id: 's-v1',
  is_active: true,
  discount_multiplier: 0.38,
  freight_rate_per_meter_eur: 1000,
  customs_numerator: 350000,
  customs_denominator: 150000,
  warranty_rate: 0.05,
  commission_factor: 0.95,
  office_factor: 0.95,
  profit_factor: 0.65,
  rounding_mode: 'ceil',
  rounding_step: 10,
  exchange_rate_irr_per_eur: 65000, // Example rate
  google_script_url: 'https://script.google.com/macros/s/AKfycbyWeH17Ut3BQEvbdLB13e7WerluTExLqZOut1XgFjlCS4W4d06dfwCP1y2lTos9hUy7/exec'
};

export const PROJECTS: Project[] = [
  {
    id: 'p-1',
    created_by_user_id: 'u-emp1',
    project_name: 'برج مسکونی فرمانیه',
    employer_name: 'آقای رضایی',
    project_type: 'مسکونی',
    address_text: 'تهران، فرمانیه، خیابان لواسانی',
    tehran_lat: 35.7995,
    tehran_lng: 51.4589,
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    approval_decision_by: 'u-sales',
    approval_decision_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'p-2',
    created_by_user_id: 'u-emp2',
    project_name: 'مجتمع اداری ونک',
    employer_name: 'شرکت توسعه',
    project_type: 'اداری',
    address_text: 'تهران، میدان ونک، خیابان ملاصدرا',
    tehran_lat: 35.7595,
    tehran_lng: 51.4189,
    status: 'pending_approval',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  }
];

export const COMMENTS: ProjectComment[] = [
  {
    id: 'cm-1',
    project_id: 'p-1',
    author_user_id: 'u-sales',
    author_role_snapshot: 'sales_manager',
    body: 'پروژه تایید شد. لطفاً استعلام اولیه برای چیلرها گرفته شود.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

export const INQUIRIES: ProjectInquiry[] = [
  {
    id: 'inq-1',
    project_id: 'p-1',
    requested_by_user_id: 'u-emp1',
    device_id: 'd-1',
    category_id: 'c-1',
    quantity: 1,
    sell_price_eur_snapshot: 35420, // Example pre-calculated
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  }
];
