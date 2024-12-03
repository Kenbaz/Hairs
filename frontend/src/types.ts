export interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
}


export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}


export interface LoginCredentials {
    email: string;
    password: string;
}


export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}


export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}


export interface RootState {
    auth: AuthState;
}


// Admin dashboard overview and notification types

export interface AdminNotification {
    id: string;
    type: 'order' | 'inventory';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    link?: string;
    reference_id?: number;
}


export interface NotificationState {
    notifications: AdminNotification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}


export interface DashboardStats {
    // Basic stats
    total_orders: number;
    recent_orders: number;
    total_revenue: number;
    total_customers: number;
    low_stock_products: number;
    monthly_sales: number;

    // Order stats
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    cancelled_orders: number;

    // Product stats
    total_products: number;
    out_of_stock_products: number;
    featured_products: number;

    // Customer stats
    active_customers: number;
    new_customers_this_month: number;

    // Review stats
    total_reviews: number;
    average_rating: number;

    // Sales stats
    average_order_value: number;
    sales_growth: number;
}


export interface SalesAnalytics {
    period: string;
    data: Array<{
        period: string;
        total_sales: number;
        order_count: number;
    }>;
    total_sales: number;
    order_count: number;
    average_order_value: number;
}


export interface RecentOrder {
    id: number;
    created_at: string;
    customer_name: string;
    total_amount: number;
    order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: boolean;
    items_count: number;
}


export interface OrdersResponse {
    total: number;
    orders: RecentOrder[];
}


export interface LowStockProduct {
    id: number;
    name: string;
    stock: number;
    low_stock_threshold: number;
    category: string;
    price: number;
    image?: string;
}


export interface LowStockResponse {
    total: number;
    products: LowStockProduct[];
}


export interface RevenueData {
    period: string;
    total_sales: number;
    order_count: number;
}


export interface RevenueAnalytics {
    period: 'daily' | 'monthly';
    data: RevenueData[];
    total_sales: number;
    order_count: number;
    average_order_value: number;
}


export interface TopProduct {
    id: number;
    name: string;
    total_sold: number;
    revenue: number;
    stock: number;
    image?: string;
    growth_rate: number;
}


export interface ProductAnalytics {
    best_sellers: TopProduct[];
    category_distribution: Record<string, number>;
    revenue_by_category: Record<string, number>;
}

// Admin dashboard overview and notification types ends


// Admin dashboard product section types
export interface AdminProduct {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: {
        id: number;
        name: string;
        slug: string;
    };
    price: number;
    discount_price?: number;
    hair_type: string | null;
    length: number | null;
    care_instructions: string;
    is_featured: boolean;
    is_available: boolean;
    images: ProductImage[];
    created_at: string;
    updated_at: string;
    stock: number;
    low_stock_threshold: number;
    revenue_generated: number
}


export interface ProductImage {
    id: number;
    image: string;
    is_primary: boolean;
}


export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";


export interface ProductFilters {
    search?: string;
    category?: string;
    stock_status?: StockStatus;
    min_price?: number;
    max_price?: number;
    is_featured?: boolean;
    ordering?: string;
    page?: number;
    page_size?: number;
}


export interface ProductResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: AdminProduct[];
}


export interface ProductFormData {
    name: string;
    description: string;
    category_id: number;
    hair_type?: string;
    length?: number;
    price: number;
    discount_price?: number;
    stock: number;
    care_instructions?: string;
    is_featured?: boolean;
    is_available?: boolean;
    low_stock_threshold?: number;
    images?: File[];
}