import React, { useState, useEffect } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { QuickViewModal } from './components/layout/QuickViewModal';
import { LiveDemoModal } from './components/layout/LiveDemoModal';
import { BackToTop } from './components/common/BackToTop';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { WishlistPage } from './pages/WishlistPage';
import { ComparePage } from './pages/ComparePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { StaticPages } from './pages/StaticPages';

import { Product, Order } from './types';
import { storeService } from './services/storeService';
import { updateDynamicBrowserMeta } from './utils/themeUtils';

export function AppContent() {
  const { isAuthenticated, returnTab, setReturnTab, isLoading } = useAuth();
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('product')) return 'product-details';
    if (params.get('category')) return 'shop';
    if (params.get('page')) return params.get('page') as string;
    return 'home';
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const productSlug = params.get('product');
    if (productSlug) {
      const p = storeService.getProducts().find(p => p.slug === productSlug);
      return p || null;
    }
    return null;
  });
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [liveDemoProduct, setLiveDemoProduct] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'all';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [compareProductIds, setCompareProductIds] = useState<[string, string] | null>(null);

  const [tabHistory, setTabHistory] = useState<string[]>([activeTab]);
  const [isGoingBack, setIsGoingBack] = useState(false);

  useEffect(() => {
    const handleStoreChange = () => {
      if (selectedProduct) {
        const updated = storeService.getProductById(selectedProduct.id);
        if (updated) setSelectedProduct(updated);
      }
      if (quickViewProduct) {
        const updated = storeService.getProductById(quickViewProduct.id);
        if (updated) setQuickViewProduct(updated);
      }
      if (liveDemoProduct) {
        const updated = storeService.getProductById(liveDemoProduct.id);
        if (updated) setLiveDemoProduct(updated);
      }
    };
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, [selectedProduct, quickViewProduct, liveDemoProduct]);

  useEffect(() => {
    storeService.syncWithCloud();
  }, []);

  useEffect(() => {
    if (isGoingBack) {
      setIsGoingBack(false);
      return;
    }
    setTabHistory(prev => {
      if (prev[prev.length - 1] !== activeTab) {
        return [...prev, activeTab];
      }
      return prev;
    });
  }, [activeTab, isGoingBack]);

  const handleGoBack = () => {
    if (tabHistory.length <= 1) return;
    const previousTab = tabHistory[tabHistory.length - 2];
    setIsGoingBack(true);
    setActiveTab(previousTab);
    setTabHistory(prev => {
      const newHistory = [...prev];
      newHistory.pop(); // remove current tab
      return newHistory;
    });
  };

  // Protected Route Guards & Redirects
  useEffect(() => {
    if (isLoading) return;
    const protectedTabs = ['account', 'customer-dashboard', 'my-downloads', 'my-orders', 'checkout'];
    const authTabs = ['auth', 'login', 'signup'];

    // 1. If unauthenticated user tries to access protected tab -> redirect to login & store return tab
    if (!isAuthenticated && protectedTabs.includes(activeTab)) {
      setReturnTab(activeTab);
      setActiveTab('login');
    }

    // 2. If authenticated user tries to access auth tabs -> redirect to account or returnTab
    if (isAuthenticated && authTabs.includes(activeTab)) {
      const destination = returnTab || 'account';
      setReturnTab(null);
      setActiveTab(destination);
    }
  }, [activeTab, isAuthenticated, returnTab, setReturnTab]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, selectedProduct]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('product-details');
  };

  const handleOpenCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setActiveTab('shop');
  };

  const handleOrderComplete = (order: Order) => {
    setCompletedOrder(order);
    setActiveTab('order-success');
  };

  const handleAuthSuccess = () => {
    const destination = returnTab || 'account';
    setReturnTab(null);
    setActiveTab(destination);
  };


  // Synchronize dynamic browser title, favicon, and social share tags
  useEffect(() => {
    const pageTitle = activeTab === 'product-details' && selectedProduct 
      ? selectedProduct.name 
      : activeTab === 'shop' && selectedCategorySlug && selectedCategorySlug !== 'all'
      ? `${selectedCategorySlug.charAt(0).toUpperCase() + selectedCategorySlug.slice(1)} Collection`
      : activeTab === 'admin'
      ? 'Admin Dashboard'
      : activeTab === 'cart'
      ? 'Shopping Cart'
      : activeTab === 'checkout'
      ? 'Checkout'
      : activeTab === 'my-account'
      ? 'Customer Account'
      : activeTab === 'wishlist'
      ? 'My Wishlist'
      : activeTab === 'compare'
      ? 'Compare Products'
      : activeTab === 'track-order' || activeTab === 'order-status'
      ? 'Track Live Order Status'
      : activeTab === 'auth'
      ? 'Account Sign In & Register'
      : activeTab === 'about'
      ? 'About Us'
      : activeTab === 'contact'
      ? 'Contact Us'
      : undefined;

    updateDynamicBrowserMeta(settings, pageTitle);
  }, [settings, activeTab, selectedProduct, selectedCategorySlug]);

  const isProtectedTab = ['account', 'customer-dashboard', 'my-downloads', 'my-orders', 'checkout', 'admin', 'admin-dashboard'].includes(activeTab);

  if (isLoading && isProtectedTab) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-white to-orange-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <div className="text-sm font-bold text-orange-600 uppercase tracking-widest animate-pulse">Loading Studio</div>
        </div>
      </div>
    );
  }

  const currentSiteName = settings.websiteName || 'Studio Production';
  const currentFavicon = settings.logoUrl || '/logo.svg';
  const currentShareImage = activeTab === 'product-details' && selectedProduct && selectedProduct.thumbnail
    ? (selectedProduct.thumbnail.startsWith('http') ? selectedProduct.thumbnail : `https://studio-production-six.vercel.app${selectedProduct.thumbnail}`)
    : (settings.logoUrl || 'https://studio-production-six.vercel.app/logo.png');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-white to-orange-50/30 text-zinc-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Helmet>
        <title>
          {activeTab === 'product-details' && selectedProduct 
            ? `${selectedProduct.name} - ${currentSiteName}` 
            : currentSiteName}
        </title>
        <link rel="icon" href={currentFavicon} />
        <link rel="shortcut icon" href={currentFavicon} />
        <link rel="apple-touch-icon" href={currentFavicon} />
        <meta 
          name="title" 
          content={activeTab === 'product-details' && selectedProduct ? `${selectedProduct.name} - ${currentSiteName}` : currentSiteName} 
        />
        <meta 
          name="description" 
          content={activeTab === 'product-details' && selectedProduct ? selectedProduct.shortDescription : (settings.tagline || settings.heroSubheadline || settings.footerAbout || currentSiteName)} 
        />
        <meta name="theme-color" content={settings.primaryColor || '#ea580c'} />
        <meta property="og:site_name" content={currentSiteName} />
        <meta property="og:type" content={activeTab === 'product-details' && selectedProduct ? "product" : "website"} />
        <meta property="og:url" content={activeTab === 'product-details' && selectedProduct ? `https://studio-production-six.vercel.app/?product=${selectedProduct.slug || selectedProduct.id}` : "https://studio-production-six.vercel.app/"} />
        <meta property="og:title" content={activeTab === 'product-details' && selectedProduct ? `${selectedProduct.name} - ${currentSiteName}` : currentSiteName} />
        <meta property="og:description" content={activeTab === 'product-details' && selectedProduct ? selectedProduct.shortDescription : (settings.tagline || settings.heroSubheadline || settings.footerAbout || currentSiteName)} />
        <meta property="og:image" content={currentShareImage} />
        <meta property="og:image:secure_url" content={currentShareImage} />
        <meta property="og:image:alt" content={`${currentSiteName} Logo`} />
        <meta name="twitter:card" content={activeTab === 'product-details' && selectedProduct ? "summary_large_image" : "summary"} />
        <meta name="twitter:url" content={activeTab === 'product-details' && selectedProduct ? `https://studio-production-six.vercel.app/?product=${selectedProduct.slug || selectedProduct.id}` : "https://studio-production-six.vercel.app/"} />
        <meta name="twitter:title" content={activeTab === 'product-details' && selectedProduct ? `${selectedProduct.name} - ${currentSiteName}` : currentSiteName} />
        <meta name="twitter:description" content={activeTab === 'product-details' && selectedProduct ? selectedProduct.shortDescription : (settings.tagline || settings.heroSubheadline || settings.footerAbout || currentSiteName)} />
        <meta name="twitter:image" content={currentShareImage} />
        <meta name="twitter:image:alt" content={`${currentSiteName} Logo`} />
        
        {activeTab === 'product-details' && selectedProduct && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": selectedProduct.name,
              "image": selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.thumbnail],
              "description": selectedProduct.shortDescription,
              "sku": selectedProduct.id,
              "brand": {
                "@type": "Brand",
                "name": settings.websiteName
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": settings.currencyCode || "USD",
                "price": selectedProduct.price,
                "availability": "https://schema.org/InStock"
              }
            })}
          </script>
        )}
      </Helmet>
      
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCart={() => setCartDrawerOpen(true)}
        onSelectCategory={handleOpenCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onGoBack={handleGoBack}
        canGoBack={tabHistory.length > 1}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onSelectCategory={handleOpenCategory}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'shop' && (
          <ShopPage
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onCompare={() => setActiveTab('compare')}
            initialCategorySlug={selectedCategorySlug}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeTab === 'product-details' && selectedProduct && (
          <ProductDetailsPage
            product={selectedProduct}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenLiveDemo={(p) => setLiveDemoProduct(p)}
            onNavigateToCheckout={() => setActiveTab('checkout')}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'cart' && (
          <CartPage
            onNavigateToCheckout={() => setActiveTab('checkout')}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'checkout' && (
          <CheckoutPage
            onOrderComplete={handleOrderComplete}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'order-success' && (
          <OrderSuccessPage
            order={completedOrder}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'wishlist' && (
          <WishlistPage
            onSelectProduct={handleSelectProduct}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'compare' && (
          <ComparePage
            initialProduct1Id={compareProductIds?.[0]}
            initialProduct2Id={compareProductIds?.[1]}
            onSelectProduct={handleSelectProduct}
            setActiveTab={setActiveTab}
          />
        )}

        {(activeTab === 'account' || activeTab === 'customer-dashboard' || activeTab === 'my-downloads' || activeTab === 'my-orders' || activeTab === 'track-order' || activeTab === 'order-status') && (
          <CustomerDashboardPage
            initialTab={
              activeTab === 'my-downloads' 
                ? 'downloads' 
                : activeTab === 'my-orders' 
                  ? 'orders' 
                  : (activeTab === 'track-order' || activeTab === 'order-status')
                    ? 'track-order'
                    : 'overview'
            }
            onSelectProduct={handleSelectProduct}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'admin-dashboard' && (
          <AdminDashboardPage setActiveTab={setActiveTab} />
        )}

        {(activeTab === 'auth' || activeTab === 'login' || activeTab === 'signup') && (
          <AuthPage 
            initialTab={activeTab === 'signup' ? 'signup' : 'login'}
            onSuccess={handleAuthSuccess}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'forgot-password' && (
          <ForgotPasswordPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'reset-password' && (
          <ResetPasswordPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'verify-email' && (
          <VerifyEmailPage 
            setActiveTab={setActiveTab} 
            onVerifiedSuccess={() => setActiveTab('account')}
          />
        )}

        {['about', 'contact', 'faq', 'terms', 'privacy', 'license'].includes(activeTab) && (
          <StaticPages pageType={activeTab as any} />
        )}
      </main>

      {/* Footer */}
      <Footer
        setActiveTab={setActiveTab}
        onSelectCategory={handleOpenCategory}
      />

      {/* Sliding Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onNavigateToCart={() => {
          setCartDrawerOpen(false);
          setActiveTab('cart');
        }}
        onNavigateToCheckout={() => {
          setCartDrawerOpen(false);
          setActiveTab('checkout');
        }}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onSelectProduct={handleSelectProduct}
        onOpenLiveDemo={(p) => setLiveDemoProduct(p)}
      />

      {/* Interactive Live Demo Simulator Modal */}
      <BackToTop />

      <LiveDemoModal
        product={liveDemoProduct}
        onClose={() => setLiveDemoProduct(null)}
      />

    </div>
  );
}

import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <SettingsProvider>
                <AppContent />
              </SettingsProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
