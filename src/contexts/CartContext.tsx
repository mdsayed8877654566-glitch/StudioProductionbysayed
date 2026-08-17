import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { storeService } from '../services/storeService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, licenseType?: 'standard' | 'extended') => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const effectiveUserId = user?.id || 'guest';
  const activeUserIdRef = useRef<string>(effectiveUserId);

  const [cart, setCart] = useState<CartItem[]>(() => storeService.getCart(effectiveUserId));
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart state when effective user changes
  useEffect(() => {
    activeUserIdRef.current = effectiveUserId;
    setCart(storeService.getCart(effectiveUserId));
  }, [effectiveUserId]);

  // Persist cart whenever cart state updates for the active user
  useEffect(() => {
    storeService.saveCart(cart, activeUserIdRef.current);
  }, [cart]);

  // Listen to global store changes to refresh product data in the cart (e.g., if admin changes price/stock)
  useEffect(() => {
    const handleStoreChange = () => {
      setCart(prevCart => {
        let hasChanges = false;
        const newCart = prevCart.map(item => {
          if (!item || !item.product) return item;
          const freshProduct = storeService.getProductById(item.product.id);
          if (freshProduct && JSON.stringify(freshProduct) !== JSON.stringify(item.product)) {
            hasChanges = true;
            return { ...item, product: freshProduct };
          }
          return item;
        });
        return hasChanges ? newCart : prevCart;
      });
    };
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  const addToCart = (product: Product, licenseType: 'standard' | 'extended' = 'standard') => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item?.product?.id === product.id);
      if (existingIndex >= 0) {
        return prev; // Digital products are unique items
      }
      return [...prev, { product, quantity: 1, licenseType }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item?.product?.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item?.product?.price || 0), 0);

  const applyCoupon = (code: string) => {
    const res = storeService.verifyCoupon(code, subtotal);
    if (res.valid && res.coupon) {
      setAppliedCoupon(res.coupon);
      return { success: true, message: `Coupon ${res.coupon.code} applied successfully!` };
    }
    return { success: false, message: res.error || 'Failed to apply coupon.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const settings = storeService.getSettings();
  const taxAmount = ((subtotal - discountAmount) * (settings.taxPercentage || 0)) / 100;
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
