import fs from 'fs';
import path from 'path';

const filesToProcess = [
  'src/components/layout/Navbar.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/layout/CartDrawer.tsx',
  'src/components/layout/QuickViewModal.tsx',
  'src/components/layout/LiveDemoModal.tsx',
  'src/components/common/ProductCard.tsx',
  'src/components/common/ProductCardSkeleton.tsx',
  'src/components/common/ProductDetailsSkeleton.tsx',
  'src/components/common/BackToTop.tsx',
  'src/components/common/CustomerReviews.tsx',
  'src/components/ImageUploadInput.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/ShopPage.tsx',
  'src/pages/ProductDetailsPage.tsx',
  'src/pages/CartPage.tsx',
  'src/pages/CheckoutPage.tsx',
  'src/pages/OrderSuccessPage.tsx',
  'src/pages/CustomerDashboardPage.tsx',
  'src/pages/WishlistPage.tsx',
  'src/pages/ComparePage.tsx',
  'src/pages/AuthPage.tsx',
  'src/pages/ForgotPasswordPage.tsx',
  'src/pages/ResetPasswordPage.tsx',
  'src/pages/VerifyEmailPage.tsx',
  'src/pages/StaticPages.tsx',
  'src/pages/AdminDashboardPage.tsx',
];

for (const relPath of filesToProcess) {
  const filePath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Background and border containers
  content = content
    // Specific compound classes
    .replace(/from-sky-100 via-white to-sky-50/g, 'from-zinc-100 via-white to-orange-50/30')
    .replace(/from-sky-600 to-indigo-600/g, 'from-zinc-950 via-zinc-900 to-orange-600')
    .replace(/from-sky-500 to-sky-700/g, 'from-orange-500 to-orange-600')
    .replace(/from-sky-600 to-sky-700/g, 'from-orange-600 to-orange-700')
    .replace(/from-sky-500 to-indigo-600/g, 'from-zinc-900 via-orange-600 to-orange-500')
    .replace(/from-blue-600 to-sky-600/g, 'from-zinc-900 to-orange-600')
    .replace(/from-sky-50 to-sky-100/g, 'from-zinc-50 to-orange-50/50')
    .replace(/from-sky-500\/10 to-sky-600\/20/g, 'from-orange-500/10 to-orange-600/20')
    .replace(/from-sky-600\/20 to-sky-700\/40/g, 'from-zinc-900/60 to-orange-950/80')

    // Selection
    .replace(/selection:bg-sky-600/g, 'selection:bg-orange-500')
    .replace(/selection:bg-blue-600/g, 'selection:bg-orange-500')

    // Sky colors
    .replace(/bg-sky-950/g, 'bg-zinc-950')
    .replace(/text-sky-950/g, 'text-zinc-950')
    .replace(/border-sky-950/g, 'border-zinc-950')

    .replace(/bg-sky-900/g, 'bg-zinc-900')
    .replace(/text-sky-900/g, 'text-zinc-900')
    .replace(/border-sky-900/g, 'border-zinc-900')
    .replace(/hover:bg-sky-900/g, 'hover:bg-zinc-900')
    .replace(/hover:text-sky-900/g, 'hover:text-zinc-900')

    .replace(/bg-sky-800/g, 'bg-zinc-800')
    .replace(/text-sky-800/g, 'text-zinc-800')
    .replace(/border-sky-800/g, 'border-zinc-800')
    .replace(/hover:bg-sky-800/g, 'hover:bg-zinc-800')
    .replace(/hover:text-sky-800/g, 'hover:text-zinc-800')

    .replace(/bg-sky-700/g, 'bg-zinc-800')
    .replace(/text-sky-700/g, 'text-zinc-700')
    .replace(/border-sky-700/g, 'border-zinc-700')
    .replace(/hover:bg-sky-700/g, 'hover:bg-orange-700')
    .replace(/hover:text-sky-700/g, 'hover:text-orange-600')

    .replace(/bg-sky-600/g, 'bg-orange-600')
    .replace(/text-sky-600/g, 'text-orange-600')
    .replace(/border-sky-600/g, 'border-orange-600')
    .replace(/hover:bg-sky-600/g, 'hover:bg-orange-600')
    .replace(/hover:text-sky-600/g, 'hover:text-orange-600')
    .replace(/focus:border-sky-600/g, 'focus:border-orange-500')
    .replace(/focus:ring-sky-600/g, 'focus:ring-orange-500')

    .replace(/bg-sky-500/g, 'bg-orange-500')
    .replace(/text-sky-500/g, 'text-orange-500')
    .replace(/border-sky-500/g, 'border-orange-500')
    .replace(/hover:bg-sky-500/g, 'hover:bg-orange-500')
    .replace(/hover:text-sky-500/g, 'hover:text-orange-500')
    .replace(/focus:border-sky-500/g, 'focus:border-orange-500')
    .replace(/focus:ring-sky-500/g, 'focus:ring-orange-500')

    .replace(/bg-sky-400/g, 'bg-orange-400')
    .replace(/text-sky-400/g, 'text-orange-500')
    .replace(/border-sky-400/g, 'border-orange-400')
    .replace(/hover:bg-sky-400/g, 'hover:bg-orange-400')
    .replace(/hover:text-sky-400/g, 'hover:text-orange-500')

    .replace(/bg-sky-300/g, 'bg-orange-300')
    .replace(/text-sky-300/g, 'text-orange-400')
    .replace(/border-sky-300/g, 'border-zinc-300')
    .replace(/hover:bg-sky-300/g, 'hover:bg-orange-300')
    .replace(/hover:text-sky-300/g, 'hover:text-orange-400')

    .replace(/bg-sky-200/g, 'bg-zinc-200')
    .replace(/text-sky-200/g, 'text-zinc-300')
    .replace(/border-sky-200/g, 'border-zinc-200')
    .replace(/hover:bg-sky-200/g, 'hover:bg-zinc-200')

    .replace(/bg-sky-100/g, 'bg-zinc-100')
    .replace(/text-sky-100/g, 'text-zinc-100')
    .replace(/border-sky-100/g, 'border-zinc-200')
    .replace(/hover:bg-sky-100/g, 'hover:bg-zinc-100')

    .replace(/bg-sky-50/g, 'bg-zinc-50')
    .replace(/text-sky-50/g, 'text-zinc-50')
    .replace(/border-sky-50/g, 'border-zinc-100')
    .replace(/hover:bg-sky-50/g, 'hover:bg-zinc-100')

    // Remaining generic sky- instances
    .replace(/sky-(\d+)/g, (match, p1) => {
      const num = parseInt(p1, 10);
      if (num >= 800) return `zinc-${num}`;
      if (num >= 600) return `orange-${num}`;
      if (num >= 400) return `orange-${num}`;
      return `zinc-${num}`;
    })

    // Blue colors
    .replace(/bg-blue-900/g, 'bg-zinc-900')
    .replace(/text-blue-900/g, 'text-zinc-900')
    .replace(/bg-blue-800/g, 'bg-zinc-800')
    .replace(/text-blue-800/g, 'text-zinc-800')
    .replace(/bg-blue-700/g, 'bg-zinc-800')
    .replace(/text-blue-700/g, 'text-zinc-700')
    .replace(/bg-blue-600/g, 'bg-orange-600')
    .replace(/text-blue-600/g, 'text-orange-600')
    .replace(/border-blue-600/g, 'border-orange-600')
    .replace(/hover:bg-blue-700/g, 'hover:bg-orange-700')
    .replace(/hover:bg-blue-600/g, 'hover:bg-orange-600')
    .replace(/hover:text-blue-600/g, 'hover:text-orange-600')
    .replace(/bg-blue-500/g, 'bg-orange-500')
    .replace(/text-blue-500/g, 'text-orange-500')
    .replace(/border-blue-500/g, 'border-orange-500')
    .replace(/bg-blue-100/g, 'bg-orange-100')
    .replace(/text-blue-100/g, 'text-orange-800')
    .replace(/bg-blue-50/g, 'bg-zinc-50')
    .replace(/border-blue-200/g, 'border-zinc-200')
    .replace(/border-blue-100/g, 'border-zinc-200');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${relPath}`);
}
