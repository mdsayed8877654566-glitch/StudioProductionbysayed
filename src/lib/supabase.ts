import { createClient } from '@supabase/supabase-js';

// Environment variable credentials or fallback to user's Studio Production project
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://yojbhqkiygmjdszzxdjt.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvamJocWtpeWdtamRzenp4ZGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNzA1MDgsImV4cCI6MjEwMTc0NjUwOH0.ISE8y7eGALYHhTUuHLXykRMPn8R2qizLj3PNr_v8c7Y';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_SQL_SCHEMA = `-- Studio Collection PostgreSQL Database Schema for Supabase
-- Run this script in the Supabase SQL Editor to set up tables and Row Level Security (RLS)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'editor', 'customer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  total_orders INT DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. User Roles Tracking Table (Assign & track roles for users, customers, and admins)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'editor', 'customer')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  enabled BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  description TEXT,
  category_slug TEXT REFERENCES public.categories(slug) ON DELETE SET NULL,
  category_name TEXT,
  product_type TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  discount_percent INT DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  is_new BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  thumbnail TEXT,
  images TEXT[],
  file_format TEXT,
  file_size TEXT,
  version TEXT,
  compatibility TEXT[],
  last_updated DATE DEFAULT CURRENT_DATE,
  license TEXT,
  features TEXT[],
  whats_included TEXT[],
  requirements TEXT[],
  demo_url TEXT,
  tech_stack TEXT[],
  responsive BOOLEAN DEFAULT true,
  documentation_url TEXT,
  page_count INT,
  language TEXT,
  duration TEXT,
  resolution TEXT,
  frame_rate TEXT,
  seo_title TEXT,
  seo_description TEXT,
  keywords TEXT[],
  download_file_name TEXT,
  download_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  coupon_code TEXT,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'Paid',
  order_status TEXT DEFAULT 'Completed',
  download_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category_name TEXT,
  thumbnail TEXT,
  price NUMERIC NOT NULL,
  version TEXT,
  download_url TEXT,
  file_size TEXT
);

-- 6. Downloads Table
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  download_count INT DEFAULT 0,
  max_downloads INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_purchase NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  expiration_date DATE,
  usage_limit INT DEFAULT 1000,
  times_used INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Newsletters Table
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) with open public & authenticated policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles all access" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Public profiles all access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public user_roles all access" ON public.user_roles;
CREATE POLICY "Public user_roles all access" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public categories all access" ON public.categories;
DROP POLICY IF EXISTS "Public categories view" ON public.categories;
CREATE POLICY "Public categories all access" ON public.categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public products all access" ON public.products;
DROP POLICY IF EXISTS "Public products view" ON public.products;
CREATE POLICY "Public products all access" ON public.products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public orders all access" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;
CREATE POLICY "Public orders all access" ON public.orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public order_items all access" ON public.order_items;
CREATE POLICY "Public order_items all access" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public downloads all access" ON public.downloads;
DROP POLICY IF EXISTS "Users can view own downloads" ON public.downloads;
DROP POLICY IF EXISTS "Users can insert own downloads" ON public.downloads;
DROP POLICY IF EXISTS "Users can update own downloads" ON public.downloads;
DROP POLICY IF EXISTS "Users can delete own downloads" ON public.downloads;
CREATE POLICY "Public downloads all access" ON public.downloads FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reviews all access" ON public.reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Public reviews all access" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public coupons all access" ON public.coupons;
CREATE POLICY "Public coupons all access" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public site_settings all access" ON public.site_settings;
CREATE POLICY "Public site_settings all access" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public newsletters all access" ON public.newsletters;
CREATE POLICY "Public newsletters all access" ON public.newsletters FOR ALL USING (true) WITH CHECK (true);

-- Grant full table permissions for anon and authenticated API roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
`;

export async function fetchProfileFromSupabase(userId: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('Supabase fetch profile warning:', error.message);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: data.role || 'customer',
      status: data.status || 'active',
      createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      totalOrders: data.total_orders || 0,
      totalSpent: data.total_spent || 0
    };
  } catch (e) {
    console.error('Failed to fetch profile from Supabase:', e);
    return null;
  }
}

export async function fetchProfileByEmailFromSupabase(email: string) {
  if (!isSupabaseConfigured || !email) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email.trim().toLowerCase())
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: data.role || 'customer',
      status: data.status || 'active',
      createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      totalOrders: data.total_orders || 0,
      totalSpent: data.total_spent || 0
    };
  } catch (e) {
    console.warn('Failed to fetch profile by email from Supabase:', e);
    return null;
  }
}

export async function upsertProfileInSupabase(profile: {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  status?: string;
}) {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await safeUpsertInSupabase('profiles', {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar || null,
      role: profile.role || 'customer',
      status: profile.status || 'active'
    });
    if (error) {
      console.warn('Supabase upsert profile notice:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Failed to upsert profile in Supabase:', e);
    return false;
  }
}

/**
 * SQL Queries to set up and assign Administrator privileges in Supabase
 */
export const ADMIN_SETUP_SQL = `
-- ====================================================================
-- STORAGE SETUP (Avatars)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

-- ====================================================================
-- 1. USER ROLES & PROFILES TABLES CREATION
-- ====================================================================

-- Create profiles table with role support
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'editor', 'customer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  total_orders INT DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dedicated user_roles tracking table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'editor', 'customer')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ====================================================================
-- 2. SQL INSERT FOR DESIGNATED ADMINISTRATOR ACCOUNT
-- Email: admin@studiocollection.com
-- Password: Admin123!
-- ====================================================================

-- A. Insert Administrator user into auth.users table (or update if exists)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@studiocollection.com',
  -- Blowfish hash for password "Admin123!"
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Master Administrator"}',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('Admin123!', gen_salt('bf')),
  updated_at = NOW();

-- B. Insert or Upgrade Profile in public.profiles table
INSERT INTO public.profiles (
  id,
  email,
  name,
  avatar,
  role,
  status
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@studiocollection.com',
  'Master Administrator',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'super_admin',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  status = 'active';

-- C. Track role assignment in public.user_roles
INSERT INTO public.user_roles (
  user_id,
  user_email,
  role,
  notes
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@studiocollection.com',
  'super_admin',
  'Designated Site Master Administrator with full website editing privileges'
);

-- ====================================================================
-- 3. HELPER QUERY TO DESIGNATE ANY EXISTING EMAIL AS ADMINISTRATOR
-- Replace 'your_email@example.com' with the email you want to make admin
-- ====================================================================

UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'admin@studiocollection.com';

SELECT id, email, name, role, created_at 
FROM public.profiles 
WHERE role IN ('super_admin', 'admin');
`;



export async function uploadPaymentProof(orderNumber: string, file: File): Promise<string | null> {
  const { imageStorage } = await import('../services/imageStorage');

  if (!isSupabaseConfigured) {
    try {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      await imageStorage.saveImage(id, file);
      return `/local-image/${id}`;
    } catch {
      return null;
    }
  }

  const readAsDataUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `proofs/${orderNumber}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn('Supabase Storage proof upload notice (falling back to base64 Data URL):', uploadError.message);
      return await readAsDataUrl();
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.warn('Proof upload exception (falling back to base64 Data URL):', e);
    try {
      return await readAsDataUrl();
    } catch {
      return null;
    }
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const { imageStorage } = await import('../services/imageStorage');

  if (!isSupabaseConfigured) {
    try {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      await imageStorage.saveImage(id, file);
      return `/local-image/${id}`;
    } catch {
      return null;
    }
  }

  const readAsDataUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn('Supabase Storage avatar upload notice (falling back to base64 Data URL):', uploadError.message);
      return await readAsDataUrl();
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.warn('Avatar upload exception (falling back to base64 Data URL):', e);
    try {
      return await readAsDataUrl();
    } catch {
      return null;
    }
  }
}

export async function uploadImageToSupabase(file: File, folder = 'uploads'): Promise<string> {
  const readAsDataUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  if (!isSupabaseConfigured) {
    return await readAsDataUrl();
  }

  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filePath = `${folder}/${Date.now()}_${cleanName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn('Supabase storage upload fallback to base64:', uploadError.message);
      return await readAsDataUrl();
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('Storage exception fallback to base64:', err);
    return await readAsDataUrl();
  }
}

export async function safeUpsertInSupabase(table: string, payload: Record<string, any>): Promise<{ error: any }> {
  const currentPayload = { ...payload };
  for (let attempt = 0; attempt < 10; attempt++) {
    const { error } = await supabase.from(table).upsert(currentPayload);
    if (!error) {
      return { error: null };
    }

    // Check if PostgREST column missing error: PGRST204
    if (error.code === 'PGRST204' || error.message?.includes('Could not find the') || error.message?.includes('schema cache')) {
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1] && match[1] in currentPayload) {
        console.warn(`[Supabase] Column '${match[1]}' not found on table '${table}', safely stripping column and retrying...`);
        delete currentPayload[match[1]];
        continue;
      }
    }

    // Check if RLS policy error: 42501
    if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('policy for table')) {
      console.warn(`[Supabase RLS Notice] Table '${table}' write was blocked by Supabase Row-Level Security (Error 42501). Run the SQL Schema from Settings -> Supabase to apply public policies.`);
      return { error };
    }

    return { error };
  }
  return { error: new Error('Max upsert retries exceeded') };
}

export async function fetchCategoriesFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      console.warn('Supabase fetch categories notice:', error.message);
      return null;
    }
    return data.map(d => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      description: d.description || '',
      image: d.image || '',
      enabled: d.enabled !== false,
      productCount: 0,
      order: d.display_order ?? 0
    }));
  } catch (e) {
    console.warn('Fetch categories notice:', e);
    return null;
  }
}

export async function upsertCategoryInSupabase(category: any): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await safeUpsertInSupabase('categories', {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      enabled: category.enabled !== false,
      display_order: category.order ?? 0
    });
    if (error) {
      console.warn('Supabase upsert category notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Upsert category notice:', e?.message || e);
    return false;
  }
}

export async function deleteCategoryInSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete category notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Delete category notice:', e?.message || e);
    return false;
  }
}

export async function fetchProductsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.warn('Supabase fetch products notice:', error.message);
      return null;
    }
    return data.map(d => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      shortDescription: d.short_description || '',
      description: d.description || '',
      categorySlug: d.category_slug || '',
      categoryName: d.category_name || '',
      productType: d.product_type || 'Digital',
      price: Number(d.price) || 0,
      originalPrice: Number(d.original_price) || Number(d.price) || 0,
      discountPercent: d.discount_percent ?? (d.original_price > d.price ? Math.round(((d.original_price - d.price) / d.original_price) * 100) : 0),
      rating: Number(d.rating) || 5.0,
      reviewCount: d.review_count || 0,
      salesCount: d.sales_count || 0,
      isNew: d.is_new ?? false,
      isBestSeller: d.is_best_seller ?? false,
      isFeatured: d.is_featured ?? false,
      isFree: d.is_free ?? (Number(d.price) === 0),
      published: d.published !== false,
      thumbnail: d.thumbnail || '',
      images: Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.thumbnail ? [d.thumbnail] : []),
      fileFormat: d.file_format || 'ZIP Archive',
      fileSize: d.file_size || '25 MB',
      version: d.version || 'v1.0.0',
      compatibility: Array.isArray(d.compatibility) ? d.compatibility : ['React 19', 'Tailwind CSS', 'TypeScript'],
      lastUpdated: d.last_updated || new Date().toISOString().split('T')[0],
      license: d.license || 'Commercial License',
      features: Array.isArray(d.features) ? d.features : ['Clean Codebase', 'Fully Responsive', 'Free Updates'],
      whatsIncluded: Array.isArray(d.whats_included) ? d.whats_included : ['Source Files', 'Assets', 'Documentation'],
      requirements: Array.isArray(d.requirements) ? d.requirements : ['Modern Browser / Node.js'],
      demoUrl: d.demo_url || '',
      downloadFileName: d.download_file_name || `${d.name?.toLowerCase().replace(/\s+/g, '-')}.zip`,
      downloadFileUrl: d.download_file_url || '',
      inStock: d.in_stock !== false,
      stockQuantity: d.stock_quantity ?? 999,
      lowStockThreshold: d.low_stock_threshold ?? 5
    }));
  } catch (e) {
    console.warn('Fetch products notice:', e);
    return null;
  }
}

export async function upsertProductInSupabase(product: any): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: Record<string, any> = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      short_description: product.shortDescription || '',
      description: product.description || '',
      category_slug: product.categorySlug || null,
      category_name: product.categoryName || '',
      product_type: product.productType || 'Digital',
      price: Number(product.price) || 0,
      original_price: Number(product.originalPrice) || Number(product.price) || 0,
      discount_percent: Number(product.discountPercent) || 0,
      rating: Number(product.rating) || 5.0,
      review_count: Number(product.reviewCount) || 0,
      sales_count: Number(product.salesCount) || 0,
      is_new: Boolean(product.isNew),
      is_best_seller: Boolean(product.isBestSeller),
      is_featured: Boolean(product.isFeatured),
      published: product.published !== false,
      thumbnail: product.thumbnail || '',
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.thumbnail || ''],
      file_format: product.fileFormat || 'ZIP Archive',
      file_size: product.fileSize || '25 MB',
      version: product.version || 'v1.0.0',
      compatibility: Array.isArray(product.compatibility) ? product.compatibility : [],
      last_updated: product.lastUpdated || new Date().toISOString().split('T')[0],
      license: product.license || 'Commercial License',
      features: Array.isArray(product.features) ? product.features : [],
      whats_included: Array.isArray(product.whatsIncluded) ? product.whatsIncluded : [],
      requirements: Array.isArray(product.requirements) ? product.requirements : [],
      demo_url: product.demoUrl || '',
      download_file_name: product.downloadFileName || `${product.name?.toLowerCase().replace(/\s+/g, '-')}.zip`,
      download_file_url: product.downloadFileUrl || ''
    };

    if (Array.isArray(product.techStack)) payload.tech_stack = product.techStack;
    if (typeof product.responsive === 'boolean') payload.responsive = product.responsive;
    if (product.documentationUrl) payload.documentation_url = product.documentationUrl;
    if (product.pageCount !== undefined && product.pageCount !== null) payload.page_count = Number(product.pageCount);
    if (product.language) payload.language = product.language;
    if (product.duration) payload.duration = product.duration;
    if (product.resolution) payload.resolution = product.resolution;
    if (product.frameRate) payload.frame_rate = product.frameRate;
    if (product.seoTitle) payload.seo_title = product.seoTitle;
    if (product.seoDescription) payload.seo_description = product.seoDescription;
    if (Array.isArray(product.keywords)) payload.keywords = product.keywords;

    const { error } = await safeUpsertInSupabase('products', payload);
    if (error) {
      console.warn('Supabase upsert product notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Upsert product notice:', e?.message || e);
    return false;
  }
}

export async function deleteProductInSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete product notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Delete product notice:', e?.message || e);
    return false;
  }
}


export async function syncCartToSupabase(userId: string, cart: any[]) {
  if (!isSupabaseConfigured || !userId || userId.startsWith('guest')) return;
  try {
    await supabase.from('profiles').update({ cart_data: cart }).eq('id', userId);
  } catch (e) {}
}

export async function syncWishlistToSupabase(userId: string, wishlistIds: string[]) {
  if (!isSupabaseConfigured || !userId || userId.startsWith('guest')) return;
  try {
    await supabase.from('profiles').update({ wishlist_data: wishlistIds }).eq('id', userId);
  } catch (e) {}
}

export async function fetchUserDataFromSupabase(userId: string) {
  if (!isSupabaseConfigured || !userId || userId.startsWith('guest')) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('cart_data, wishlist_data').eq('id', userId).single();
    if (error) return null;
    return {
      cart: data.cart_data,
      wishlist: data.wishlist_data
    };
  } catch (e) {
    return null;
  }
}

export async function fetchOrdersFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.warn('Supabase fetch orders error:', ordersError.message);
      return null;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*');

    if (itemsError) {
      console.warn('Supabase fetch order_items notice:', itemsError.message);
    }

    const itemsMap = new Map<string, any[]>();
    if (itemsData) {
      itemsData.forEach(item => {
        const orderId = item.order_id;
        if (!itemsMap.has(orderId)) itemsMap.set(orderId, []);
        itemsMap.get(orderId)!.push({
          productId: item.product_id,
          productName: item.product_name,
          categoryName: item.category_name,
          thumbnail: item.thumbnail,
          price: Number(item.price) || 0,
          version: item.version || 'v1.0.0',
          downloadUrl: item.download_url || '',
          fileSize: item.file_size || '25 MB'
        });
      });
    }

    return ordersData.map(d => ({
      id: d.id,
      orderNumber: d.order_number,
      userId: d.user_id || 'guest',
      customerName: d.customer_name,
      customerEmail: d.customer_email,
      items: itemsMap.get(d.id) || [],
      subtotal: Number(d.subtotal) || 0,
      discountAmount: Number(d.discount_amount) || 0,
      couponCode: d.coupon_code || undefined,
      taxAmount: Number(d.tax_amount) || 0,
      total: Number(d.total) || 0,
      paymentMethod: d.payment_method || 'CARD',
      paymentStatus: d.payment_status || 'Paid',
      orderStatus: d.order_status || 'Completed',
      createdAt: d.created_at,
      downloadToken: d.download_token || d.id,
      transactionId: d.transaction_id || undefined,
      paymentProofUrl: d.payment_proof_url || undefined
    }));
  } catch (e) {
    console.error('Fetch orders exception:', e);
    return null;
  }
}

export async function upsertOrderInSupabase(order: any): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const isUUID = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str));

    const { error: orderError } = await safeUpsertInSupabase('orders', {
      id: order.id,
      order_number: order.orderNumber,
      user_id: isUUID(order.userId) ? order.userId : null,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      subtotal: Number(order.subtotal) || 0,
      discount_amount: Number(order.discountAmount) || 0,
      coupon_code: order.couponCode || null,
      tax_amount: Number(order.taxAmount) || 0,
      total: Number(order.total) || 0,
      payment_method: order.paymentMethod || 'CARD',
      payment_status: order.paymentStatus || 'Paid',
      order_status: order.orderStatus || 'Completed',
      download_token: order.downloadToken || order.id
    });

    if (orderError) {
      console.warn('Supabase upsert order notice:', orderError.message);
      return false;
    }
    
    // Upsert items if present
    if (Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        await safeUpsertInSupabase('order_items', {
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          category_name: item.categoryName || '',
          thumbnail: item.thumbnail || '',
          price: Number(item.price) || 0,
          version: item.version || 'v1.0.0',
          download_url: item.downloadUrl || '',
          file_size: item.fileSize || ''
        });
      }
    }
    return true;
  } catch (e: any) {
    console.warn('Upsert order notice:', e?.message || e);
    return false;
  }
}

export async function deleteOrderInSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    await supabase.from('order_items').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete order notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Delete order notice:', e?.message || e);
    return false;
  }
}

export async function fetchUsersFromSupabase() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return null;
    return data.map(d => ({
      id: d.id,
      email: d.email,
      name: d.name,
      avatar: d.avatar,
      role: d.role || 'customer',
      status: d.status || 'active',
      createdAt: d.created_at || new Date().toISOString().split('T')[0],
      totalOrders: d.total_orders || 0,
      totalSpent: Number(d.total_spent) || 0
    }));
  } catch (e) {
    return null;
  }
}

export async function fetchCouponsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('coupons').select('*');
    if (error) {
      console.warn('Supabase fetch coupons error:', error.message);
      return null;
    }
    return data.map(d => ({
      id: d.id,
      code: d.code,
      discountType: d.discount_type,
      discountValue: Number(d.discount_value),
      minPurchase: Number(d.min_purchase) || 0,
      maxDiscount: d.max_discount ? Number(d.max_discount) : undefined,
      expirationDate: d.expiration_date,
      usageLimit: d.usage_limit,
      timesUsed: d.times_used,
      active: d.active !== false
    }));
  } catch (e) {
    return null;
  }
}

export async function upsertCouponInSupabase(coupon: any): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await safeUpsertInSupabase('coupons', {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discountType,
      discount_value: Number(coupon.discountValue) || 0,
      min_purchase: Number(coupon.minPurchase) || 0,
      max_discount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      expiration_date: coupon.expirationDate || null,
      usage_limit: Number(coupon.usageLimit) || 1000,
      times_used: Number(coupon.timesUsed) || 0,
      active: coupon.active !== false
    });
    if (error) {
      console.warn('Supabase upsert coupon notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Upsert coupon notice:', e?.message || e);
    return false;
  }
}

export async function deleteCouponInSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete coupon notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Delete coupon notice:', e?.message || e);
    return false;
  }
}

export async function fetchReviewsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('reviews').select('*');
    if (error) {
      console.warn('Supabase fetch reviews error:', error.message);
      return null;
    }
    return data.map(d => ({
      id: d.id,
      productId: d.product_id,
      productName: d.product_name,
      userId: d.user_id,
      userName: d.user_name,
      userAvatar: d.user_avatar,
      rating: d.rating,
      comment: d.comment,
      status: d.status,
      date: d.created_at
    }));
  } catch (e) {
    return null;
  }
}

export async function upsertReviewInSupabase(review: any): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const isUUID = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str));

    const { error } = await safeUpsertInSupabase('reviews', {
      id: review.id,
      product_id: review.productId,
      product_name: review.productName || '',
      user_id: isUUID(review.userId) ? review.userId : null,
      user_name: review.userName || 'Anonymous',
      user_avatar: review.userAvatar || '',
      rating: Number(review.rating) || 5,
      comment: review.comment || '',
      status: review.status || 'approved'
    });
    if (error) {
      console.warn('Supabase upsert review notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Upsert review notice:', e?.message || e);
    return false;
  }
}

export async function deleteReviewInSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete review notice:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Delete review notice:', e?.message || e);
    return false;
  }
}

export async function subscribeNewsletterInSupabase(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    console.log("Mock saved newsletter subscription for:", email);
    return { success: true };
  }
  try {
    const { error } = await supabase.from('newsletters').insert([
      { email: email.trim().toLowerCase() }
    ]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function fetchSettingsFromSupabase(): Promise<any | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch site_settings notice:', error.message);
      return null;
    }
    if (!data || !data.data) return null;
    return data.data;
  } catch (e) {
    console.warn('Failed to fetch settings from Supabase:', e);
    return null;
  }
}

export async function upsertSettingsInSupabase(settings: any): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await safeUpsertInSupabase('site_settings', {
      id: 1,
      data: settings,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Supabase upsert site_settings notice:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Failed to upsert settings in Supabase:', e);
    return false;
  }
}

/**
 * Realtime table subscription channel for instant multi-user synchronization.
 */
export function subscribeToSupabaseRealtime(onTableChange: (table: string, eventType: string, newRecord: any, oldRecord: any) => void): (() => void) {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('supabase_realtime_store_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => onTableChange('categories', payload.eventType, payload.new, payload.old)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => onTableChange('products', payload.eventType, payload.new, payload.old)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => onTableChange('site_settings', payload.eventType, payload.new, payload.old)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => onTableChange('orders', payload.eventType, payload.new, payload.old)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        (payload) => onTableChange('coupons', payload.eventType, payload.new, payload.old)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        (payload) => onTableChange('reviews', payload.eventType, payload.new, payload.old)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Could not establish Supabase realtime subscription:', e);
    return () => {};
  }
}

// Eager, parallel pre-fetching promises for Supabase connection & site settings
export const initialSessionPromise = isSupabaseConfigured 
  ? supabase.auth.getSession() 
  : Promise.resolve({ data: { session: null }, error: null });

export const initialSettingsPromise = isSupabaseConfigured 
  ? fetchSettingsFromSupabase() 
  : Promise.resolve(null);


