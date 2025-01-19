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
  url: string;
  public_id: string;
  is_primary: boolean;
}


export interface Category {
  id: number;
  name: string;
  slug: string;
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
    page: number;
    page_size: number;
}


export interface ProductResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: AdminProduct[];
}


export interface BulkOperationResponse { 
    message: string;
    deleted_count?: number;
    error?: string;
    products?: AdminProduct[];
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


// Currency types
export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_active: boolean;
  last_updated?: string;
}

export interface CreateCurrencyData {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_active?: boolean;
}

export interface UpdateCurrencyData {
  name?: string;
  symbol?: string;
  exchange_rate?: number;
  is_active?: boolean;
}

export interface CurrencyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Currency[];
}

export interface CurrencyConversion {
    amount: number;
    formatted: string;
    currency: string;
}

export interface UpdateCurrencyData {
  name?: string;
  symbol?: string;
  exchange_rate?: number;
  is_active?: boolean;
}

export interface CurrencyState { 
    currencies: Currency[];
    currentCurrency: Currency | null;
    isLoading: boolean;
    error: string | null;
}


// Order Types
export interface OrderItem {
  id: number;
  product_name: string;
  product_image?: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  product: number;
}

export interface AdminOrder {
    id: number;
    customer_name: string;
    customer_email: string;
    shipping_address: string;
    total_amount: number;
    tracking_number?: string;
    order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: boolean;
    cancelled_at?: string;
    refund_status: OrderRefund['status'];
    refund_amount: number;
    items_count: number;
    created_at: string;
    updated_at: string;
    history: OrderHistory[];
    items: OrderItem[];
}

export interface OrderRefund {
    status: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
    amount: number;
}

export interface OrderStatus {
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  timestamp: string;
  notes?: string;
  updated_by?: string;
}

export interface OrderHistory {
    id: number;
    status: string;
    notes: string;
    created_at: string;
    created_by: string;
}

export interface OrderResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: AdminOrder[];
}

export interface OrderFilters {
    page?: number;
    page_size?: number;
    status?: string;
    payment_status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
}


// Return types
export interface ReturnItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  reason: string;
  condition: "unopened" | "opened" | "damaged";
  images: { id: number; image: string }[];
}

export interface ReturnHistory {
  id: number;
  status: string;
  notes: string;
  created_at: string;
  created_by_name: string;
}

export interface ReturnRequest {
  id: number;
  order_number: string;
  customer_name: string;
  reason: string;
  return_status: "pending" | "approved" | "received" | "rejected" | "completed";
  refund_status: "pending" | "processing" | "completed" | "failed";
  refund_amount?: number;
  items_received: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  items: ReturnItem[];
  history: ReturnHistory[];
}

export interface ReturnFiltersType {
  status?: string;
  refund_status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ReturnResponse {
  count: number;
  results: ReturnRequest[];
}

export interface ReturnRequestForm {
  order_id: number;
  reason: string;
  items: {
    product_id: number;
    quantity: number;
    reason: string;
    condition: "unopened" | "opened" | "damaged";
  }[];
  images?: File[];
}

export interface OrderItemForReturn {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface EligibleOrder {
  id: number;
  order_date: string;
  total_amount: number;
  items: OrderItemForReturn[];
}

export interface ReturnFormResponse {
  id: number;
  order_number: string;
  return_status: string;
  created_at: string;
}

// Return Policy Types

export interface ReturnPolicy {
  return_window_days: number;
  requires_receipt: boolean;
  allow_partial_returns: boolean;
  restocking_fee_percentage: number;
  free_returns: boolean;
  shipping_paid_by: "customer" | "store";
  return_instructions: string;
}

export interface ProductReturnPolicy {
  id: number;
  product: number;
  product_name: string;
  is_returnable: boolean;
  return_window_days: number | null;
  restocking_fee_percentage: number | null;
  special_instructions: string;
  global_policy: {
    return_window_days: number;
    restocking_fee_percentage: number;
    free_returns: boolean;
    shipping_paid_by: "customer" | "store";
  };
}

export interface EffectivePolicy {
  is_returnable: boolean;
  return_window_days: number;
  restocking_fee_percentage: number;
  free_returns: boolean;
  shipping_paid_by: "customer" | "store";
  instructions: string;
}

export interface CreateProductPolicyData {
  product: number;
  is_returnable: boolean;
  return_window_days?: number | null;
  restocking_fee_percentage?: number | null;
  special_instructions?: string;
}

export interface PolicyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReturnPolicy[];
}

// Admin User types
export interface AdminUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active: boolean;
  verified_email: boolean;
  date_joined: string;
  last_login: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date?: string;
  address: string;
}

export interface UserFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  verified_email?: boolean;
  joined_after?: string;
}

export interface UserResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

export interface PurchaseHistory {
  total_orders: number;
  total_spent: number;
  orders: AdminOrder[];
}

// Customer support email types
export interface EmailItem {
  id: number;
  subject: string;
  body: string;
  from_email: string;
  to_email: string;
  status: "draft" | "sent" | "read" | "delivered" | "failed";
  priority: "high" | "medium" | "low";
  customer_name: string;
  customer_email: string;
  created_at: string;
  sent_at: string | null;
  thread_id?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: EmailItem[];
}

export interface EmailFilters {
  status?: string;
  priority?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface EmailMetrics {
  opened_at: string | null;
  opened_count: number;
  response_time: string | null;
  bounced: boolean;
  bounce_reason: string;
}

export interface UploadedFile extends File {
  preview?: string;
  id?: string;
}

export interface EmailAttachment {
  id: number;
  filename: string;
  file: string;
}

export interface SendEmailData {
  to_email: string;
  from_email: string;
  subject: string;
  body: string;
  attachments?: UploadedFile[];
}

export interface BulkEmailData {
  subject: string;
  body: string;
  customer_ids: number[];
  attachments?: UploadedFile[];
}

export interface BulkEmailResponse {
  successful_sends: number;
  failed_sends: number;
  total_customers: number;
}

export interface SelectedCustomers {
  [key: number]: boolean;
}

// Analytics Types
export interface RevenueSummary {
  total_revenue: number;
  average_order_value: number;
  revenue_growth: number;
}

export interface SalesSummary {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  total_customers: number;
}

export interface SalesComparison {
  previous_period: number;
  current_period: number;
  growth_rate: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  orders: number;
  average_order_value: number;
}

export interface RevenueSummary {
  total_revenue: number;
  average_order_value: number;
}

export interface RevenueTrendDataPoint {
  period: string;
  revenue: number;
}

export interface RevenueAnalyticsResponse {
  summary: RevenueSummary;
  by_category: CategoryRevenue[];
  trend_data: RevenueTrendDataPoint[];
}

export interface SalesOverviewResponse {
  period: string;
  summary: {
    total_sales: number;
    total_orders: number;
    total_customers: number;
    average_order_value: number;
  };
  trend_data: SalesAnalyticsTrendData[];
  comparison: {
    previous_period: number;
    current_period: number;
    growth_rate: number;
  };
  date_range: {
    start: string;
    end: string;
  };
}

export interface SalesAnalyticsTrendData {
  period: string;
  total_sales: number;
  order_count: number;
  unique_customers: number;
  average_order: number;
}

export interface SalesAnalyticsResponse {
  period: "daily" | "monthly";
  summary: SalesSummary;
  trend_data: SalesAnalyticsTrendData[];
  comparison: SalesComparison;
  date_range: {
    start: string;
    end: string;
  };
}

export interface AnalyticsParams {
  period?: "daily" | "monthly";
  days?: number;
  start_date?: string;
  end_date?: string;
}

// Refund Analytics Types
export interface RefundTransaction {
    id: number;
    order_id: number;
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    created_at: string;
    processed_at: string | null;
    return_request_id: number | null;
}

export interface RefundSummary {
    total_refunds: number;
    total_amount: number;
    average_refund_amount: number;
    refund_rate: number;
    processing_time_avg: number;
}

export interface RefundReasonBreakdown {
    reason: string;
    count: number;
    total_amount: number;
    percentage: number;
}

export interface RefundReport {
    summary: RefundSummary;
    transactions: RefundTransaction[];
    reason_breakdown: RefundReasonBreakdown[];
    date_range: {
        start: string;
        end: string;
    };
}

export interface AnalyticsFilters {
    startDate?: string;
    endDate?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    pageSize?: number;
}

// Flash Sale Types
export interface FlashSaleProducts {
  id: number;
  product: number;
  product_name: string;
  discounted_price: number;
  original_price: number;
  quantity_limit?: number;
  quantity_sold: number;
  stock: number;
}

export interface FlashSaleResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FlashSale[];
}

export interface FlashSale {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  status: "scheduled" | "active" | "ended" | "cancelled";
  max_quantity_per_customer: number;
  total_quantity_limit?: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  products: FlashSaleProducts[];
}

export interface FlashSaleStats {
  metrics: {
    total_products: number;
    total_sold: number;
    total_revenue: number;
    products_sold_out: number;
    total_customers: number;
    remaining_quantity?: number;
  };
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
    quantity_limit: number;
  }>;
  status: FlashSale["status"];
  time_remaining?: number;
}

export interface FlashSaleFilters {
  status?: string;
  is_visible?: boolean;
  start_time_after?: string;
  start_time_before?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface CustomerPurchase {
  customer_name: string;
  customer_email: string;
  product_name: string;
  quantity: number;
  price_paid: number;
  purchase_date: string;
}

export interface AvailableProduct {
  id: number;
  name: string; // Changed from product_name
  price: number; // Changed from original_price
  stock: number;
}

// Payment types
export interface PaymentError {
  type:
    | "TIMEOUT"
    | "NETWORK"
    | "VALIDATION"
    | "RETRY_LIMIT"
    | "RATE_LIMIT"
    | "INVALID_AMOUNT";
  message: string;
}

export interface PaymentState {
  isLoading: boolean;
  error: PaymentError | null;
  paymentUrl: string | null;
  paymentReference: string | null;
  paymentStatus: "idle" | "pending" | "success" | "failed";
  retryCount: number;
  lastAttempt: Date | null;
  timeoutId: NodeJS.Timeout | null;
}

export interface InitializePaymentData {
  order_id: number;
  payment_currency: string;
  payment_method?: string;
  email: string;
  callback_url: string;
}

export interface PaymentContextType extends PaymentState {
  initializePayment: (data: InitializePaymentData) => Promise<void>;
  verifyPayment: (reference: string) => Promise<void>;
  resetPayment: () => void;
}

export interface PaymentResponse {
  authorization_url: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  payment: {
    id: number;
    reference: string;
    status: string;
    amount: number;
    payment_method: string;
    created_at: string;
  };
}

export interface PaymentMethodResponse {
  methods: {
    id: string;
    name: string;
    supported: boolean;
  }[];
}

// Payment Admin Types
export interface PaymentTransactionTypeForAdmin {
    id: number;
    payment_reference: string;
    provider_reference: string;
    transaction_type: string;
    status: string;
    amount: number;
    customer_email: string;
    response_message: string;
    created_by_name: string | null;
    created_at: string;
}

export interface TransactionResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PaymentTransactionTypeForAdmin[];
}

export interface TransactionFilters {
    transaction_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    payment_reference?: string;
    page?: number;
    page_size?: number;
}

export interface PaymentFilters {
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
    status?: string;
    payment_method?: string;
    payment_currency?: string;
    search?: string;
    page?: number;
    page_size?: number;
}

export interface ReconciliationSummary {
    total_payments: number;
    successful_payments: number;
    success_rate: number;
    total_amount: number;
    average_amount: number;
    average_processing_time: string | null;
}

export interface DailyTransaction {
    date: string;
    count: number;
    total_amount: number;
    successful: number;
    failed: number;
}

export interface CurrencyDistribution {
    payment_currency: string;
    count: number;
    total_amount: number;
}

export interface PaymentMethodStats {
    payment_method: string;
    count: number;
    total_amount: number;
    success_count: number;
}

export interface ReconciliationData {
    summary: ReconciliationSummary;
    daily_transactions: DailyTransaction[];
    currency_distribution: CurrencyDistribution[];
    payment_methods: PaymentMethodStats[];
    date_range: {
        start: string;
        end: string;
    };
}

export interface PaymentTypeForAdmin {
    id: number;
    order_id: number;
    reference: string;
    provider_reference: string | null;
    amount: number;
    original_amount: number;
    payment_currency: string;
    base_currency: string;
    exchange_rate: number;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';
    payment_method: string;
    error_message?: string | null;
    paid_at?: string | null;
    expires_at: string;
    created_at: string;
    updated_at: string;
    customer_email: string;
    customer_name: string;
}

export interface PaymentResponseTypeForAdmin {
    count: number;
    next: string | null;
    previous: string | null;
    results: PaymentTypeForAdmin[];
}

export interface PaymentStatsTypeForAdmin {
    total_payments: number;
    total_amount: number;
    successful_payments: number;
    failed_payments: number;
    pending_payments: number;
    success_rate: number;
}