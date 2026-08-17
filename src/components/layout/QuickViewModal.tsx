import React from 'react';
import { X, Star, ShoppingBag, ExternalLink, Check, Download, ShieldCheck, Heart } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getDirectDownloadUrl } from '../../utils/themeUtils';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenLiveDemo: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onSelectProduct,
  onOpenLiveDemo
}) => {
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();

  if (!product) return null;

  const isSaved = isInWishlist(product.id);
  const inCart = cart.some(item => item?.product?.id === product.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-zinc-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-zinc-200 relative animate-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-zinc-700 rounded-full shadow-md backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Image & Preview Column */}
          <div className="bg-zinc-100 p-6 flex flex-col justify-between">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-inner bg-zinc-200">
              <img
                src={product.thumbnail}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Quick Demo button if available */}
            {product.demoUrl && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLiveDemo(product);
                }}
                className="mt-4 w-full py-2.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4 text-orange-600" />
                Launch Live Interactive Demo
              </button>
            )}
          </div>

          {/* Details Column */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span className="font-semibold uppercase tracking-wider text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-md">
                  {product.categoryName}
                </span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-zinc-400 font-normal">({product.reviewCount} reviews)</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-zinc-900 leading-snug">{product.name}</h2>
              <p className="text-xs text-zinc-600 mt-2 leading-relaxed">{product.shortDescription}</p>

              {/* Product Metadata List */}
              <div className="mt-4 space-y-2 text-xs border-t border-b border-zinc-100 py-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">File Format</span>
                  <span className="font-semibold text-zinc-800">{product.fileFormat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">File Size</span>
                  <span className="font-semibold text-zinc-800">{product.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current Version</span>
                  <span className="font-semibold text-zinc-800">{product.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">License</span>
                  <span className="font-semibold text-zinc-800">{product.license}</span>
                </div>
              </div>

              {/* Highlights */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-zinc-900 mb-2">Included Features:</h4>
                <ul className="space-y-1 text-xs text-zinc-600">
                  {product.features.slice(0, 3).map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-900">{settings.currencySymbol}{product.price}</span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-zinc-400 line-through">{settings.currencySymbol}{product.originalPrice}</span>
                )}
                {product.discountPercent > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Save {product.discountPercent}%
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {product.price > 0 ? (
                  <button
                    onClick={() => {
                      addToCart(product);
                      onClose();
                    }}
                    disabled={inCart}
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {inCart ? 'Item in Cart' : 'Add to Cart'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (product.downloadFileUrl) {
                        const directUrl = getDirectDownloadUrl(product.downloadFileUrl);
                        window.open(directUrl, '_blank');
                      } else {
                        alert('Download link not available.');
                      }
                    }}
                    className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Download Now (Free)
                  </button>
                )}

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    isSaved ? 'bg-red-50 border-red-200 text-red-600' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-600' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onSelectProduct(product);
                  }}
                  className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs rounded-xl transition-all"
                >
                  Full Details
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Instant File Download • Guaranteed Safe Checkout
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
