export type Role = 'admin' | 'sales_manager' | 'employee';

export type User = {
  id: string;
  full_name: string;
  username: string;
  password?: string;
  role: Role;
  is_active: boolean;
};

export type Category = {
  id: string;
  category_name: string;
  description?: string;
};

export type Device = {
  id: string;
  model_name: string;
  category_id: string;
  // Confidential fields (only visible to Admin/System)
  factory_pricelist_eur: number; // P
  length_meter: number;          // L
  weight_unit: number;           // W
  is_active: boolean;
};

// Public version of Device for Employee
export type PublicDevice = Omit<Device, 'factory_pricelist_eur' | 'length_meter' | 'weight_unit'>;

export type Settings = {
  id: string;
  is_active: boolean;
  discount_multiplier: number;        // D
  freight_rate_per_meter_eur: number; // F
  customs_numerator: number;          // CN
  customs_denominator: number;        // CD
  warranty_rate: number;              // WR
  commission_factor: number;          // COM
  office_factor: number;              // OFF
  profit_factor: number;              // PF
  rounding_mode: 'none' | 'round' | 'ceil';
  rounding_step: number;
  exchange_rate_irr_per_eur: number;
  
  // Google Sheets Integration
  google_script_url?: string;
  last_sync_at?: string;
};

export type ProjectStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'in_progress' 
  | 'quoted' 
  | 'won' 
  | 'lost' 
  | 'on_hold';

export type Project = {
  id: string;
  created_by_user_id: string;
  assigned_sales_manager_id?: string;
  project_name: string;
  employer_name: string;
  project_type: string;
  address_text: string;
  tehran_lat: number;
  tehran_lng: number;
  additional_info?: string;
  status: ProjectStatus;
  approval_decision_by?: string;
  approval_decision_at?: string;
  approval_note?: string;
  created_at: string;
  updated_at: string;
};

export type ProjectComment = {
  id: string;
  project_id: string;
  author_user_id: string;
  author_role_snapshot: Role;
  body: string;
  parent_comment_id?: string;
  created_at: string;
};

// Detailed breakdown of how price was calculated
export type PriceBreakdown = {
  P: number;   // Factory Price
  L: number;   // Length
  W: number;   // Weight
  D: number;   // Discount Multiplier
  F: number;   // Freight Rate
  CN: number;  // Customs Numerator
  CD: number;  // Customs Denominator
  WR: number;  // Warranty Rate
  COM: number; // Commission Factor
  OFF: number; // Office Factor
  PF: number;  // Profit Factor
  
  // Intermediate Values
  CompanyPriceEUR: number;
  ShipmentEUR: number;
  CustomEUR: number;
  WarrantyEUR: number;
  SubtotalEUR: number;
  AfterCommission: number;
  AfterOffice: number;
  FinalSellPrice: number;
};

export type InquiryStatus = 'pending' | 'approved' | 'rejected';

export type ProjectInquiry = {
  id: string;
  project_id: string;
  requested_by_user_id: string;
  device_id: string;
  category_id: string;
  quantity: number;
  
  // Status
  status: InquiryStatus;
  admin_decision_at?: string;
  
  // Snapshots
  sell_price_eur_snapshot: number;
  sell_price_irr_snapshot?: number;
  calculation_breakdown: PriceBreakdown; // For Admin verification
  
  created_at: string;
  
  // For UI convenience
  _device_model?: string;
  _category_name?: string;
  _requester_name?: string;
};
