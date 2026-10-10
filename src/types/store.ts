export type CategoryId =
  | 'laptops'
  | 'phones'
  | 'desktops'
  | 'monitors'
  | 'printers'
  | 'tablets'
  | 'accessories'
  | 'networking'
  | 'storage'
  | 'gaming';

export type ProductCondition = 'New' | 'Refurbished' | 'Used';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  shortLabel: string;
  tagline: string;
  editorialHeadline: string;
  description: string;
  image: string;
  startingPrice: number;
}

export interface ProductSpecifications {
  processor?: string;
  ram?: string;
  storage?: string;
  screenSize?: string;
  color?: string;
  os?: string;
  graphics?: string;
  connectivity?: string;
  ports?: string;
  battery?: string;
  dimensions?: string;
  weight?: string;
  warranty: string;
  [key: string]: string | undefined;
}

export interface ProductVariationOption {
  id: string;
  label: string; // e.g., "1TB NVMe SSD", "32GB Unified", "Space Black", "16.2-inch"
  priceDelta: number; // e.g., 0, +15000, +30000 in KSh
  inStock: boolean;
}

export interface ProductVariationGroup {
  id: string;
  name: string; // e.g., "Storage", "RAM", "Color", "Screen Size", "Processor"
  options: ProductVariationOption[];
}

export interface ProductReview {
  id: string;
  author: string;
  role: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: CategoryId;
  price: number;
  salePrice?: number;
  stock: number;
  condition: ProductCondition;
  shortSpec: string;
  shortDescription: string;
  description: string;
  images: string[];
  specs: ProductSpecifications;
  variations?: ProductVariationGroup[];
  featured: boolean;
  isNewArrival: boolean;
  inShowroomRail: boolean;
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  deliveryInfo: string;
  deletedAt?: string; // ISO timestamp when moved to 30-day Recycle Bin
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  bannerText: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  productIds: string[];
  startDate: string;
  endDate: string;
  enabled: boolean;
  featured: boolean;
}

export interface CartItem {
  cartItemKey: string; // unique key combining productId + selectedVariations
  productId: string;
  quantity: number;
  selectedVariations?: Record<string, string>;
  variationPriceDelta?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  brand: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  image: string;
  selectedVariations?: Record<string, string>;
}

export type OrderStatus =
  | 'Processing'
  | 'Packed & Verified'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

export type MpesaPaymentStatus =
  | 'Pending Verification'
  | 'Verified & Paid'
  | 'Pay on Delivery'
  | 'Failed';

export interface MpesaTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  clientId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  amount: number;
  tillNumber: string;
  mpesaCode: string;
  mpesaMessage: string;
  status: MpesaPaymentStatus;
  createdAt: string;
  verifiedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  paymentMethod: 'M-Pesa Express' | 'Payment on Delivery';
  mpesaCode?: string;
  mpesaMessage?: string;
  mpesaStatus?: MpesaPaymentStatus;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  status: OrderStatus;
  trackingNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientAccount {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  defaultAddress: string;
  city: string;
  authProvider?: 'password' | 'google';
  photoURL?: string;
  createdAt: string;
}

export interface SiteSettings {
  heroHeadline: string;
  heroSupportingText: string;
  tickerMessages: string[];
  currencySymbol: string;
  freeShippingThreshold: number;
  supportPhone: string;
  supportEmail: string;
  showroomAddress: string;
}

export interface CategoryFilterState {
  brand: string;
  priceBand: string;
  condition: ProductCondition | 'all';
  inStockOnly: boolean;
  ram: string;
  storage: string;
  os: string;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating';
}

export type ActiveRoute =
  | { page: 'home' }
  | { page: 'category'; categoryId: CategoryId | 'all' }
  | { page: 'deals' }
  | { page: 'product'; productId: string }
  | { page: 'admin' }
  | { page: 'client-portal'; tab?: 'orders' | 'history' | 'profile' }
  | { page: 'compare' }
  | { page: 'wishlist' }
  | {
      page: 'info';
      section:
        | 'about'
        | 'delivery'
        | 'returns'
        | 'warranty'
        | 'faq'
        | 'contact'
        | 'privacy'
        | 'terms';
    };
