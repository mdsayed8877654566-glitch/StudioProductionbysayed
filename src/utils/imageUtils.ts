/**
 * Utility functions for processing image URLs, Google Drive links, and generating SQL dumps.
 */

/**
 * Transforms Google Drive share links into direct viewable image URLs.
 * Example input: https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
 * Example output: https://lh3.googleusercontent.com/d/1ABC123xyz
 */
export function formatImageUrl(url: string, fallbackUrl = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'): string {
  if (!url || typeof url !== 'string') return fallbackUrl;

  const trimmed = url.trim();
  if (!trimmed) return fallbackUrl;

  // Handle Google Drive Links
  if (trimmed.includes('drive.google.com')) {
    // Matches /file/d/{FILE_ID}
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }

    // Matches ?id={FILE_ID} or &id={FILE_ID}
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
    }
  }

  // Google Photos or Dropbox share link conversions if applicable
  if (trimmed.includes('dropbox.com') && trimmed.includes('dl=0')) {
    return trimmed.replace('dl=0', 'raw=1');
  }

  return trimmed;
}

export function isGoogleDriveUrl(url: string): boolean {
  return typeof url === 'string' && url.includes('drive.google.com');
}

/**
 * Curated high quality presets for Quick Select in Category & Product modals
 */
export const PRESET_CATEGORY_LOGOS = [
  { name: 'Digital & Tech', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' },
  { name: 'Mobile Apps', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Websites & Code', url: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=800&q=80' },
  { name: 'Portfolio Themes', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80' },
  { name: 'Dashboards & UI', url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80' },
  { name: 'UI/UX Kits', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80' },
  { name: '3D Graphics & Art', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
  { name: 'Video & Motion', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80' },
  { name: 'E-Books & Guides', url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80' },
  { name: 'PDF Workbooks', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80' },
  { name: 'AI & Prompts', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad99a?auto=format&fit=crop&w=800&q=80' },
  { name: 'Source Code', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80' }
];

/**
 * Generates ready-to-run PostgreSQL / SQL insert script for categories & products.
 */
export function generateSqlDump(categories: any[], products: any[]): string {
  const escapeSql = (str: string) => {
    if (!str) return "''";
    return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
  };

  let sql = `-- ==========================================================\n`;
  sql += `-- AUTOMATICALLY GENERATED DATABASE EXPORT SQL DUMP\n`;
  sql += `-- Generated on: ${new Date().toISOString()}\n`;
  sql += `-- ==========================================================\n\n`;

  sql += `-- 1. CATEGORIES TABLE SCHEMA & INSERTS\n`;
  sql += `CREATE TABLE IF NOT EXISTS categories (\n`;
  sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  slug VARCHAR(255) UNIQUE NOT NULL,\n`;
  sql += `  description TEXT,\n`;
  sql += `  image TEXT,\n`;
  sql += `  enabled BOOLEAN DEFAULT TRUE,\n`;
  sql += `  display_order INT DEFAULT 0\n`;
  sql += `);\n\n`;

  categories.forEach((cat) => {
    sql += `INSERT INTO categories (id, name, slug, description, image, enabled, display_order)\n`;
    sql += `VALUES (${escapeSql(cat.id)}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${escapeSql(cat.description)}, ${escapeSql(cat.image)}, ${cat.enabled ? 'TRUE' : 'FALSE'}, ${cat.order || 0})\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET\n`;
    sql += `  name = EXCLUDED.name,\n`;
    sql += `  slug = EXCLUDED.slug,\n`;
    sql += `  description = EXCLUDED.description,\n`;
    sql += `  image = EXCLUDED.image;\n\n`;
  });

  sql += `-- 2. PRODUCTS TABLE SCHEMA & INSERTS\n`;
  sql += `CREATE TABLE IF NOT EXISTS products (\n`;
  sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  slug VARCHAR(255) UNIQUE NOT NULL,\n`;
  sql += `  category_slug VARCHAR(255) REFERENCES categories(slug) ON DELETE SET NULL,\n`;
  sql += `  category_name VARCHAR(255),\n`;
  sql += `  product_type VARCHAR(100),\n`;
  sql += `  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,\n`;
  sql += `  original_price NUMERIC(10,2),\n`;
  sql += `  is_free BOOLEAN DEFAULT FALSE,\n`;
  sql += `  thumbnail TEXT NOT NULL,\n`;
  sql += `  images TEXT[],\n`;
  sql += `  short_description TEXT,\n`;
  sql += `  description TEXT,\n`;
  sql += `  demo_url TEXT,\n`;
  sql += `  download_file_url TEXT,\n`;
  sql += `  file_format VARCHAR(100),\n`;
  sql += `  file_size VARCHAR(100),\n`;
  sql += `  in_stock BOOLEAN DEFAULT TRUE,\n`;
  sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n`;
  sql += `);\n\n`;

  products.forEach((prod) => {
    const imagesArr = Array.isArray(prod.images) ? prod.images : [prod.thumbnail];
    const imagesSql = `ARRAY[${imagesArr.map((img: string) => escapeSql(img)).join(', ')}]`;

    sql += `INSERT INTO products (\n`;
    sql += `  id, name, slug, category_slug, category_name, product_type, price, original_price,\n`;
    sql += `  is_free, thumbnail, images, short_description, description, demo_url, download_file_url,\n`;
    sql += `  file_format, file_size, in_stock\n`;
    sql += `) VALUES (\n`;
    sql += `  ${escapeSql(prod.id)}, ${escapeSql(prod.name)}, ${escapeSql(prod.slug)}, ${escapeSql(prod.categorySlug)},\n`;
    sql += `  ${escapeSql(prod.categoryName)}, ${escapeSql(prod.productType)}, ${prod.price || 0}, ${prod.originalPrice || 0},\n`;
    sql += `  ${prod.isFree ? 'TRUE' : 'FALSE'}, ${escapeSql(prod.thumbnail)}, ${imagesSql}, ${escapeSql(prod.shortDescription)},\n`;
    sql += `  ${escapeSql(prod.description)}, ${escapeSql(prod.demoUrl)}, ${escapeSql(prod.downloadFileUrl)}, ${escapeSql(prod.fileFormat)},\n`;
    sql += `  ${escapeSql(prod.fileSize)}, ${prod.inStock !== false ? 'TRUE' : 'FALSE'}\n`;
    sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
    sql += `  name = EXCLUDED.name,\n`;
    sql += `  price = EXCLUDED.price,\n`;
    sql += `  thumbnail = EXCLUDED.thumbnail,\n`;
    sql += `  images = EXCLUDED.images;\n\n`;
  });

  return sql;
}

export async function compressAndConvertToBase64(file: File, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Use webp or jpeg for better compression, fallback to original type if png and transparency needed
        const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outType, 0.8));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
