export type User = {
  id: string;
  username: string;
  phone: string;
  email: string | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
  role?: string; // Added for admin panel functionality
  is_active?: boolean; // Added for admin panel functionality
};

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  classification: string;
  mileage: number;
  transmission: string;
  fuel_type: string;
  images: string[];
  seller_id: string;
  seller_name: string | null;
  seller_rating: number | null;
  specifications: Record<string, any>;
  features: string[];
  seller_notes: string | null;
  body_type: string | null;
  color: string | null;
  date_added: string;
  status: string;
};

export type RentalCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  daily_rate: number;
  weekly_rate: number | null;
  monthly_rate: number | null;
  transmission: string;
  fuel_type: string;
  images: string[];
  specifications: Record<string, any>;
  features: string[];
  availability_status: string;
  security_deposit: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  images: string[];
  specifications: Record<string, any>;
  compatibility: Record<string, any>;
  warranty_details: string | null;
  stock_status: string;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  delivery_method: string;
  shipping_address: Record<string, any> | null;
  payment_method: string;
  order_status: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  installation_service: boolean;
  installation_price: number;
  product?: Product;
};

export type Appointment = {
  id: string;
  car_id: string;
  seller_id: string;
  buyer_id: string;
  date: string;
  time_slot: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Inquiry = {
  id: string;
  car_id: string;
  seller_id: string;
  buyer_id: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  car_reference: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
};

export type RentalBooking = {
  id: string;
  car_id: string;
  user_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  total_price: number;
  additional_services: Record<string, any> | null;
  insurance_option: string | null;
  payment_method: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  total_users: number;
  total_listings: number;
  total_orders: number;
  total_revenue: number;
  active_rentals: number;
  pending_inquiries: number;
  user_growth: {
    date: string;
    count: number;
  }[];
  revenue_data: {
    date: string;
    amount: number;
  }[];
  listing_status: {
    status: string;
    count: number;
  }[];
};