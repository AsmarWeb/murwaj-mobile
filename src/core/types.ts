export type Locale = 'ar' | 'en';

export type MobileConfig = {
  brand: {
    name: string;
    name_ar: string;
    logo_url: string | null;
  };
  promo: null | {
    enabled: boolean;
    text: { en: string | null; ar: string | null };
    url: string | null;
    background_color: string;
    text_color: string;
    animation: 'marquee' | 'fade' | 'static';
    duration_seconds: number;
    dismissible: boolean;
    starts_at: string | null;
    ends_at: string | null;
  };
};
export type Shop = {
  id: number;
  slug: string;
  name: string;
  name_ar?: string | null;
  description?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  verified?: boolean;
};
export type Product = {
  id: number;
  slug: string;
  title: string;
  title_ar?: string | null;
  description?: string;
  price: string;
  currency: string;
  quantity: number;
  image_url?: string | null;
  image_urls?: string[];
  rating?: number | null;
  shop?: Shop | null;
  features?: string[];
};
export type Page<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
  links?: unknown;
};
export type User = {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
};
export type AuthReply = {
  access_token: string;
  expires_at: string;
  user: User;
  verification_notification_sent?: boolean;
};
export type Session = { token: string; expires: string; user: User; origin: string };
export type CartItem = {
  id: number;
  quantity: number;
  available: boolean;
  unit_price: string | null;
  line_total: string | null;
  product: null | {
    id: number;
    slug: string;
    title: string;
    title_ar?: string | null;
    image_url?: string | null;
    quantity_in_stock: number;
    shop: Shop;
  };
};
export type Cart = {
  items: CartItem[];
  subtotal: string | null;
  currency: string;
  has_unavailable_items: boolean;
  total_quantity: number;
};
export type Delivery = {
  status: string;
  status_label: string;
  tracking_number: string | null;
  tracking_url: string | null;
  updated_at: string | null;
};
export type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  currency: string | null;
  total: string;
  created_at: string | null;
  shop: Shop | null;
  delivery?: Delivery | null;
  items?: { id: number; title: string; quantity: number; unit_price: string; total: string }[];
  shipping_address?: Record<string, string | null>;
};
export type CheckoutState = {
  order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  checkout_state: string;
  currency: string;
  total: string;
  checkout_url: string | null;
  expires_at: string | null;
};
export type Address = {
  shop_id: number;
  recipient_name: string;
  recipient_phone: string;
  emirate: string;
  city: string;
  area: string;
  address_line: string;
  building: string;
  unit: string;
};
export type Device = {
  id: number;
  device_name: string;
  created_at: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  current?: boolean;
  is_current?: boolean;
};


export type MobileHomeCategory = {
  id: number;
  name: string;
  name_ar?: string | null;
  slug: string;
  image?: string | null;
  section_id?: number | null;
};

export type MobileHomeCatalogSection = {
  id: number;
  name: string;
  name_ar?: string | null;
  slug: string;
  image?: string | null;
};

export type MobileHomeSection = {
  id: string | null;
  type:
    | 'products_latest'
    | 'products_featured'
    | 'products_selected'
    | 'shops_latest'
    | 'shops_selected'
    | 'categories'
    | 'catalog_sections'
    | 'editorial'
    | 'banner';
  title?: string | null;
  title_ar?: string | null;
  position: number;
  items?: (Product | Shop | MobileHomeCategory | MobileHomeCatalogSection)[];
  content?: string | null;
  content_ar?: string | null;
  button_text?: string | null;
  button_text_ar?: string | null;
  button_url?: string | null;
  image?: string | null;
};

export type MobileHomePayload = {
  schema_version: number;
  sections: MobileHomeSection[];
};

export type MobileHomeReply = {
  data: MobileHomePayload;
};
