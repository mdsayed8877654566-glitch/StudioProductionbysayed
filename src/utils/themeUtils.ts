// Theme Color Utility for Studio Production
// Generates a full spectrum of Tailwind shades (50-950) + RGB variables from ANY hex color

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
  rgb: string;
  base: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  hex: string;
  description: string;
}

export const PRESET_THEME_COLORS: ThemePreset[] = [
  { id: 'orange', name: 'Studio Orange', hex: '#ea580c', description: 'Energetic, modern, high-contrast signature brand' },
  { id: 'blue', name: 'Electric Blue', hex: '#2563eb', description: 'Tech-forward, trustworthy, professional SaaS style' },
  { id: 'emerald', name: 'Emerald Green', hex: '#059669', description: 'Fresh, vibrant, digital wealth & sustainability' },
  { id: 'purple', name: 'Neon Purple', hex: '#9333ea', description: 'Creative, luxurious, digital art & creator focus' },
  { id: 'crimson', name: 'Crimson Red', hex: '#dc2626', description: 'Bold, striking, dynamic high-impact theme' },
  { id: 'rose', name: 'Rose Luxury', hex: '#e11d48', description: 'Refined, modern aesthetic, premium fashion vibe' },
  { id: 'amber', name: 'Amber Gold', hex: '#d97706', description: 'Warm, prestigious, handcrafted marketplace tone' },
  { id: 'cyan', name: 'Cyber Cyan', hex: '#0891b2', description: 'Futuristic, high-clarity software & code marketplace' },
  { id: 'teal', name: 'Deep Teal', hex: '#0d9488', description: 'Sophisticated, calm, balanced design-centric look' },
  { id: 'indigo', name: 'Midnight Indigo', hex: '#4f46e5', description: 'Deep tech, modern development suite identity' },
  { id: 'lime', name: 'Acid Lime', hex: '#65a30d', description: 'Cutting-edge streetwear & avant-garde creator tone' },
  { id: 'slate', name: 'Slate Minimal', hex: '#475569', description: 'Monochrome, understated architectural elegance' }
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function generateShadesFromHex(baseHex: string): ColorShades {
  const rgb = hexToRgb(baseHex) || { r: 234, g: 88, b: 12 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const h = hsl.h;
  const s = hsl.s;

  return {
    50: hslToHex(h, Math.max(10, s * 0.7), 97),
    100: hslToHex(h, Math.max(15, s * 0.8), 93),
    200: hslToHex(h, Math.max(20, s * 0.88), 84),
    300: hslToHex(h, Math.max(25, s * 0.94), 72),
    400: hslToHex(h, s, 60),
    500: hslToHex(h, s, 50),
    600: baseHex,
    700: hslToHex(h, Math.min(100, s * 1.05), Math.max(10, hsl.l * 0.78)),
    800: hslToHex(h, Math.min(100, s * 1.1), Math.max(8, hsl.l * 0.62)),
    900: hslToHex(h, Math.min(100, s * 1.15), Math.max(6, hsl.l * 0.45)),
    950: hslToHex(h, Math.min(100, s * 1.2), Math.max(4, hsl.l * 0.28)),
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    base: baseHex
  };
}

export function applyThemeColor(hexColor?: string): void {
  const baseHex = hexColor && hexColor.trim() ? hexColor.trim() : '#ea580c';
  const shades = generateShadesFromHex(baseHex);
  const root = document.documentElement;

  root.style.setProperty('--theme-primary', shades[600]);
  root.style.setProperty('--theme-primary-hover', shades[700]);
  root.style.setProperty('--theme-primary-active', shades[800]);
  root.style.setProperty('--theme-primary-rgb', shades.rgb);

  root.style.setProperty('--theme-primary-50', shades[50]);
  root.style.setProperty('--theme-primary-100', shades[100]);
  root.style.setProperty('--theme-primary-200', shades[200]);
  root.style.setProperty('--theme-primary-300', shades[300]);
  root.style.setProperty('--theme-primary-400', shades[400]);
  root.style.setProperty('--theme-primary-500', shades[500]);
  root.style.setProperty('--theme-primary-600', shades[600]);
  root.style.setProperty('--theme-primary-700', shades[700]);
  root.style.setProperty('--theme-primary-800', shades[800]);
  root.style.setProperty('--theme-primary-900', shades[900]);
  root.style.setProperty('--theme-primary-950', shades[950]);

  // Update browser theme-color meta tag
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', shades[600]);
  }

  // Inject / update direct dynamic CSS stylesheet to ensure 100% reactive color coverage across the entire site
  if (typeof document !== 'undefined') {
    let styleEl = document.getElementById('studio-theme-dynamic-styles') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'studio-theme-dynamic-styles';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      :root {
        --color-orange-50: ${shades[50]};
        --color-orange-100: ${shades[100]};
        --color-orange-200: ${shades[200]};
        --color-orange-300: ${shades[300]};
        --color-orange-400: ${shades[400]};
        --color-orange-500: ${shades[500]};
        --color-orange-600: ${shades[600]};
        --color-orange-700: ${shades[700]};
        --color-orange-800: ${shades[800]};
        --color-orange-900: ${shades[900]};
        --color-orange-950: ${shades[950]};

        --color-brand-50: ${shades[50]};
        --color-brand-100: ${shades[100]};
        --color-brand-200: ${shades[200]};
        --color-brand-300: ${shades[300]};
        --color-brand-400: ${shades[400]};
        --color-brand-500: ${shades[500]};
        --color-brand-600: ${shades[600]};
        --color-brand-700: ${shades[700]};
        --color-brand-800: ${shades[800]};
        --color-brand-900: ${shades[900]};
        --color-brand-950: ${shades[950]};

        --color-primary-50: ${shades[50]};
        --color-primary-100: ${shades[100]};
        --color-primary-200: ${shades[200]};
        --color-primary-300: ${shades[300]};
        --color-primary-400: ${shades[400]};
        --color-primary-500: ${shades[500]};
        --color-primary-600: ${shades[600]};
        --color-primary-700: ${shades[700]};
        --color-primary-800: ${shades[800]};
        --color-primary-900: ${shades[900]};
        --color-primary-950: ${shades[950]};
      }

      /* Universal Dynamic Brand Overrides */
      .bg-orange-500, .bg-brand-500, .bg-primary-500 { background-color: ${shades[500]} !important; }
      .bg-orange-600, .bg-brand-600, .bg-primary-600 { background-color: ${shades[600]} !important; }
      .hover\\:bg-orange-600:hover, .hover\\:bg-brand-600:hover, .hover\\:bg-primary-600:hover { background-color: ${shades[600]} !important; }
      .hover\\:bg-orange-700:hover, .hover\\:bg-brand-700:hover, .hover\\:bg-primary-700:hover { background-color: ${shades[700]} !important; }
      .hover\\:bg-orange-800:hover { background-color: ${shades[800]} !important; }
      .hover\\:bg-orange-50:hover { background-color: ${shades[50]} !important; }
      .hover\\:bg-orange-100:hover { background-color: ${shades[100]} !important; }
      
      .text-orange-400, .text-brand-400, .text-primary-400 { color: ${shades[400]} !important; }
      .text-orange-500, .text-brand-500, .text-primary-500 { color: ${shades[500]} !important; }
      .text-orange-600, .text-brand-600, .text-primary-600 { color: ${shades[600]} !important; }
      .text-orange-700, .text-brand-700, .text-primary-700 { color: ${shades[700]} !important; }
      .text-orange-800, .text-brand-800, .text-primary-800 { color: ${shades[800]} !important; }
      .text-orange-900, .text-brand-900, .text-primary-900 { color: ${shades[900]} !important; }
      .text-orange-950, .text-brand-950, .text-primary-950 { color: ${shades[950]} !important; }
      .hover\\:text-orange-600:hover { color: ${shades[600]} !important; }
      .hover\\:text-orange-700:hover { color: ${shades[700]} !important; }

      .border-orange-100 { border-color: ${shades[100]} !important; }
      .border-orange-200 { border-color: ${shades[200]} !important; }
      .border-orange-300 { border-color: ${shades[300]} !important; }
      .border-orange-500 { border-color: ${shades[500]} !important; }
      .border-orange-600 { border-color: ${shades[600]} !important; }
      .border-orange-700 { border-color: ${shades[700]} !important; }
      .hover\\:border-orange-500:hover { border-color: ${shades[500]} !important; }
      .hover\\:border-orange-600:hover { border-color: ${shades[600]} !important; }

      .bg-orange-50, .bg-brand-50 { background-color: ${shades[50]} !important; }
      .bg-orange-100, .bg-brand-100 { background-color: ${shades[100]} !important; }
      .bg-orange-200, .bg-brand-200 { background-color: ${shades[200]} !important; }
      
      .ring-orange-500 { --tw-ring-color: ${shades[500]} !important; }
      .ring-orange-600 { --tw-ring-color: ${shades[600]} !important; }
      .focus\\:border-orange-600:focus { border-color: ${shades[600]} !important; }
      .focus\\:ring-orange-500:focus { --tw-ring-color: ${shades[500]} !important; }

      .shadow-orange-600\\/20, .shadow-orange-500\\/20 { box-shadow: 0 10px 25px -5px rgba(${shades.rgb}, 0.25), 0 8px 10px -6px rgba(${shades.rgb}, 0.2) !important; }
      .shadow-orange-600\\/10, .shadow-orange-500\\/10 { box-shadow: 0 4px 6px -1px rgba(${shades.rgb}, 0.1) !important; }
      
      ::selection { background-color: ${shades[500]} !important; color: #ffffff !important; }
    `;
  }
}

/**
 * Dynamically updates Browser Tab Title, Favicon (from URL or dynamic brand SVG),
 * and OpenGraph/Twitter Social Share Meta Tags.
 */
export function updateDynamicBrowserMeta(
  settings: {
    websiteName?: string;
    logoUrl?: string;
    logoText?: string;
    tagline?: string;
    heroSubheadline?: string;
    footerAbout?: string;
    primaryColor?: string;
  },
  pageTitle?: string
): void {
  if (typeof document === 'undefined') return;

  const siteName = settings.websiteName || 'Studio Production';
  const displayTitle = pageTitle ? `${pageTitle} - ${siteName}` : siteName;
  const description = settings.tagline || settings.heroSubheadline || settings.footerAbout || 'Studio Production — Premium Digital Marketplace';
  const primaryColor = settings.primaryColor || '#ea580c';
  const initial = (settings.logoText || settings.websiteName || 'S').trim().charAt(0).toUpperCase() || 'S';

  // 1. Update Document Title
  document.title = displayTitle;

  // 2. Determine Favicon URL (Uploaded Image URL OR Dynamic SVG with Brand Color & Store Initial)
  let faviconUrl = settings.logoUrl && settings.logoUrl.trim() ? settings.logoUrl.trim() : '';

  if (!faviconUrl) {
    // Generate clean, modern SVG favicon with matching brand color and first letter
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${primaryColor}"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">${initial}</text></svg>`;
    faviconUrl = `data:image/svg+xml;utf6,${encodeURIComponent(svgIcon)}`;
  }

  // 3. Update or Create Favicon Links
  const updateLinkTag = (rel: string, href: string, type?: string) => {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
    if (type) link.type = type;
  };

  updateLinkTag('icon', faviconUrl, faviconUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png');
  updateLinkTag('shortcut icon', faviconUrl);
  updateLinkTag('apple-touch-icon', faviconUrl);

  // 4. Update Meta Tags for OpenGraph & Twitter Social Link Previews
  const updateMetaTag = (selector: string, attr: 'content', value: string) => {
    let meta = document.querySelector(selector) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      if (selector.startsWith('meta[name=')) {
        const nameMatch = selector.match(/name="([^"]+)"/);
        if (nameMatch) meta.name = nameMatch[1];
      } else if (selector.startsWith('meta[property=')) {
        const propMatch = selector.match(/property="([^"]+)"/);
        if (propMatch) meta.setAttribute('property', propMatch[1]);
      }
      document.head.appendChild(meta);
    }
    meta.setAttribute(attr, value);
  };

  updateMetaTag('meta[name="title"]', 'content', displayTitle);
  updateMetaTag('meta[name="description"]', 'content', description);
  updateMetaTag('meta[name="theme-color"]', 'content', primaryColor);

  updateMetaTag('meta[property="og:title"]', 'content', displayTitle);
  updateMetaTag('meta[property="og:site_name"]', 'content', siteName);
  updateMetaTag('meta[property="og:description"]', 'content', description);

  // OG Image (Absolute URL fallback if relative)
  const fullImageUrl = settings.logoUrl
    ? (settings.logoUrl.startsWith('http') || settings.logoUrl.startsWith('data:') ? settings.logoUrl : `${window.location.origin}${settings.logoUrl}`)
    : `${window.location.origin}/logo.png`;

  updateMetaTag('meta[property="og:image"]', 'content', fullImageUrl);
  updateMetaTag('meta[property="og:image:secure_url"]', 'content', fullImageUrl);
  updateMetaTag('meta[property="og:image:alt"]', 'content', `${siteName} Logo`);

  updateMetaTag('meta[name="twitter:title"]', 'content', displayTitle);
  updateMetaTag('meta[name="twitter:description"]', 'content', description);
  updateMetaTag('meta[name="twitter:image"]', 'content', fullImageUrl);
  updateMetaTag('meta[name="twitter:image:alt"]', 'content', `${siteName} Logo`);
}

// Helper to extract prominent colors from an image URL or File
export async function extractProminentColorFromImageUrl(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          canvas.width = 50;
          canvas.height = 50;
          ctx.drawImage(img, 0, 0, 50, 50);

          const imageData = ctx.getImageData(0, 0, 50, 50).data;
          let r = 0, g = 0, b = 0, count = 0;

          // Find vibrant, non-black, non-white pixel
          const colorBuckets: { [hex: string]: number } = {};

          for (let i = 0; i < imageData.length; i += 4) {
            const pr = imageData[i];
            const pg = imageData[i + 1];
            const pb = imageData[i + 2];
            const pa = imageData[i + 3];

            if (pa < 128) continue; // Ignore transparent

            // Ignore pure black / very dark gray and pure white
            const brightness = (pr * 299 + pg * 587 + pb * 114) / 1000;
            if (brightness < 25 || brightness > 235) continue;

            const hex = rgbToHex(
              Math.round(pr / 16) * 16,
              Math.round(pg / 16) * 16,
              Math.round(pb / 16) * 16
            );
            colorBuckets[hex] = (colorBuckets[hex] || 0) + 1;
            r += pr;
            g += pg;
            b += pb;
            count++;
          }

          if (count === 0) return resolve(null);

          // Find most frequent non-neutral color
          let maxCount = 0;
          let topColor = rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));

          for (const [hex, cnt] of Object.entries(colorBuckets)) {
            if (cnt > maxCount) {
              maxCount = cnt;
              topColor = hex;
            }
          }

          resolve(topColor);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    } catch {
      resolve(null);
    }
  });
}
