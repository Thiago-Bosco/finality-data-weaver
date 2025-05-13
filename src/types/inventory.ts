export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  description: string;
  supplier: string;
  lastUpdated: string;
  imageUrl: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalCategories: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  model: string;
  category: string;
  status: string;
  specifications?: any;
  purchase_date?: string;
  warranty_expiry?: string;
  location_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Movement {
  id: string;
  equipment_id: string;
  from_location_id?: string | null;
  to_location_id?: string | null;
  moved_by_user_id?: string | null;
  reason?: string | null;
  notes?: string | null;
  moved_at: string;
  created_at: string;
  equipment: {
    name: string;
    serial_number: string;
  };
  from_location: {
    name: string;
  } | null;
  to_location: {
    name: string;
  } | null;
}

export interface Maintenance {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  description?: string | null;
  performed_by: string;
  maintenance_date: string;
  next_maintenance_date?: string | null;
  created_at: string;
  updated_at: string;
}
