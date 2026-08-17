import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreVertical,
  Search, 
  ShoppingBag, 
  Heart, 
  User, 
  Grid, 
  ChevronDown, 
  Sparkles, 
  ShieldAlert, 
  SlidersHorizontal,
  Code,
  Layout,
  Smartphone,
  Palette,
  FileText,
  Video,
  BookOpen,
  Box,
  Layers,
  Wand2,
  X,
  Menu,
  CheckCircle2,
  LogOut,
  Moon,
  Sun,
  FolderTree,
  ArrowLeftRight,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { storeService } from '../../services/storeService';
import { Product, Category } from '../../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCart?: () => void;
  onSelectCategory?: (slug: string) => void;
  onSelectProduct?: (product: Product) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCart,
  onSelectCategory,
  onSelectProduct,
  searchQuery,
  setSearchQuery,
  onGoBack,
  canGoBack
}) => {
  const { user, isAdmin, isSuperAdmin, logout, switchRole } = useAuth();
  const { cart, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { settings } = useSettings();
  const { isDarkMode, toggleTheme } = useTheme();

  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  useEffect(() => {
    const handleStoreChange = () => forceUpdate();
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  const categories = storeService.getCategories().filter(c => c.enabled);
  const products = storeService.getProducts().filter(p => p.published);

  // Filter products for quick search preview
  const searchResults = searchQuery.trim() 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productType.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'apps': return <Smartphone className="w-4 h-4 text-orange-500" />;
      case 'websites': return <Layout className="w-4 h-4 text-orange-500" />;
      case 'portfolio-websites': return <Layout className="w-4 h-4 text-orange-600" />;
      case 'templates': return <Layers className="w-4 h-4 text-orange-500" />;
      case 'ui-ux-kits': return <Grid className="w-4 h-4 text-orange-600" />;
      case 'graphics': return <Palette className="w-4 h-4 text-orange-500" />;
      case 'pdf': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'e-books': return <BookOpen className="w-4 h-4 text-orange-600" />;
      case 'video': return <Video className="w-4 h-4 text-orange-500" />;
      case 'source-code': return <Code className="w-4 h-4 text-orange-600" />;
      case 'ai-tools': return <Wand2 className="w-4 h-4 text-orange-500" />;
      default: return <Box className="w-4 h-4 text-zinc-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      
      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Back Button */}
          <div className="flex items-center gap-4 lg:gap-6">
            {canGoBack && onGoBack && (
              <button
                onClick={onGoBack}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors shadow-sm"
                title="Go Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 group text-left"
            >
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.websiteName} 
                  className="h-9 w-auto max-w-[140px] object-contain rounded-xl"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-lg tracking-tighter group-hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20">
                  {(settings.logoText || settings.websiteName || 'S').trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-base font-black tracking-tight text-zinc-900 block leading-tight">
                  {settings.logoText || settings.websiteName}
                </span>
                <span className="text-[10px] font-medium text-zinc-500 block uppercase tracking-widest leading-none">
                  {settings.logoSubtext || 'Digital Collection'}
                </span>
              </div>
            </button>

            {/* Category Mega Menu Dropdown */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setCategoriesMenuOpen(!categoriesMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200/70 rounded-xl transition-all"
              >
                <Grid className="w-4 h-4 text-orange-600" />
                <span>Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Dropdown Panel */}
              {categoriesMenuOpen && (
                <div 
                  className="absolute left-0 mt-2 w-[720px] bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 z-50 grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setCategoriesMenuOpen(false)}
                >
                  <div className="col-span-3 border-b border-zinc-100 pb-3 mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">All Categories</span>
                    <button 
                      onClick={() => { setActiveTab('shop'); setCategoriesMenuOpen(false); }}
                      className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1"
                    >
                      Browse Full Catalog &rarr;
                    </button>
                  </div>

                  {categories.map((cat) => {
                    const catProducts = products.filter(p => p.categorySlug === cat.slug).length;
                    return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(cat.slug);
                        setActiveTab('shop');
                        setCategoriesMenuOpen(false);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50/50 border border-transparent hover:border-orange-200/50 transition-all text-left group"
                    >
                      <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-orange-600 group-hover:text-white transition-colors text-zinc-700">
                        {getCategoryIcon(cat.slug)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-900 group-hover:text-orange-600 truncate">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {catProducts} products
                        </div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-md hidden md:block relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search apps, websites, UI kits, templates, e-books..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-100 border border-transparent rounded-xl focus:bg-white focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all text-zinc-900 placeholder:text-zinc-400"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Search Preview */}
            {searchFocused && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="p-2 border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 px-3 uppercase tracking-wider">
                  Matching Digital Products ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No products found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {searchResults.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(prod);
                          setActiveTab('product-details');
                          setSearchFocused(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors text-left"
                      >
                        <img
                          src={prod.thumbnail}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded-lg bg-zinc-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-900 truncate">{prod.name}</h4>
                          <p className="text-[11px] text-zinc-500">{prod.categoryName} • {prod.price === 0 ? 'Free' : `${settings.currencySymbol}${prod.price}`}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setActiveTab('shop');
                    setSearchFocused(false);
                  }}
                  className="w-full py-2.5 bg-zinc-50 text-center text-xs font-semibold text-zinc-800 hover:bg-zinc-100 border-t border-zinc-100"
                >
                  View All Results in Shop &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Action Icons & User Navigation */}
          <div className="flex items-center gap-3">
            
            {/* Compare Tool Button */}
            <button
              onClick={() => setActiveTab('compare')}
              className={`p-2 rounded-xl relative transition-all ${
                activeTab === 'compare'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                  : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Compare Products Side-by-Side"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`p-2 rounded-xl relative transition-all ${
                activeTab === 'wishlist'
                  ? 'bg-red-50 text-red-600'
                  : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="View Wishlist & Saved Favorites"
            >
              <Heart className={`w-5 h-5 ${wishlistIds.length > 0 || activeTab === 'wishlist' ? 'fill-red-500 text-red-500' : ''}`} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl relative transition-all"
              title="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Top Corner Sign In, Create, and Admin Panel Navigation Buttons */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-3 py-1.5 font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className="px-3 py-1.5 font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/20 transition-all"
                >
                  Create
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5">
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-colors relative text-zinc-700 hover:text-zinc-900"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Account Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 rounded-xl transition-all"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover border border-zinc-200" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                    {user ? user.name.charAt(0) : <User className="w-4 h-4" />}
                  </div>
                )}
                <span className="text-xs font-semibold text-zinc-800 hidden sm:block max-w-[100px] truncate">
                  {user ? user.name : 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  {user ? (
                    <>
                      <div className="p-2.5 border-b border-zinc-100 mb-1">
                        <p className="font-bold text-zinc-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 uppercase">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => { setActiveTab('admin-dashboard'); setUserMenuOpen(false); }}
                          className="w-full text-left px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl flex items-center gap-2 font-bold mb-1 border border-amber-200"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600" /> Admin Control Panel
                        </button>
                      )}

                      <button
                        onClick={() => { setActiveTab('customer-dashboard'); setUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-100 rounded-xl flex items-center gap-2 font-medium text-zinc-700"
                      >
                        <User className="w-4 h-4 text-orange-600" /> Customer Dashboard
                      </button>

                      <button
                        onClick={() => { setActiveTab('track-order'); setUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-100 rounded-xl flex items-center gap-2 font-medium text-zinc-700"
                      >
                        <Clock className="w-4 h-4 text-orange-600" /> Track Order Status
                      </button>

                      <button
                        onClick={() => { setActiveTab('my-downloads'); setUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-100 rounded-xl flex items-center gap-2 font-medium text-zinc-700"
                      >
                        <FolderTree className="w-4 h-4 text-orange-600" /> My Downloads
                      </button>

                      <div className="border-t border-zinc-100 mt-1 pt-1">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 space-y-1.5">
                      <button
                        onClick={() => { setActiveTab('login'); setUserMenuOpen(false); }}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-center transition-colors shadow-lg shadow-orange-600/20"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => { setActiveTab('signup'); setUserMenuOpen(false); }}
                        className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold rounded-xl text-center transition-colors"
                      >
                        Create Account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-700 hover:text-zinc-900 rounded-xl"
            >
              <MoreVertical className="w-6 h-6" />
            </button>

          </div>

        </div>

        {/* Primary Categories & Page Links Ribbon */}
        <nav className="hidden lg:flex items-center gap-1 py-2 text-xs font-semibold text-zinc-700 border-t border-zinc-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'home' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            Home
          </button>
          
          <button
            onClick={() => { setActiveTab('shop'); if (onSelectCategory) onSelectCategory('all'); }}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'shop' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            All Products
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'compare' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Compare
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                if (onSelectCategory) onSelectCategory(cat.slug);
                setActiveTab('shop');
              }}
              className="px-3 py-1.5 rounded-lg hover:text-zinc-900 hover:bg-zinc-100 transition-colors whitespace-nowrap"
            >
              {cat.name}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { if (onSelectCategory) onSelectCategory('deals'); setActiveTab('shop'); }}
              className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-900 border border-orange-200/80 hover:bg-orange-100 transition-all font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Special Deals
            </button>
          </div>
        </nav>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white p-4 space-y-4 animate-in slide-in-from-top-2 overflow-y-auto max-h-[calc(100vh-73px)]">
          
          {/* Mobile Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-100 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all text-zinc-900"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            
            {/* Quick Search Preview Mobile */}
            {searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="p-2 border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 px-3 uppercase tracking-wider">
                  Matching Products ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No products found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
                    {searchResults.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(prod);
                          setActiveTab('product-details');
                          setSearchQuery('');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors text-left"
                      >
                        <img
                          src={prod.thumbnail}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded-lg bg-zinc-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-900 truncate">{prod.name}</h4>
                          <p className="text-[11px] text-zinc-500">{prod.categoryName} • {prod.price === 0 ? 'Free' : `${settings.currencySymbol}${prod.price}`}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-50 rounded-xl text-left hover:bg-zinc-100"
            >
              Home
            </button>
            <button
              onClick={() => { setActiveTab('shop'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-50 rounded-xl text-left hover:bg-zinc-100"
            >
              Shop Catalog
            </button>
            <button
              onClick={() => { setActiveTab('compare'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-50 rounded-xl text-left hover:bg-zinc-100 flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4 text-orange-600" /> Compare Tool
            </button>
            <button
              onClick={() => { setActiveTab('wishlist'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-red-50 text-red-700 rounded-xl text-left hover:bg-red-100 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 fill-red-500" /> Favorites</span>
              <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-full">{wishlistIds.length}</span>
            </button>
            <button
              onClick={() => { setIsCartOpen(true); setMobileMenuOpen(false); }}
              className="p-2.5 bg-orange-600 text-white rounded-xl text-left hover:bg-orange-700 flex items-center justify-between shadow-lg shadow-orange-600/20"
            >
              <span className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" /> Shopping Cart</span>
              <span className="text-[10px] bg-white text-orange-950 font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('customer-dashboard'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-50 rounded-xl text-left hover:bg-zinc-100"
            >
              My Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('track-order'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-50 rounded-xl text-left hover:bg-zinc-100 flex items-center justify-between"
            >
              <span>Track Order Status</span>
              <Clock className="w-3.5 h-3.5 text-orange-600" />
            </button>
            <button
              onClick={() => { setActiveTab('my-downloads'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-50 rounded-xl text-left hover:bg-zinc-100"
            >
              My Downloads
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-100">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">Categories</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActiveTab('shop'); if (onSelectCategory) onSelectCategory('all'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left group ${
                  activeTab === 'shop' && (!searchQuery) 
                    ? 'border-orange-600 bg-orange-600 text-white' 
                    : 'border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  activeTab === 'shop' && (!searchQuery) ? 'bg-orange-800 text-white' : 'bg-white text-zinc-700'
                }`}>
                  <Grid className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[11px] font-bold truncate ${
                    activeTab === 'shop' && (!searchQuery) ? 'text-white' : 'text-zinc-900'
                  }`}>All Products</div>
                  <div className={`text-[10px] truncate mt-0.5 ${
                    activeTab === 'shop' && (!searchQuery) ? 'text-orange-200' : 'text-zinc-500'
                  }`}>{products.length} items</div>
                </div>
              </button>

              {categories.map((cat) => {
                const catProducts = products.filter(p => p.categorySlug === cat.slug).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveTab('shop'); if (onSelectCategory) onSelectCategory(cat.slug); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 border border-zinc-200/50 hover:border-zinc-200/80 transition-all text-left group bg-white"
                  >
                    <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-orange-600 group-hover:text-white transition-colors text-zinc-700">
                      {getCategoryIcon(cat.slug)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-zinc-900 truncate">{cat.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">{catProducts} products</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
