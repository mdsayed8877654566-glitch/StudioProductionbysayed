import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Check, 
  X, 
  Star, 
  ShoppingBag, 
  CheckCircle, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Search,
  ChevronDown,
  Layers,
  ArrowRight,
  Info,
  DollarSign,
  FileCode,
  Award
} from 'lucide-react';
import { Product } from '../types';
import { storeService } from '../services/storeService';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';

interface ComparePageProps {
  initialProduct1Id?: string;
  initialProduct2Id?: string;
  onSelectProduct: (product: Product) => void;
  setActiveTab: (tab: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  initialProduct1Id,
  initialProduct2Id,
  onSelectProduct,
  setActiveTab
}) => {
  const { addToCart, cart } = useCart();
  const { settings } = useSettings();

  const allProducts = storeService.getProducts().filter(p => p.published);
  const categories = storeService.getCategories().filter(c => c.enabled);

  // Default to initial items or first two products in store
  const [product1Id, setProduct1Id] = useState<string>(
    initialProduct1Id || (allProducts[0]?.id ?? '')
  );
  const [product2Id, setProduct2Id] = useState<string>(
    initialProduct2Id || (allProducts[1]?.id || allProducts[0]?.id || '')
  );

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectingSlot, setSelectingSlot] = useState<1 | 2 | null>(null);

  useEffect(() => {
    if (initialProduct1Id) setProduct1Id(initialProduct1Id);
    if (initialProduct2Id) setProduct2Id(initialProduct2Id);
  }, [initialProduct1Id, initialProduct2Id]);

  const p1 = allProducts.find(p => p.id === product1Id) || allProducts[0];
  const p2 = allProducts.find(p => p.id === product2Id) || allProducts[1] || allProducts[0];

  const filteredProducts = allProducts.filter(p => {
    const matchesCategory = categoryFilter === 'all' || p.categorySlug === categoryFilter;
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSwap = () => {
    const temp = product1Id;
    setProduct1Id(product2Id);
    setProduct2Id(temp);
  };

  const handleSelectForSlot = (product: Product) => {
    if (selectingSlot === 1) {
      setProduct1Id(product.id);
    } else if (selectingSlot === 2) {
      setProduct2Id(product.id);
    }
    setSelectingSlot(null);
  };

  const inCart1 = p1 ? cart.some(item => item?.product?.id === p1.id) : false;
  const inCart2 = p2 ? cart.some(item => item?.product?.id === p2.id) : false;

  // Calculate verdict / key differences
  const getVerdict = () => {
    if (!p1 || !p2 || p1.id === p2.id) return null;

    const priceDiff = p1.price - p2.price;
    const cheaperProduct = priceDiff < 0 ? p1 : priceDiff > 0 ? p2 : null;
    const ratingDiff = p1.rating - p2.rating;
    const higherRated = ratingDiff > 0 ? p1 : ratingDiff < 0 ? p2 : null;

    return {
      cheaperProduct,
      priceAbsDiff: Math.abs(priceDiff),
      higherRated,
      ratingAbsDiff: Math.abs(ratingDiff).toFixed(1)
    };
  };

  const verdict = getVerdict();

  // Combine features from both products for side-by-side feature matrix
  const p1Features = p1?.features || [];
  const p2Features = p2?.features || [];
  const allUniqueFeatures = Array.from(new Set([...p1Features, ...p2Features]));

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-orange-600 text-white rounded-xl">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Product Comparison Tool</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Select two digital assets side-by-side to compare features, technical specifications, and prices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Popular Pair Shortcuts */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Quick Pairs:</span>
              {allProducts.length >= 2 && (
                <button
                  onClick={() => {
                    setProduct1Id(allProducts[0].id);
                    setProduct2Id(allProducts[1].id);
                  }}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Pair #1
                </button>
              )}
              {allProducts.length >= 4 && (
                <button
                  onClick={() => {
                    setProduct1Id(allProducts[2].id);
                    setProduct2Id(allProducts[3].id);
                  }}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Pair #2
                </button>
              )}
            </div>

            <button
              onClick={() => setActiveTab('shop')}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              Back to Catalog
            </button>
          </div>
        </div>

        {/* Product Picker Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          
          {/* Swap Button Positioned in Middle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
            <button
              onClick={handleSwap}
              className="p-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-full shadow-xl hover:scale-110 transition-all border-4 border-zinc-100"
              title="Swap Product Positions"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* Product 1 Selector Box */}
          <div className="p-5 bg-white rounded-3xl border-2 border-zinc-200/80 space-y-4 shadow-2xs relative">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px]">1</span>
                Product A
              </span>
              <button
                onClick={() => setSelectingSlot(selectingSlot === 1 ? null : 1)}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                Change Product
              </button>
            </div>

            {p1 && (
              <div className="flex items-center gap-4">
                <img
                  src={p1.thumbnail}
                  alt={p1.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border border-zinc-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {p1.categoryName}
                  </span>
                  <h3 className="text-sm font-extrabold text-zinc-900 truncate mt-1">{p1.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-zinc-900">
                      {p1.price === 0 ? 'Free' : `${settings.currencySymbol}${p1.price}`}
                    </span>
                    {p1.originalPrice > p1.price && (
                      <span className="text-xs text-zinc-400 line-through">
                        {settings.currencySymbol}{p1.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product 2 Selector Box */}
          <div className="p-5 bg-white rounded-3xl border-2 border-zinc-200/80 space-y-4 shadow-2xs relative">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px]">2</span>
                Product B
              </span>
              <button
                onClick={() => setSelectingSlot(selectingSlot === 2 ? null : 2)}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                Change Product
              </button>
            </div>

            {p2 && (
              <div className="flex items-center gap-4">
                <img
                  src={p2.thumbnail}
                  alt={p2.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border border-zinc-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {p2.categoryName}
                  </span>
                  <h3 className="text-sm font-extrabold text-zinc-900 truncate mt-1">{p2.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-zinc-900">
                      {p2.price === 0 ? 'Free' : `${settings.currencySymbol}${p2.price}`}
                    </span>
                    {p2.originalPrice > p2.price && (
                      <span className="text-xs text-zinc-400 line-through">
                        {settings.currencySymbol}{p2.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal / Selector Drawer when user clicks "Change Product" */}
        {selectingSlot !== null && (
          <div className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-extrabold text-zinc-900">
                Select Product for Position {selectingSlot === 1 ? 'A' : 'B'}
              </h3>
              <button
                onClick={() => setSelectingSlot(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog by name or category..."
                  className="w-full pl-9 pr-4 py-2 bg-zinc-100 rounded-xl text-xs border border-transparent focus:bg-white focus:border-zinc-300 focus:outline-none"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-100 border border-transparent rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Product selection grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredProducts.map(prod => (
                <button
                  key={prod.id}
                  onClick={() => handleSelectForSlot(prod)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    (selectingSlot === 1 && prod.id === product1Id) || (selectingSlot === 2 && prod.id === product2Id)
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                      : 'bg-zinc-50/80 hover:bg-zinc-50 border-zinc-200/80 text-zinc-900'
                  }`}
                >
                  <img src={prod.thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate">{prod.name}</h4>
                    <p className="text-[10px] opacity-70 truncate">{prod.categoryName} • {prod.price === 0 ? 'Free' : `${settings.currencySymbol}${prod.price}`}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Key Verdict Summary Card */}
        {verdict && (
          <div className="p-5 bg-zinc-950 text-white rounded-3xl shadow-lg border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Comparison Highlights
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
              {verdict.cheaperProduct && (
                <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Best Value</span>
                  <p className="font-bold text-white">
                    <span className="text-emerald-400">{verdict.cheaperProduct.name}</span> is lower priced by {settings.currencySymbol}{verdict.priceAbsDiff}.
                  </p>
                </div>
              )}

              {verdict.higherRated && (
                <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Higher Customer Rating</span>
                  <p className="font-bold text-white">
                    <span className="text-amber-400">{verdict.higherRated.name}</span> leads by +{verdict.ratingAbsDiff} stars ({verdict.higherRated.rating.toFixed(1)} vs {verdict.higherRated === p1 ? p2.rating.toFixed(1) : p1.rating.toFixed(1)}).
                  </p>
                </div>
              )}

              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Asset Formats</span>
                <p className="font-bold text-zinc-300">
                  {p1.fileFormat || 'Digital'} vs {p2.fileFormat || 'Digital'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* COMPARISON TABLE MATRIX */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              
              {/* Product Header Row */}
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/3 min-w-[200px]">
                    Attribute
                  </th>
                  <th className="p-5 w-1/3 min-w-[260px] border-l border-zinc-200">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img src={p1.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0" />
                        <div>
                          <h4 className="text-xs font-extrabold text-zinc-900 leading-tight line-clamp-2">{p1.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-medium">{p1.categoryName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60">
                        <span className="text-base font-black text-zinc-900">
                          {p1.price === 0 ? 'Free' : `${settings.currencySymbol}${p1.price}`}
                        </span>

                        {p1.price > 0 ? (
                          <button
                            onClick={() => addToCart(p1)}
                            disabled={inCart1 || p1.inStock === false}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                              inCart1 
                                ? 'bg-orange-50 text-orange-800 border border-orange-200' 
                                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                            }`}
                          >
                            {inCart1 ? <><CheckCircle className="w-3.5 h-3.5 text-orange-600" /> In Cart</> : <><ShoppingBag className="w-3.5 h-3.5" /> Add</>}
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectProduct(p1)}
                            className="px-3 py-1.5 text-xs font-bold bg-zinc-50 text-zinc-800 border border-zinc-200 rounded-xl"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </th>

                  <th className="p-5 w-1/3 min-w-[260px] border-l border-zinc-200">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img src={p2.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0" />
                        <div>
                          <h4 className="text-xs font-extrabold text-zinc-900 leading-tight line-clamp-2">{p2.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-medium">{p2.categoryName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60">
                        <span className="text-base font-black text-zinc-900">
                          {p2.price === 0 ? 'Free' : `${settings.currencySymbol}${p2.price}`}
                        </span>

                        {p2.price > 0 ? (
                          <button
                            onClick={() => addToCart(p2)}
                            disabled={inCart2 || p2.inStock === false}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                              inCart2 
                                ? 'bg-orange-50 text-orange-800 border border-orange-200' 
                                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                            }`}
                          >
                            {inCart2 ? <><CheckCircle className="w-3.5 h-3.5 text-orange-600" /> In Cart</> : <><ShoppingBag className="w-3.5 h-3.5" /> Add</>}
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectProduct(p2)}
                            className="px-3 py-1.5 text-xs font-bold bg-zinc-50 text-zinc-800 border border-zinc-200 rounded-xl"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
                
                {/* SECTION 1: PRICING & COMMERCIAL */}
                <tr className="bg-zinc-100/60">
                  <td colSpan={3} className="px-5 py-2.5 font-black text-zinc-600 uppercase tracking-widest text-[10px]">
                    1. Pricing & Commercial Specs
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Price</td>
                  <td className="p-4 border-l border-zinc-100 font-extrabold text-zinc-900">
                    {p1.price === 0 ? 'Free Download' : `${settings.currencySymbol}${p1.price}`}
                  </td>
                  <td className="p-4 border-l border-zinc-100 font-extrabold text-zinc-900">
                    {p2.price === 0 ? 'Free Download' : `${settings.currencySymbol}${p2.price}`}
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Original Price / List Price</td>
                  <td className="p-4 border-l border-zinc-100 text-zinc-700">
                    {p1.originalPrice > p1.price ? `${settings.currencySymbol}${p1.originalPrice}` : 'N/A'}
                  </td>
                  <td className="p-4 border-l border-zinc-100 text-zinc-700">
                    {p2.originalPrice > p2.price ? `${settings.currencySymbol}${p2.originalPrice}` : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Discount</td>
                  <td className="p-4 border-l border-zinc-100">
                    {p1.discountPercent > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                        {p1.discountPercent}% OFF
                      </span>
                    ) : (
                      <span className="text-orange-500">Regular</span>
                    )}
                  </td>
                  <td className="p-4 border-l border-zinc-100">
                    {p2.discountPercent > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                        {p2.discountPercent}% OFF
                      </span>
                    ) : (
                      <span className="text-orange-500">Regular</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">License Type</td>
                  <td className="p-4 border-l border-zinc-100 font-medium text-zinc-700">
                    {p1.license || 'Standard Commercial'}
                  </td>
                  <td className="p-4 border-l border-zinc-100 font-medium text-zinc-700">
                    {p2.license || 'Standard Commercial'}
                  </td>
                </tr>

                {/* SECTION 2: RATINGS & REVIEWS */}
                <tr className="bg-zinc-100/60">
                  <td colSpan={3} className="px-5 py-2.5 font-black text-zinc-600 uppercase tracking-widest text-[10px]">
                    2. User Rating & Popularity
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Star Rating</td>
                  <td className="p-4 border-l border-zinc-100">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-600">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>{p1.rating.toFixed(1)}</span>
                      <span className="text-zinc-400 font-normal">/ 5.0</span>
                    </div>
                  </td>
                  <td className="p-4 border-l border-zinc-100">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-600">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>{p2.rating.toFixed(1)}</span>
                      <span className="text-zinc-400 font-normal">/ 5.0</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Customer Reviews</td>
                  <td className="p-4 border-l border-zinc-100 font-semibold">{p1.reviewCount} verified reviews</td>
                  <td className="p-4 border-l border-zinc-100 font-semibold">{p2.reviewCount} verified reviews</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Total Downloads / Sales</td>
                  <td className="p-4 border-l border-zinc-100 font-semibold">{p1.salesCount} purchases</td>
                  <td className="p-4 border-l border-zinc-100 font-semibold">{p2.salesCount} purchases</td>
                </tr>

                {/* SECTION 3: TECHNICAL SPECIFICATIONS */}
                <tr className="bg-zinc-100/60">
                  <td colSpan={3} className="px-5 py-2.5 font-black text-zinc-600 uppercase tracking-widest text-[10px]">
                    3. Technical Specifications
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Product Category</td>
                  <td className="p-4 border-l border-zinc-100 font-medium">{p1.categoryName}</td>
                  <td className="p-4 border-l border-zinc-100 font-medium">{p2.categoryName}</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">File Format / Tech Stack</td>
                  <td className="p-4 border-l border-zinc-100 font-mono text-xs font-bold text-zinc-900 bg-zinc-50/50">
                    {p1.fileFormat || 'ZIP Package'}
                  </td>
                  <td className="p-4 border-l border-zinc-100 font-mono text-xs font-bold text-zinc-900 bg-zinc-50/50">
                    {p2.fileFormat || 'ZIP Package'}
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Download Size</td>
                  <td className="p-4 border-l border-zinc-100">{p1.fileSize || 'Standard Archive'}</td>
                  <td className="p-4 border-l border-zinc-100">{p2.fileSize || 'Standard Archive'}</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Version</td>
                  <td className="p-4 border-l border-zinc-100 font-semibold">{p1.version || 'v1.0.0'}</td>
                  <td className="p-4 border-l border-zinc-100 font-semibold">{p2.version || 'v1.0.0'}</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Last Updated</td>
                  <td className="p-4 border-l border-zinc-100 text-zinc-700">{p1.lastUpdated || '2026'}</td>
                  <td className="p-4 border-l border-zinc-100 text-zinc-700">{p2.lastUpdated || '2026'}</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Live Preview Demo</td>
                  <td className="p-4 border-l border-zinc-100">
                    {p1.demoUrl ? (
                      <a
                        href={p1.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1"
                      >
                        Launch Demo <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-400">Not Available</span>
                    )}
                  </td>
                  <td className="p-4 border-l border-zinc-100">
                    {p2.demoUrl ? (
                      <a
                        href={p2.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1"
                      >
                        Launch Demo <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-400">Not Available</span>
                    )}
                  </td>
                </tr>

                {/* SECTION 4: FEATURE MATRIX */}
                <tr className="bg-zinc-100/60">
                  <td colSpan={3} className="px-5 py-2.5 font-black text-zinc-600 uppercase tracking-widest text-[10px]">
                    4. Included Features & Capabilities
                  </td>
                </tr>

                {allUniqueFeatures.length > 0 ? (
                  allUniqueFeatures.map((feature, idx) => {
                    const has1 = p1Features.includes(feature);
                    const has2 = p2Features.includes(feature);

                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="p-4 font-medium text-zinc-800">{feature}</td>
                        <td className="p-4 border-l border-zinc-100">
                          {has1 ? (
                            <span className="inline-flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg font-bold text-xs">
                              <Check className="w-4 h-4 text-orange-600" /> Included
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-lg text-xs">
                              <X className="w-3.5 h-3.5" /> Not Included
                            </span>
                          )}
                        </td>
                        <td className="p-4 border-l border-zinc-100">
                          {has2 ? (
                            <span className="inline-flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg font-bold text-xs">
                              <Check className="w-4 h-4 text-orange-600" /> Included
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-lg text-xs">
                              <X className="w-3.5 h-3.5" /> Not Included
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr>
                      <td className="p-4 font-bold text-zinc-700">Full Source Code Access</td>
                      <td className="p-4 border-l border-zinc-100 text-orange-600 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Included
                      </td>
                      <td className="p-4 border-l border-zinc-100 text-orange-600 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Included
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-zinc-700">Documentation & Setup Guide</td>
                      <td className="p-4 border-l border-zinc-100 text-orange-600 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Included
                      </td>
                      <td className="p-4 border-l border-zinc-100 text-orange-600 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Included
                      </td>
                    </tr>
                  </>
                )}

                {/* SECTION 5: DESCRIPTION OVERVIEW */}
                <tr className="bg-zinc-100/60">
                  <td colSpan={3} className="px-5 py-2.5 font-black text-zinc-600 uppercase tracking-widest text-[10px]">
                    5. Summary Description
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-700">Overview</td>
                  <td className="p-4 border-l border-zinc-100 text-zinc-700 leading-relaxed">
                    {p1.shortDescription}
                  </td>
                  <td className="p-4 border-l border-zinc-100 text-zinc-700 leading-relaxed">
                    {p2.shortDescription}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
