import React, { useState } from 'react';
import { Trash2, ArrowRight, Download, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';

interface CartPageProps {
  onNavigateToCheckout: () => void;
  setActiveTab: (tab: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigateToCheckout, setActiveTab }) => {
  const { cart, removeFromCart, subtotal, discountAmount, taxAmount, total, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const { settings } = useSettings();
  const [couponCode, setCouponCode] = useState('');
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = applyCoupon(couponCode);
    setMsg({ text: res.message, error: !res.success });
    if (res.success) setCouponCode('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-orange-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-orange-900">Your Shopping Cart</h1>
        <p className="text-xs text-orange-600 mt-1">{cart.length} digital item{cart.length === 1 ? '' : 's'} in cart</p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-orange-100 rounded-3xl p-16 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-400">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-orange-900">Your cart is empty</h3>
          <p className="text-xs text-orange-600 max-w-sm mx-auto">Browse our collection of apps, websites, UI kits, and e-books to get started.</p>
          <button
            onClick={() => setActiveTab('shop')}
            className="px-6 py-3 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-all"
          >
            Explore Digital Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.filter(item => item && item.product).map(({ product }) => (
              <div key={product.id} className="p-4 bg-white border border-orange-100 rounded-2xl flex gap-4 items-center">
                <img src={product.thumbnail} alt="" className="w-20 h-20 object-cover rounded-xl bg-orange-100" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">{product.categoryName}</span>
                  <h3 className="text-sm font-bold text-orange-900 truncate">{product.name}</h3>
                  <p className="text-xs text-orange-400 mt-0.5">{product.fileFormat} • {product.version}</p>
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <span className="text-base font-black text-orange-900">{settings.currencySymbol}{product.price}</span>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="block text-xs text-red-500 hover:underline ml-auto"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 bg-orange-50 border border-orange-100 p-6 rounded-2xl space-y-6">
            <h3 className="text-sm font-bold text-orange-900 border-b border-orange-100 pb-3">Order Summary</h3>

            {/* Coupon */}
            <form onSubmit={handleApply} className="space-y-2">
              <label className="text-xs font-medium text-orange-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. WELCOME20"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-orange-100 rounded-xl"
                />
                <button type="submit" className="px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl">Apply</button>
              </div>
              {msg && <p className={`text-[11px] ${msg.error ? 'text-red-500' : 'text-emerald-600'}`}>{msg.text}</p>}
            </form>

            {appliedCoupon && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <span>Coupon '{appliedCoupon.code}' Applied</span>
                <button onClick={removeCoupon} className="text-emerald-700 underline text-[11px]">Remove</button>
              </div>
            )}

            <div className="space-y-2 text-xs text-orange-700 pt-2 border-t border-orange-100">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{settings.currencySymbol}{subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-emerald-600 font-semibold"><span>Discount</span><span>-{settings.currencySymbol}{discountAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-sm font-black text-orange-900 pt-2 border-t border-orange-100">
                <span>Total</span>
                <span>{settings.currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onNavigateToCheckout}
              className="w-full py-3.5 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
