import React, { useState } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Star, Sparkles, CheckCircle, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { storeService } from '../services/storeService';
import { useSettings } from '../contexts/SettingsContext';

interface WishlistPageProps {
  onSelectProduct: (product: Product) => void;
  setActiveTab: (tab: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onSelectProduct,
  setActiveTab
}) => {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart, cart, setIsCartOpen } = useCart();
  const { settings } = useSettings();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const handleStoreChange = () => forceUpdate();
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  const allProducts = storeService.getProducts();
  const wishlistProducts = allProducts.filter(p => wishlistIds.includes(p.id));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddAllToCart = () => {
    if (wishlistProducts.length === 0) return;
    let addedCount = 0;
    wishlistProducts.forEach(product => {
      const exists = cart.some(item => item?.product?.id === product.id);
      if (!exists) {
        addToCart(product);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      showToast(`Added ${addedCount} item(s) to your cart!`);
    } else {
      setIsCartOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20 pt-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-orange-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Segment Banner */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100 inline-flex">
                <Heart className="w-5 h-5 fill-red-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Personal Favorites</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Saved Favorites & Wishlist
            </h1>
            <p className="text-sm text-zinc-500 max-w-xl">
              Keep track of digital products, themes, and UI kits you love. Access them anytime across your sessions.
            </p>
          </div>

          {wishlistProducts.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddAllToCart}
                className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Add All to Cart ({wishlistProducts.length})
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Items Segment Grid */}
        {wishlistProducts.length === 0 ? (
          /* Empty Favorites Segment */
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5 shadow-sm">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
              <Heart className="w-8 h-8 fill-red-100 text-red-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">Your Wishlist is Empty</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                You haven't saved any digital templates to your favorites list yet. Explore our digital marketplace and click the heart icon on any card to save it here!
              </p>
            </div>
            <button
              onClick={() => setActiveTab('shop')}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-600/20 transition-all inline-flex items-center gap-2"
            >
              Browse Shop Products <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
                Saved Items ({wishlistProducts.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistProducts.map((product) => {
                const inCart = cart.some(item => item?.product?.id === product.id);

                return (
                  <div 
                    key={product.id}
                    className="bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    {/* Thumbnail */}
                    <div 
                      className="relative aspect-[16/10] bg-zinc-100 overflow-hidden cursor-pointer"
                      onClick={() => onSelectProduct(product)}
                    >
                      <img 
                        src={product.thumbnail} 
                        alt={product.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                          showToast(`Removed "${product.name}" from favorites`);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-red-500 rounded-xl backdrop-blur-md shadow-sm transition-all"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="absolute bottom-3 left-3">
                        <span className="text-[10px] font-semibold text-zinc-800 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-200/50">
                          {product.categoryName}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="text-zinc-800">{product.rating.toFixed(1)}</span>
                          <span className="text-zinc-400 font-normal">({product.reviewCount})</span>
                        </div>
                        <h3 
                          onClick={() => onSelectProduct(product)}
                          className="text-sm font-bold text-zinc-900 hover:text-zinc-700 cursor-pointer line-clamp-1 transition-colors"
                        >
                          {product.name}
                        </h3>
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                          {product.shortDescription}
                        </p>
                      </div>

                      {/* Footer Price & Add to Cart */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-extrabold text-zinc-900">
                            {settings.currencySymbol}{product.price}
                          </div>
                          {product.originalPrice > product.price && (
                            <div className="text-[11px] text-zinc-400 line-through -mt-1">
                              {settings.currencySymbol}{product.originalPrice}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectProduct(product)}
                            className="p-2 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
                            title="View Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              addToCart(product);
                              showToast(`Added "${product.name}" to cart!`);
                            }}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                              inCart 
                                ? 'bg-orange-50 text-orange-800 border border-orange-200' 
                                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                            }`}
                          >
                            {inCart ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> In Cart
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" /> Add
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
