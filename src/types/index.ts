export interface Product {
  id: string;
  articleNo: string; // 5-digit number e.g. "10001"
  name: string;
  handle: string;
  category: string;
  price?: number;
  originalPrice?: number | null;
  currency?: string;
  image: string;
  galleryImages: string[];
  shortDescription: string;
  description: string;
  badge?: string | null;
  availability: 'in_stock' | 'made_to_order' | 'low_stock' | 'out_of_stock';
  featured: boolean;
  isNew: boolean;
  material: string;
  gemstone?: string;
  tags: string[];
  visible: boolean;
  careInstructions?: string;
  updatedAt?: number;
}

export interface SiteContent {
  brandName: string;
  slogan: string;
  heroHeading: string;
  heroSubheading: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroImage: string;
  aboutHeading: string;
  aboutDescription: string;
  companyName: string;
  businessDescription: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  country: string;
  website: string;
  instagram: string;
  footerText: string;
  logoUrl: string;
  currency: 'PKR' | 'USD';
  pkrToUsdRate: number;
  seoTitle: string;
  seoDescription: string;
  customCategories?: string[];
}

export interface CustomerInquiry {
  id: string;
  date: string;
  fullName: string;
  email: string;
  phone: string;
  productId?: string;
  productName?: string;
  message: string;
  status: 'new' | 'contacted' | 'completed';
}

export type SortOption =
  | 'featured'
  | 'newest'
  | 'title-asc'
  | 'title-desc';

export interface FilterState {
  category: string;
  availability: string;
  material: string;
  searchQuery: string;
  sortBy: SortOption;
}
