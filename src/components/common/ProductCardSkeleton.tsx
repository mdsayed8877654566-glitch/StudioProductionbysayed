import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="group bg-white rounded-2xl border border-orange-100/80 flex flex-col overflow-hidden relative animate-pulse">
      {/* Image Thumbnail Container Skeleton */}
      <div className="relative aspect-[16/10] bg-orange-200 w-full"></div>

      {/* Content Skeleton */}
      <div className="p-5 flex flex-col flex-1">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-1/3 h-3 bg-orange-200 rounded-full"></div>
          <div className="w-1/4 h-3 bg-orange-200 rounded-full"></div>
        </div>
        
        {/* Title */}
        <div className="w-3/4 h-5 bg-orange-200 rounded-full mb-2"></div>
        
        {/* Tags */}
        <div className="flex gap-2 mb-4 mt-2">
          <div className="w-16 h-5 bg-orange-200 rounded-md"></div>
          <div className="w-12 h-5 bg-orange-200 rounded-md"></div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-orange-50 flex items-center justify-between">
          <div className="w-1/4 h-6 bg-orange-200 rounded-full"></div>
          <div className="w-8 h-8 bg-orange-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
