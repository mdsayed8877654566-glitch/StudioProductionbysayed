import React, { useState } from 'react';
import { X, Trash2, Tag, ArrowRight, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';

interface CartDrawerProps {
  onNavigateToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToCheckout }) => {
  const { 
    cart, 
    removeFromCart, 
    clearCart, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon, 
    subtotal, 
    discountAmount, 
    total, 
    isCartOpen, 
    setIsCartOpen 
  } = useCart();
  const { settings } = useSettings();
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; error: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    setCouponMessage({ text: res.message, error: !res.success });
    if (res.success) setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white text-orange-900 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-orange-50 flex items-center justify-between bg-orange-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-600 text-white rounded-lg">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-orange-900">Your Shopping Cart</h2>
                <p className="text-xs text-orange-600">{cart.length} digital product{cart.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-orange-400 hover:text-orange-900 rounded-full hover:bg-orange-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-400">
                  <Download className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-orange-800">Your cart is empty</h3>
                <p className="text-xs text-orange-600 max-w-xs mx-auto">
                  Explore our digital collection of apps, websites, UI kits, and e-books to get started.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 transition-all shadow-sm"
                >
                  Explore Digital Collection
                </button>
              </div>
            ) : (
              cart.filter(item => item && item.product).map(({ product }) => (
                <div key={product.id} className="flex gap-4 p-3 bg-orange-50 border border-orange-50 rounded-2xl group hover:border-orange-300 transition-all">
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-cover rounded-xl bg-orange-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 bg-orange-200/80 text-orange-700 rounded-md">
                          {product.categoryName}
                        </span>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-orange-400 hover:text-red-500 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-xs font-semibold text-orange-900 mt-1 line-clamp-2">{product.name}</h4>
                      <p className="text-[11px] text-orange-600 mt-0.5">{product.fileFormat} • {product.version}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-orange-100/60">
                      <span className="text-xs text-orange-600">Instant Digital Access</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-orange-900">{settings.currencySymbol}{product.price}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-orange-400 line-through ml-1.5">{settings.currencySymbol}{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-orange-50 bg-orange-50/50 space-y-4">
              
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <label className="text-xs font-medium text-orange-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-600" /> Coupon or Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Try WELCOME20"
                    className="flex-1 px-3 py-2 text-xs border border-orange-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-900 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 transition-all shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-[11px] ${couponMessage.error ? 'text-red-500' : 'text-emerald-600 font-medium'}`}>
                    {couponMessage.text}
                  </p>
                )}
              </form>

              {appliedCoupon && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Coupon '{appliedCoupon.code}' Active</span>
                  </div>
                  <button onClick={removeCoupon} className="text-emerald-600 hover:text-emerald-900 underline text-[11px]">
                    Remove
                  </button>
                </div>
              )}

              {/* Subtotal & Totals */}
              <div className="space-y-2 text-xs text-orange-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-orange-900">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>-{settings.currencySymbol}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-orange-900 pt-2 border-t border-orange-100">
                  <span>Total Amount</span>
                  <span className="text-base text-orange-900">{settings.currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigateToCheckout();
                  }}
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="flex items-center justify-center gap-2 text-[11px] text-orange-600 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Instant download after purchase • Lifetime updates
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
