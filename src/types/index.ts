export type CategorySlug = string;

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  image: string;
  enabled: boolean;
  order: number;
  productCount?: number;
}

export type ProductType = 
  | 'App'
  | 'Website'
  | 'Template'
  | 'UI Kit'
  | 'Graphics'
  | 'Logo'
  | 'Presentation'
  | 'PDF'
  | 'E-Book'
  | 'Video'
  | 'Audio'
  | 'Font'
  | 'Icons'
  | 'Plugin'
  | 'Source Code'
  | 'AI Tool'
  | 'Other';

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categorySlug: CategorySlug;
  categoryName: string;
  productType: ProductType;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isFree?: boolean;
  published: boolean;
  inStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  thumbnail: string;
  images: string[];
  
  // Digital product details
  fileFormat: string; // e.g. 'ZIP', 'PDF', 'MP4', 'FIG', 'TTF', 'Figma / React'
  fileSize: string; // e.g. '128 MB'
  version: string; // e.g. 'v2.4.0'
  compatibility: string[]; // e.g. ['React 19', 'Next.js', 'Tailwind', 'Figma']
  lastUpdated: string;
  license: string; // e.g. 'Commercial Standard License'
  features: string[];
  whatsIncluded: string[];
  requirements: string[];
  
  // Specifics for Web/Apps/Templates
  demoUrl?: string;
  techStack?: string[];
  responsive?: boolean;
  documentationUrl?: string;
  
  // Specifics for PDF/Ebooks
  pageCount?: number;
  language?: string;
  samplePages?: string[];

  // Specifics for Video/Audio
  duration?: string;
  resolution?: string;
  frameRate?: string;
  sampleMediaUrl?: string;

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];

  // Download File info
  downloadFileName?: string;
  downloadFileUrl?: string;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  permissions: string[];
}

export interface UserProfile {
  id: string;
  displayId?: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'editor' | 'customer';
  permissions?: string[];
  status: 'active' | 'disabled';
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  date: string;
  createdAt?: string;
  status: 'approved' | 'pending' | 'hidden';
  verifiedPurchase?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  licenseType?: 'standard' | 'extended';
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  expirationDate: string;
  usageLimit: number;
  timesUsed: number;
  active: boolean;
}

export type OrderStatus = 'Pending' | 'Paid' | 'Approved' | 'Completed' | 'Failed' | 'Cancelled' | 'Refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  categoryName: string;
  thumbnail: string;
  price: number;
  version: string;
  downloadUrl: string;
  fileSize: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: OrderStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  downloadToken: string;
  transactionId?: string;
  paymentProofUrl?: string;
}

export interface DownloadItem {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  categoryName: string;
  thumbnail: string;
  fileFormat: string;
  fileSize: string;
  version: string;
  purchaseDate: string;
  downloadCount: number;
  maxDownloads: number;
  downloadUrl: string;
  downloadFileName: string;
}

export interface SiteSettings {
  websiteName: string;
  tagline: string;
  logoText: string;
  logoSubtext: string;
  logoUrl?: string;
  primaryColor?: string;
  themePreset?: string;
  
  // Hero Banner Main Settings
  heroHeadline: string;
  heroSubheadline: string;
  heroCoverImage?: string;
  heroBackgroundMode?: 'cover_overlay' | 'clean' | 'subtle_pattern';
  heroCtaPrimary: string;
  heroCtaSecondary: string;

  // Hero Right Showcase & Cover Photo Options
  heroShowcaseEnabled?: boolean;
  heroShowcaseDisplayMode?: 'card' | 'cover_behind' | 'minimal';
  heroShowcaseImage?: string;
  heroShowcaseBadge?: string;
  heroShowcaseRating?: string;
  heroShowcaseTitle?: string;
  heroShowcaseSubtitle?: string;
  heroShowcaseDescription?: string;
  heroShowcasePrice?: string;
  heroShowcaseOriginalPrice?: string;
  heroShowcaseButtonText?: string;
  heroShowcaseLink?: string;
  heroShowcaseDownloadsText?: string;
  heroShowcaseDownloadsSubtext?: string;

  contactEmail: string;
  contactPhone: string;
  address: string;
  currencySymbol: string;
  currencyCode: string;
  taxPercentage: number;
  paymentMethods: {
    stripe: boolean;
    paypal: boolean;
    sslcommerz: boolean;
    bkash: boolean;
    bkashNumber?: string;
    nagad: boolean;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
    linkedin: string;
    twitter: string;
    github: string;
  };
  announcementBar: {
    enabled: boolean;
    text: string;
    linkText?: string;
    linkUrl?: string;
  };
  showDiscountBanner?: boolean;
  discountBannerTitle?: string;
  discountBannerCode?: string;
  discountBannerText?: string;
  footerAbout: string;
  metaDescription: string;
  metaKeywords: string;
}

export interface FilterState {
  categorySlug: string;
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  productTypes: ProductType[];
  fileFormats: string[];
  minRating: number;
  onlyDiscounted: boolean;
  onlyNew: boolean;
  onlyBestSellers: boolean;
  sortBy: 'popular' | 'best-selling' | 'newest' | 'price-asc' | 'price-desc' | 'rating-desc';
}
