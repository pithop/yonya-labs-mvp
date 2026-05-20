export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  stripe_account_id: string | null;
  printer_uid: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number; // centimes
  is_available: boolean;
  image_url: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_type: 'CLICK_COLLECT' | 'DELIVERY';
  delivery_address: string | null;
  total_amount: number;
  delivery_fee: number;
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'FAILED';
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  price: number;
  options: Record<string, any>;
  created_at: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options: Record<string, any>;
}
