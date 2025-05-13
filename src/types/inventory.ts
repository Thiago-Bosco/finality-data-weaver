
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
