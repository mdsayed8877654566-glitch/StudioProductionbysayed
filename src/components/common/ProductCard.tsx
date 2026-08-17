import React, { useState } from 'react';
import { Star, Eye, Heart, ShoppingBag, ArrowUpRight, Sparkles, CheckCircle, ArrowLeftRight } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useSettings } from '../../contexts/SettingsContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onCompare?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickView,
  onCompare
}) => {
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();

  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const isSaved = isInWishlist(product.id);
  const inCart = cart.some(item => item?.product?.id === product.id);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="group bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      
      {/* Image Thumbnail Container */}
      <div 
        className="relative aspect-[16/10] bg-zinc-100 overflow-hidden cursor-pointer" 
        onClick={() => onSelect(product)}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => {
          setIsZoomed(false);
          setMousePos({ x: 50, y: 50 });
        }}
        onMouseMove={handleMouseMove}
      >
        <img
          src={product.thumbnail}
          alt={product.name}
          referrerPolicy="no-referrer"
          style={{
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
          }}
          className={`w-full h-full object-cover transition-transform duration-300 ease-out ${
            isZoomed ? 'scale-[2.0]' : 'scale-100'
          }`}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {product.isBestSeller && (
            <span className="bg-orange-600/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Best Seller
            </span>
          )}
          {product.isNew && (
            <span className="bg-zinc-950/90 text-orange-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md border border-zinc-800">
              New
            </span>
          )}
          {product.discountPercent > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {product.discountPercent}% OFF
            </span>
          )}
          {product.inStock === false || product.stockQuantity === 0 ? (
            <span className="bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md">
              Out of Stock
            </span>
          ) : product.stockQuantity !== undefined && product.stockQuantity <= 5 && product.stockQuantity > 0 ? (
            <span className="bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md">
              Only {product.stockQuantity} left!
            </span>
          ) : null}
        </div>

        {/* Floating Quick Action Overlay Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`p-2 rounded-xl backdrop-blur-md shadow-md transition-all ${
              isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-zinc-700 hover:bg-white hover:text-red-500'
            }`}
            title={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-2 bg-white/90 text-zinc-700 hover:bg-white hover:text-zinc-900 rounded-xl backdrop-blur-md shadow-md transition-all"
            title="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>

          {onCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompare(product);
              }}
              className="p-2 bg-white/90 text-zinc-700 hover:bg-white hover:text-zinc-900 rounded-xl backdrop-blur-md shadow-md transition-all"
              title="Compare Side-by-Side"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tag pill */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-[10px] font-semibold text-zinc-800 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-200/50">
            {product.categoryName}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          {/* Rating & Sales count */}
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
            <div className="flex items-center gap-1 font-semibold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-zinc-800">{product.rating.toFixed(1)}</span>
              <span className="text-zinc-400 font-normal">({product.reviewCount})</span>
            </div>
            <span className="text-[11px] font-medium text-zinc-400">
              {product.salesCount} sales
            </span>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onSelect(product)}
            className="text-sm font-bold text-zinc-900 hover:text-orange-600 cursor-pointer line-clamp-2 transition-colors leading-snug"
          >
            {product.name}
          </h3>

          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & Cart Action */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-extrabold text-zinc-900">
              {product.price === 0 ? 'Free' : `${settings.currencySymbol}${product.price}`}
            </div>
            {product.originalPrice > product.price && (
              <div className="text-[11px] text-zinc-400 line-through -mt-1">
                {settings.currencySymbol}{product.originalPrice}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelect(product)}
              className="p-2 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
              title="View Details"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
            {product.price > 0 ? (
              <button
                onClick={() => addToCart(product)}
                disabled={inCart || product.inStock === false || product.stockQuantity === 0}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  product.inStock === false || product.stockQuantity === 0
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                    : inCart 
                      ? 'bg-orange-50 text-orange-800 border border-orange-200' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20'
                }`}
              >
                {product.inStock === false || product.stockQuantity === 0 ? (
                  'Out of Stock'
                ) : inCart ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-orange-600" /> In Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" /> Add
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (product.downloadFileUrl) {
                    window.open(product.downloadFileUrl, '_blank');
                  } else {
                    alert('Download link not available.');
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                Download
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
