import React, { createContext, useContext, useState, useEffect } from 'react';
import { storeService } from '../services/storeService';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const effectiveUserId = user?.id || 'guest';
  
  useEffect(() => {
    setWishlistIds(storeService.getWishlist(effectiveUserId));
  }, [effectiveUserId]);

  const toggleWishlist = (productId: string) => {
    const updated = storeService.toggleWishlist(productId, effectiveUserId);
    setWishlistIds(updated);
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
