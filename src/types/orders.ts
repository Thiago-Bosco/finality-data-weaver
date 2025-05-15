
export interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  total_amount: number | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    product: {
      name: string;
      sku: string;
    };
  })[];
}

export interface OrderSummary {
  total: number;
  pending: number;
  itemsSold: number;
}
