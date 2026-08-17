import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Star, 
  Zap, 
  CheckCircle2, 
  Code2, 
  Layout, 
  Smartphone, 
  BookOpen, 
  Video, 
  Wand2, 
  TrendingUp,
  Layers,
  Palette
} from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/common/ProductCard';
import { ProductCardSkeleton } from '../components/common/ProductCardSkeleton';
import { storeService } from '../services/storeService';
import { useSettings } from '../contexts/SettingsContext';
import { useCart } from '../contexts/CartContext';

interface HomePageProps {
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onSelectCategory: (slug: string) => void;
  setActiveTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectProduct,
  onQuickView,
  onSelectCategory,
  setActiveTab
}) => {
  const { settings } = useSettings();
  const { applyCoupon, setIsCartOpen } = useCart();
  const [claimedNotice, setClaimedNotice] = React.useState<string | null>(null);
  const [activeCatalogTab, setActiveCatalogTab] = React.useState<string>('all');
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const handleStoreChange = () => forceUpdate();
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  const handleClaimDiscount = () => {
    const code = settings.discountBannerCode || 'WELCOME20';
    const res = applyCoupon(code);
    setClaimedNotice(`Coupon ${code} claimed! ${res.message}`);
    setTimeout(() => setClaimedNotice(null), 4000);
    setIsCartOpen(true);
  };

  const products = storeService.getProducts().filter(p => p.published);
  const categories = storeService.getCategories().filter(c => c.enabled);
  const reviews = storeService.getReviews().filter(r => r.status === 'approved');

  // Product subsections
  const featuredProducts = products.filter(p => p.isFeatured);
  const bestSellers = products.filter(p => p.isBestSeller);
  const newArrivals = products.filter(p => p.isNew);
  const websites = products.filter(p => p.productType === 'Website' || p.productType === 'App' || p.categorySlug === 'websites');
  const catalogProducts = activeCatalogTab === 'all' 
    ? products 
    : products.filter(p => p.categorySlug === activeCatalogTab || (activeCatalogTab === 'websites' && (p.productType === 'Website' || p.productType === 'App')));

  return (
    <div className="space-y-20 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-zinc-200/80">
        {settings.heroCoverImage && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src={settings.heroCoverImage} 
              alt="Hero Cover Background" 
              className="w-full h-full object-cover object-center" 
            />
            {settings.heroBackgroundMode === 'clean' ? (
              <div className="absolute inset-0 bg-white/92"></div>
            ) : settings.heroBackgroundMode === 'subtle_pattern' ? (
              <div className="absolute inset-0 bg-white/85 backdrop-blur-xs bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
            ) : (
              <div className="absolute inset-0 bg-white/85 backdrop-blur-xs sm:bg-gradient-to-r sm:from-white/95 sm:via-white/90 sm:to-white/70"></div>
            )}
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`grid grid-cols-1 ${settings.heroShowcaseEnabled !== false ? 'lg:grid-cols-12 gap-12' : 'max-w-4xl mx-auto'} items-center`}>
            
            {/* Hero Text */}
            <div className={`${settings.heroShowcaseEnabled !== false ? 'lg:col-span-7 text-center lg:text-left' : 'text-center'} space-y-6`}>
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-600 text-white text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{settings.tagline || 'Everything Digital, All in One Place.'}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.08]">
                {settings.heroHeadline}
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                {settings.heroSubheadline}
              </p>

              {/* CTAs */}
              <div className={`flex flex-wrap items-center ${settings.heroShowcaseEnabled !== false ? 'justify-center lg:justify-start' : 'justify-center'} gap-4 pt-2`}>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-2xl shadow-xl shadow-orange-600/20 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  {settings.heroCtaPrimary || 'Explore Collection'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('featured-categories');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-7 py-4 bg-white hover:bg-orange-50/50 border border-zinc-200 text-zinc-800 hover:text-orange-900 text-sm font-bold rounded-2xl transition-all shadow-xs cursor-pointer"
                >
                  {settings.heroCtaSecondary || 'Browse Categories'}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className={`pt-6 border-t border-zinc-200/80 flex flex-wrap items-center ${settings.heroShowcaseEnabled !== false ? 'justify-center lg:justify-start' : 'justify-center'} gap-6 text-xs font-medium text-zinc-600`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant File Download</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Commercial License Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Lifetime Free Updates</span>
                </div>
              </div>

            </div>

            {/* Hero Visual Mockup / Right Showcase Card */}
            {settings.heroShowcaseEnabled !== false && (
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  
                  {settings.heroShowcaseDisplayMode === 'cover_behind' ? (
                    /* Display Mode: Cover Photo Behind with Overlay Content */
                    <div className="relative min-h-[420px] rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 p-6 flex flex-col justify-between group transform lg:-rotate-1 hover:rotate-0 transition-all duration-500 bg-zinc-950">
                      {/* Cover Photo Background */}
                      <img
                        src={settings.heroShowcaseImage || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'}
                        alt={settings.heroShowcaseTitle || 'Showcase Cover'}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/65 to-zinc-950/30"></div>

                      {/* Top Bar */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase bg-white/20 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md font-bold">
                          {settings.heroShowcaseBadge || 'Featured Digital Asset'}
                        </span>
                        <span className="text-xs font-bold text-amber-300 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                          {settings.heroShowcaseRating || '4.9 ★★★★★'}
                        </span>
                      </div>

                      {/* Bottom Info & Brief Description */}
                      <div className="relative z-10 space-y-3 pt-12">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-xs">
                            {settings.heroShowcaseTitle || 'Aura Studio — Portfolio Theme'}
                          </h3>
                          {settings.heroShowcaseSubtitle && (
                            <p className="text-xs text-zinc-300 font-medium">
                              {settings.heroShowcaseSubtitle}
                            </p>
                          )}
                          {settings.heroShowcaseDescription && (
                            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed bg-black/30 backdrop-blur-xs p-2 rounded-xl border border-white/10 mt-1.5">
                              {settings.heroShowcaseDescription}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/15">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-white">
                              {settings.heroShowcasePrice || '$39'}
                            </span>
                            {settings.heroShowcaseOriginalPrice && (
                              <span className="text-xs text-zinc-400 line-through">
                                {settings.heroShowcaseOriginalPrice}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setActiveTab(settings.heroShowcaseLink || 'shop')}
                            className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl hover:bg-zinc-100 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{settings.heroShowcaseButtonText || 'Inspect Item'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode: Standard Card (Cover Photo Inside) */
                    <div className="bg-zinc-950 text-white p-6 rounded-3xl shadow-2xl border border-zinc-800 space-y-4 transform lg:-rotate-1 hover:rotate-0 transition-all duration-500">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md font-bold">
                          {settings.heroShowcaseBadge || 'Featured Digital Asset'}
                        </span>
                        <span className="text-xs font-bold text-amber-400">
                          {settings.heroShowcaseRating || '4.9 ★★★★★'}
                        </span>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 group">
                        <img
                          src={settings.heroShowcaseImage || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'}
                          alt={settings.heroShowcaseTitle || 'Showcase Cover'}
                          referrerPolicy="no-referrer"
                          className="w-full h-52 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-base font-bold text-white">
                          {settings.heroShowcaseTitle || 'Aura Studio — Portfolio Theme'}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium">
                          {settings.heroShowcaseSubtitle || 'React 19, TypeScript, Tailwind CSS, Motion'}
                        </p>
                        {settings.heroShowcaseDescription && (
                          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 pt-0.5">
                            {settings.heroShowcaseDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-white">
                            {settings.heroShowcasePrice || '$39'}
                          </span>
                          {settings.heroShowcaseOriginalPrice && (
                            <span className="text-xs text-zinc-500 line-through">
                              {settings.heroShowcaseOriginalPrice}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setActiveTab(settings.heroShowcaseLink || 'shop')}
                          className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl hover:bg-zinc-100 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{settings.heroShowcaseButtonText || 'Inspect Item'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Floating Badge */}
                  {settings.heroShowcaseDownloadsText && (
                    <div className="absolute -bottom-6 -left-6 bg-white border border-zinc-200 text-zinc-900 p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center gap-3 hidden sm:flex">
                      <div className="p-2.5 sm:p-3 bg-zinc-100 text-zinc-900 rounded-xl">
                        <Download className="w-5 h-5 text-zinc-900" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900">
                          {settings.heroShowcaseDownloadsText || '12,400+ Downloads'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {settings.heroShowcaseDownloadsSubtext || 'Trusted by creators worldwide'}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES SECTION */}
      <section id="featured-categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Product Catalog</span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">
              {categories.length} Product {categories.length === 1 ? 'Category' : 'Categories'}
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('shop')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-2 md:mt-0 cursor-pointer"
          >
            View All Products &rarr;
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-center space-y-3">
            <p className="text-sm font-semibold text-zinc-600">No product categories available yet.</p>
            <button
              onClick={() => setActiveTab('shop')}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-orange-700"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-2 sm:grid-cols-2 ${
            categories.length === 1
              ? 'lg:grid-cols-1 max-w-md mx-auto'
              : categories.length === 2
              ? 'lg:grid-cols-2 max-w-2xl mx-auto'
              : categories.length === 3
              ? 'lg:grid-cols-3 max-w-5xl mx-auto'
              : 'lg:grid-cols-4'
          } gap-4 sm:gap-6`}>
            {categories.map((cat, i) => {
              const catCount = products.filter(p => p.categorySlug === cat.slug || (cat.slug === 'websites' && (p.productType === 'Website' || p.productType === 'App'))).length;

              return (
                <div
                  key={cat.id || i}
                  onClick={() => {
                    onSelectCategory(cat.slug);
                    setActiveTab('shop');
                  }}
                  className="group p-5 bg-white border border-zinc-200/80 hover:border-orange-500 rounded-2xl cursor-pointer hover:shadow-md transition-all text-left space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-100">
                      <img
                        src={cat.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'}
                        alt={cat.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                      {catCount} {catCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-1">{cat.name}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">{cat.description}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Explore category</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TRENDING PRODUCTS & BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h2 className="text-2xl font-black text-zinc-900">Trending & Best Sellers</h2>
          </div>
          <button
            onClick={() => setActiveTab('shop')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            Explore All &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(bestSellers.length > 0 ? bestSellers : products).slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onQuickView={onQuickView}
              onCompare={() => setActiveTab('compare')}
            />
          ))}
        </div>
      </section>

      {/* FEATURED WEBSITES & FULL-STACK APPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Applications & Codebases</span>
            <h2 className="text-2xl font-black text-zinc-900 mt-1">Websites & Full-Stack Apps</h2>
          </div>
          <button
            onClick={() => {
              onSelectCategory('websites');
              setActiveTab('shop');
            }}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            View Web Catalog &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {websites.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </section>

      {/* WEBSITE AND ALL PRODUCTS (Dynamic Tabs Catalog) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Comprehensive Inventory</span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">Website & All Products</h2>
          </div>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCatalogTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCatalogTab === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              All Products ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(p => p.categorySlug === cat.slug || (cat.slug === 'websites' && (p.productType === 'Website' || p.productType === 'App'))).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCatalogTab(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeCatalogTab === cat.slug
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {catalogProducts.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onQuickView={onQuickView}
            />
          ))}
        </div>

        {catalogProducts.length > 8 && (
          <div className="text-center pt-4">
            <button
              onClick={() => {
                if (activeCatalogTab !== 'all') {
                  onSelectCategory(activeCatalogTab);
                }
                setActiveTab('shop');
              }}
              className="px-6 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Explore All {catalogProducts.length} Products in Shop &rarr;
            </button>
          </div>
        )}
      </section>

      {/* WHY STUDIO COLLECTION */}
      <section className="bg-transparent border-y border-orange-100/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">The Studio Standard</span>
            <h2 className="text-3xl font-black text-orange-900">Built for Modern Creators & Engineers</h2>
            <p className="text-xs text-orange-600">Every digital item in our collection passes rigorous functional and visual audits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl border border-orange-100/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-orange-900">Clean Production Code</h3>
              <p className="text-xs text-orange-600 leading-relaxed">
                Written with modern React 19, TypeScript, and Tailwind CSS. Fully componentized and structured for scalable deployment.
              </p>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-orange-100/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-orange-900">Commercial License</h3>
              <p className="text-xs text-orange-600 leading-relaxed">
                Use purchased digital products in personal and commercial client work with zero copyright headaches.
              </p>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-orange-100/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-orange-900">Instant Access & Updates</h3>
              <p className="text-xs text-orange-600 leading-relaxed">
                Direct file access from your Customer Downloads dashboard with lifetime access to newer framework updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Verified Customer Feedback</span>
          <h2 className="text-2xl sm:text-3xl font-black text-orange-900">Customer Reviews</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-orange-100/80 text-center max-w-xl mx-auto space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <h3 className="text-base font-bold text-orange-900">100% Authentic Customer Feedback</h3>
            <p className="text-xs text-orange-600 max-w-md mx-auto leading-relaxed">
              We only display genuine reviews from verified customers after a completed purchase. Purchase any template or digital asset today and leave your feedback!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 bg-white rounded-2xl border border-orange-100/80 shadow-sm space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-orange-700 italic leading-relaxed">"{rev.comment}"</p>

                <div className="flex items-center gap-3 pt-3 border-t border-orange-50">
                  <img
                    src={rev.userAvatar}
                    alt={rev.userName}
                    className="w-9 h-9 rounded-full object-cover bg-orange-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-orange-900">{rev.userName}</h4>
                    <p className="text-[10px] text-orange-400">Verified Purchaser</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
