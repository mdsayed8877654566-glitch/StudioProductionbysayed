import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Read local .env if available
dotenv.config();

// We need to parse initialData if Supabase isn't connected
// But since this is a TypeScript script, we can just import it (esbuild can run this, or tsx)
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../src/data/initialData';

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const baseUrl = process.env.APP_URL || 'https://studio-production-six.vercel.app';

  let products = INITIAL_PRODUCTS;
  let categories = INITIAL_CATEGORIES;

  if (supabaseUrl && supabaseKey) {
    console.log('Connecting to Supabase to fetch live data...');
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: pData, error: pError } = await supabase.from('products').select('slug').eq('published', true);
      if (!pError && pData) products = pData as any;
      
      const { data: cData, error: cError } = await supabase.from('categories').select('slug').eq('enabled', true);
      if (!cError && cData) categories = cData as any;
      
      console.log(`Fetched ${products.length} products and ${categories.length} categories from Supabase.`);
    } catch (err) {
      console.error('Error fetching from Supabase, falling back to initialData:', err);
    }
  } else {
    console.log('No Supabase credentials found. Using initialData fallback.');
  }

  const urls = [];
  
  // Base URLs
  urls.push(`${baseUrl}/`);
  urls.push(`${baseUrl}/?category=all`);
  
  // Category URLs
  categories.forEach(c => {
    urls.push(`${baseUrl}/?category=${c.slug}`);
  });
  
  // Product URLs
  products.forEach(p => {
    urls.push(`${baseUrl}/?product=${p.slug}`);
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${url === baseUrl + '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log(`Wrote sitemap.xml to ${path.join(publicDir, 'sitemap.xml')} with ${urls.length} URLs`);
  
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
    console.log(`Wrote sitemap.xml to ${path.join(distDir, 'sitemap.xml')} with ${urls.length} URLs`);
  }
}

generateSitemap().catch(console.error);
