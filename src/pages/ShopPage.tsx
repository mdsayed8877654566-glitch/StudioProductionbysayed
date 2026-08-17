import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  Grid, 
  Star, 
  Tag, 
  Sparkles, 
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { Product, ProductType, CategorySlug } from '../types';
import { ProductCard } from '../components/common/ProductCard';
import { ProductCardSkeleton } from '../components/common/ProductCardSkeleton';
import { storeService } from '../services/storeService';
import { useSettings } from '../contexts/SettingsContext';

interface ShopPageProps {
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onCompare?: (product: Product) => void;
  initialCategorySlug?: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  onSelectProduct,
  onQuickView,
  onCompare,
  initialCategorySlug = 'all',
  searchQuery,
  setSearchQuery
}) => {
  const { settings } = useSettings();
  const allProducts = storeService.getProducts().filter(p => p.published);
  const categories = storeService.getCategories().filter(c => c.enabled);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug);
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [priceRange, setPriceRange] = useState<number>(100);
  const [onlyDiscounted, setOnlyDiscounted] = useState<boolean>(false);
  const [onlyBestSellers, setOnlyBestSellers] = useState<boolean>(false);
  const [onlyNew, setOnlyNew] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [quickFilter, setQuickFilter] = useState<string>('All');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [isLoading] = useState<boolean>(false);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const handleStoreChange = () => forceUpdate();
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  // Sync if initialCategorySlug changes
  React.useEffect(() => {
    setSelectedCategory(initialCategorySlug);
  }, [initialCategorySlug]);

  const toggleTypeFilter = (type: ProductType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedTypes([]);
    setPriceRange(100);
    setOnlyDiscounted(false);
    setOnlyBestSellers(false);
    setOnlyNew(false);
    setMinRating(0);
    setSearchQuery('');
    setQuickFilter('All');
  };

  // Filtered and Sorted Products computation
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      // Category filter
      if (selectedCategory === 'deals') {
        if (product.discountPercent === 0) return false;
      } else if (selectedCategory !== 'all') {
        const matchesCategory = product.categorySlug === selectedCategory || 
          (selectedCategory === 'websites' && (product.productType === 'Website' || product.productType === 'App'));
        if (!matchesCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.shortDescription.toLowerCase().includes(q);
        const matchesCat = product.categoryName.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // Product Type
      if (selectedTypes.length > 0 && !selectedTypes.includes(product.productType)) {
        return false;
      }

      // Price limit
      if (product.price > priceRange) return false;

      // Badges
      if (onlyDiscounted && product.discountPercent === 0) return false;
      if (onlyBestSellers && !product.isBestSeller) return false;
      if (onlyNew && !product.isNew) return false;

      // Rating
      if (minRating > 0 && product.rating < minRating) return false;

      // Quick Filters
      if (quickFilter === 'Free' && product.price > 0) return false;
      if (quickFilter === 'Latest' && !product.isNew) return false;
      if (quickFilter === 'Popular' && !product.isBestSeller) return false;
      if (quickFilter === 'Trending' && product.rating < 4.0) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'best-selling': return b.salesCount - a.salesCount;
        case 'newest': return b.isNew ? 1 : -1;
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating-desc': return b.rating - a.rating;
        default: return b.salesCount - a.salesCount;
      }
    });
  }, [allProducts, selectedCategory, searchQuery, selectedTypes, priceRange, onlyDiscounted, onlyBestSellers, onlyNew, minRating, sortBy, quickFilter]);

  const productTypesList: ProductType[] = [
    'App', 'Website', 'Template', 'UI Kit', 'Graphics', 'Logo', 
    'Presentation', 'PDF', 'E-Book', 'Video', 'Audio', 'Font', 
    'Icons', 'Plugin', 'Source Code', 'AI Tool'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-orange-100 pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-orange-900 tracking-tight">
            Digital Collection Catalog
          </h1>
          <p className="text-xs text-orange-600 mt-1">
            Showing {filteredProducts.length} premium digital asset{filteredProducts.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-orange-600 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-orange-100 text-xs font-bold text-orange-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-900 shadow-sm"
            >
              <option value="popular">Most Popular</option>
              <option value="best-selling">Best Sellers</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 pb-2">
        {['All', 'Latest', 'Popular', 'Trending', 'Free'].map((filter) => (
          <button
            key={filter}
            onClick={() => setQuickFilter(filter)}
            className={`shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 border hover:scale-105 hover:shadow-md active:scale-95 ${
              quickFilter === filter
                ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                : 'bg-white text-orange-700 border-orange-100 hover:bg-orange-50 hover:border-orange-200 shadow-sm'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* FILTER SIDEBAR (Desktop) */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white border border-orange-100 rounded-2xl p-5 space-y-6 shadow-sm sticky top-24">
            
            <div className="flex items-center justify-between pb-3 border-b border-orange-50">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                <Filter className="w-4 h-4" /> Filter Options
              </span>
              <button
                onClick={resetFilters}
                className="text-[11px] font-semibold text-orange-600 hover:text-orange-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider">Categories</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${
                    selectedCategory === 'all' ? 'bg-orange-600 text-white' : 'text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] opacity-80">{allProducts.length}</span>
                </button>

                {categories.map((cat) => {
                  const catCount = allProducts.filter(p => p.categorySlug === cat.slug || (cat.slug === 'websites' && (p.productType === 'Website' || p.productType === 'App'))).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${
                        selectedCategory === cat.slug ? 'bg-orange-600 text-white' : 'text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] opacity-80">{catCount}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2 pt-2 border-t border-orange-50">
              <div className="flex justify-between text-xs font-bold text-orange-800">
                <span>Max Price</span>
                <span>{settings.currencySymbol}{priceRange}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-orange-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-orange-400 font-mono">
                <span>{settings.currencySymbol}10</span>
                <span>{settings.currencySymbol}100+</span>
              </div>
            </div>

            {/* Product Badges */}
            <div className="space-y-2 pt-2 border-t border-orange-50 text-xs font-medium text-orange-700">
              <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider">Product Tags</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyDiscounted}
                  onChange={(e) => setOnlyDiscounted(e.target.checked)}
                  className="rounded text-orange-900 focus:ring-orange-900 accent-orange-900"
                />
                <span>On Sale / Discounted</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyBestSellers}
                  onChange={(e) => setOnlyBestSellers(e.target.checked)}
                  className="rounded text-orange-900 focus:ring-orange-900 accent-orange-900"
                />
                <span>Best Sellers Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyNew}
                  onChange={(e) => setOnlyNew(e.target.checked)}
                  className="rounded text-orange-900 focus:ring-orange-900 accent-orange-900"
                />
                <span>New Releases</span>
              </label>
            </div>

            {/* Product Types */}
            <div className="space-y-2 pt-2 border-t border-orange-50">
              <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider">Product Type</h4>
              <div className="flex flex-wrap gap-1.5">
                {productTypesList.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      selectedTypes.includes(type)
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* PRODUCTS GRID */}
        <main className="lg:col-span-3 space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-orange-100 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-orange-900">No digital products found</h3>
              <p className="text-xs text-orange-600 max-w-sm mx-auto">
                Try adjusting your search criteria, price range, or category filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                [...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)
              ) : (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={onSelectProduct}
                    onQuickView={onQuickView}
                    onCompare={onCompare}
                  />
                ))
              )}
            </div>
          )}
        </main>

      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-orange-100">
              <h3 className="text-sm font-bold text-orange-900">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-orange-400 hover:text-orange-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => { resetFilters(); setMobileFilterOpen(false); }}
              className="w-full py-2 bg-orange-100 text-orange-800 text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
