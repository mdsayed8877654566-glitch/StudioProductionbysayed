import React, { useState } from 'react';
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  Download, 
  Share2, 
  Copy, 
  CheckCircle,
  FileText,
  Clock,
  Layers,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  X,
  PenSquare,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';
import { Product, Review } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { storeService } from '../services/storeService';
import { ProductCard } from '../components/common/ProductCard';
import { CustomerReviews } from '../components/common/CustomerReviews';
import { ProductDetailsSkeleton } from '../components/common/ProductDetailsSkeleton';
import { getDirectDownloadUrl } from '../utils/themeUtils';

interface ProductDetailsPageProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onOpenLiveDemo: (product: Product) => void;
  onNavigateToCheckout: () => void;
  setActiveTab: (tab: string) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  onSelectProduct,
  onQuickView,
  onOpenLiveDemo,
  onNavigateToCheckout,
  setActiveTab
}) => {
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();

  // Ensure we are always displaying the absolute most up-to-date product state from the store
  const displayProduct = storeService.getProductById(product.id) || product;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'features' | 'reviews'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading] = useState(false);

  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const handleStoreChange = () => forceUpdate();
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  const isSaved = isInWishlist(displayProduct.id);
  const inCart = cart.some(item => item?.product?.id === displayProduct.id);

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(`Check out ${displayProduct.name}`);
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  const linkedinShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`;

  const reviews = storeService.getProductReviews(displayProduct.id);
  const relatedProducts = storeService.getProducts()
    .filter(p => p.published && p.id !== displayProduct.id && p.categorySlug === displayProduct.categorySlug)
    .slice(0, 4);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleBuyNow = () => {
    if (displayProduct.price === 0) {
      if (displayProduct.downloadFileUrl) {
        const directUrl = getDirectDownloadUrl(displayProduct.downloadFileUrl);
        window.open(directUrl, '_blank');
      } else {
        alert('Download link not available.');
      }
      return;
    }
    if (!inCart) {
      addToCart(displayProduct);
    }
    onNavigateToCheckout();
  };

  if (isLoading) return <ProductDetailsSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Top Product Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/10] bg-orange-100 rounded-3xl overflow-hidden border border-orange-100/80 shadow-md group">
            <img
              src={displayProduct.images && displayProduct.images.length > 0 ? displayProduct.images[activeImageIndex] : displayProduct.thumbnail}
              alt={displayProduct.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500"
            />

            {/* Carousel Navigation Overlays */}
            {displayProduct.images && displayProduct.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex(prev => prev === 0 ? displayProduct.images.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 hover:bg-white text-orange-900 rounded-full shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 border border-orange-100"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveImageIndex(prev => prev === displayProduct.images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 hover:bg-white text-orange-900 rounded-full shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 border border-orange-100"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              {displayProduct.isBestSeller && (
                <span className="bg-orange-600/90 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm backdrop-blur-md flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Best Seller
                </span>
              )}
              {displayProduct.discountPercent > 0 && (
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                  {displayProduct.discountPercent}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {displayProduct.images && displayProduct.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {displayProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-orange-600 scale-105 shadow-md' : 'border-orange-100 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${displayProduct.name} ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Demo button if available */}
          {displayProduct.demoUrl && (
            <button
              onClick={() => onOpenLiveDemo(displayProduct)}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              Launch Interactive Live Preview
            </button>
          )}
        </div>

        {/* Right Column: Pricing & Purchase Info */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-orange-600 mb-2">
              <span className="font-semibold uppercase tracking-wider text-orange-700 bg-orange-100 px-3 py-1 rounded-md">
                {displayProduct.categoryName}
              </span>
              <span className="text-orange-400 font-medium">Updated: {displayProduct.lastUpdated}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-orange-900 leading-snug">
              {displayProduct.name}
            </h1>

            {/* Rating & Sales */}
            <div className="flex items-center gap-3 mt-3 text-xs flex-wrap">
              <div className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{displayProduct.rating.toFixed(1)}</span>
                <span className="text-orange-400 font-normal">({reviews.length} reviews)</span>
              </div>
              <span className="text-orange-300">•</span>
              <span className="text-orange-700 font-medium">{displayProduct.salesCount} sales</span>
              <span className="text-orange-300">•</span>
              {displayProduct.stockQuantity !== undefined && displayProduct.stockQuantity !== 999 && (
                <>
                  <span className={`font-bold ${displayProduct.stockQuantity > 0 ? (displayProduct.stockQuantity <= 5 ? 'text-amber-600' : 'text-emerald-600') : 'text-red-600'}`}>
                    {displayProduct.stockQuantity > 0 ? `${displayProduct.stockQuantity} in stock` : 'Out of stock'}
                  </span>
                  <span className="text-orange-300">•</span>
                </>
              )}
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold rounded-lg transition-all shadow-2xs hover:scale-102"
              >
                <PenSquare className="w-3.5 h-3.5 text-amber-600" /> Write a Review
              </button>
            </div>
          </div>

          <p className="text-xs text-orange-700 leading-relaxed border-t border-b border-orange-50 py-3">
            {displayProduct.shortDescription}
          </p>

          {/* Pricing Display */}
          <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100/80 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-orange-900">
                  {displayProduct.price === 0 ? 'Free' : `${settings.currencySymbol}${displayProduct.price}`}
                </span>
                {displayProduct.originalPrice > displayProduct.price && (
                  <span className="text-sm text-orange-400 line-through ml-2">{settings.currencySymbol}{displayProduct.originalPrice}</span>
                )}
              </div>
              {displayProduct.discountPercent > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  Save {displayProduct.discountPercent}%
                </span>
              )}
            </div>

            <div className="space-y-2">
              {displayProduct.inStock === false ? (
                <div className="w-full py-3.5 bg-orange-100 text-red-600 border border-red-200 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Out of Stock
                </div>
              ) : (
                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {displayProduct.price === 0 ? 'Download Now (Free)' : 'Buy Now & Download'}
                </button>
              )}

              <div className="flex gap-2">
                {displayProduct.price > 0 && (
                  <button
                    onClick={() => addToCart(displayProduct)}
                    disabled={inCart || displayProduct.inStock === false || displayProduct.stockQuantity === 0}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all border ${
                      displayProduct.inStock === false || displayProduct.stockQuantity === 0
                        ? 'bg-orange-100 text-orange-400 border-orange-100 cursor-not-allowed'
                        : inCart 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-white hover:bg-orange-50 text-orange-900 border-orange-300'
                    }`}
                  >
                    {displayProduct.inStock === false || displayProduct.stockQuantity === 0 ? 'Out of Stock' : (inCart ? 'Item Added to Cart' : 'Add to Cart')}
                  </button>
                )}

                <button
                  onClick={() => toggleWishlist(displayProduct.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    isSaved ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-orange-300 text-orange-700 hover:bg-orange-50'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-600' : ''}`} />
                </button>

                <button
                  onClick={() => setActiveTab('compare')}
                  className="p-3 bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl transition-all"
                  title="Compare Side-by-Side"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleCopyShare}
                  className={`p-3 rounded-xl border transition-all ${
                    copiedLink ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-orange-300 text-orange-700 hover:bg-orange-50'
                  }`}
                  title="Copy Product Link"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className={`p-3 bg-white border border-orange-300 transition-all rounded-xl relative ${showShareMenu ? 'bg-orange-100 text-orange-900 ring-2 ring-orange-200' : 'text-orange-700 hover:bg-orange-50'}`}
                    title="Share Item"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {showShareMenu && (
                    <div className="absolute bottom-full right-0 mb-2 p-2 bg-white rounded-xl shadow-xl border border-orange-100/80 z-20 flex flex-col gap-1 w-48 animate-in fade-in slide-in-from-bottom-2">
                      <div className="px-3 py-1.5 border-b border-orange-50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Share Product</span>
                      </div>
                      <a href={twitterShareUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 hover:text-blue-500 rounded-lg transition-colors w-full text-left">
                        <Twitter className="w-4 h-4" /> Twitter
                      </a>
                      <a href={facebookShareUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 hover:text-blue-700 rounded-lg transition-colors w-full text-left">
                        <Facebook className="w-4 h-4" /> Facebook
                      </a>
                      <a href={linkedinShareUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 hover:text-blue-800 rounded-lg transition-colors w-full text-left">
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </a>
                      <div className="h-px bg-orange-100 my-1"></div>
                      <button onClick={handleCopyShare} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 rounded-lg transition-colors w-full text-left">
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        {copiedLink ? 'Copied to Clipboard' : 'Copy Link'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-orange-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Instant File Download • Commercial License • Safe Checkout
            </div>
          </div>

          {/* Specs Overview Box */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-orange-900 uppercase tracking-wider text-[11px]">Deliverable Specifications</h4>
            <div className="grid grid-cols-2 gap-2 bg-white p-4 rounded-2xl border border-orange-100/80">
              <div>
                <span className="text-orange-400 block text-[10px]">File Format</span>
                <span className="font-semibold text-orange-800">{displayProduct.fileFormat}</span>
              </div>
              <div>
                <span className="text-orange-400 block text-[10px]">File Size</span>
                <span className="font-semibold text-orange-800">{displayProduct.fileSize}</span>
              </div>
              <div>
                <span className="text-orange-400 block text-[10px]">Version</span>
                <span className="font-semibold text-orange-800">{displayProduct.version}</span>
              </div>
              <div>
                <span className="text-orange-400 block text-[10px]">License</span>
                <span className="font-semibold text-orange-800">{displayProduct.license}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Tabs Navigation & Detailed Content */}
      <div className="border-t border-orange-100 pt-8 space-y-8">
        <div className="flex border-b border-orange-100 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveDetailTab('overview')}
            className={`pb-3 transition-colors border-b-2 ${
              activeDetailTab === 'overview' ? 'border-orange-600 text-orange-900' : 'border-transparent text-orange-400 hover:text-orange-700'
            }`}
          >
            Product Overview & Description
          </button>
          <button
            onClick={() => setActiveDetailTab('features')}
            className={`pb-3 transition-colors border-b-2 ${
              activeDetailTab === 'features' ? 'border-orange-600 text-orange-900' : 'border-transparent text-orange-400 hover:text-orange-700'
            }`}
          >
            Features & What's Included
          </button>
          <button
            onClick={() => setActiveDetailTab('reviews')}
            className={`pb-3 transition-colors border-b-2 ${
              activeDetailTab === 'reviews' ? 'border-orange-600 text-orange-900' : 'border-transparent text-orange-400 hover:text-orange-700'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Overview Tab Content */}
        {activeDetailTab === 'overview' && (
          <div className="space-y-6 max-w-4xl text-xs sm:text-sm text-orange-700 leading-relaxed">
            <p className="whitespace-pre-line">{displayProduct.description}</p>

            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100/80 space-y-3">
                <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider">Compatibility & Frameworks</h4>
                <div className="flex flex-wrap gap-1.5">
                  {displayProduct.compatibility.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-orange-100 rounded-lg text-xs font-semibold text-orange-800">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100/80 space-y-3">
                <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider">System Requirements</h4>
                <ul className="space-y-1 text-xs text-orange-700">
                  {displayProduct.requirements.map((req, i) => (
                    <li key={i}>• {req}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab Content */}
        {activeDetailTab === 'features' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-orange-900">Key Features:</h3>
              <ul className="space-y-2 text-xs text-orange-700">
                {displayProduct.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 bg-orange-50 rounded-xl border border-orange-100/60">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-orange-900">What's Included in Download:</h3>
              <ul className="space-y-2 text-xs text-orange-700">
                {displayProduct.whatsIncluded.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 bg-orange-50 rounded-xl border border-orange-100/60">
                    <Download className="w-4 h-4 text-orange-900 shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Customer Reviews Tab Content */}
        {activeDetailTab === 'reviews' && (
          <CustomerReviews 
            product={displayProduct}
            isReviewModalOpen={isReviewModalOpen}
            setIsReviewModalOpen={setIsReviewModalOpen}
            onBuyNow={handleBuyNow}
            setActiveTab={setActiveTab}
          />
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-orange-100 pt-12 space-y-6">
          <h2 className="text-xl font-bold text-orange-900">More Digital Assets in {displayProduct.categoryName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onQuickView={onQuickView}
                onCompare={() => setActiveTab('compare')}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
