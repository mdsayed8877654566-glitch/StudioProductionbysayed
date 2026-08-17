import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const ProductDetailsSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col animate-pulse">
      {/* Navbar Placeholder */}
      <div className="h-16 border-b border-orange-100 bg-white"></div>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back button */}
        <div className="mb-6 flex items-center">
          <div className="w-24 h-6 bg-orange-200 rounded-md"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Left Column - Image Gallery Skeleton */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="aspect-[4/3] bg-orange-200 rounded-2xl w-full"></div>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-orange-200 rounded-xl"></div>
              <div className="w-20 h-20 bg-orange-200 rounded-xl"></div>
              <div className="w-20 h-20 bg-orange-200 rounded-xl"></div>
            </div>
          </div>

          {/* Right Column - Product Info Skeleton */}
          <div className="w-full lg:w-1/2 flex flex-col pt-2 lg:pt-8">
            
            {/* Title & Badge */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-3/4 h-10 bg-orange-200 rounded-lg"></div>
              <div className="w-10 h-10 bg-orange-200 rounded-full"></div>
            </div>

            {/* Rating */}
            <div className="w-1/3 h-5 bg-orange-200 rounded-md mb-6"></div>

            {/* Price */}
            <div className="w-1/4 h-8 bg-orange-200 rounded-md mb-6"></div>
            
            <div className="w-full h-px bg-orange-200 my-6"></div>

            {/* Description */}
            <div className="w-full h-4 bg-orange-200 rounded-md mb-2"></div>
            <div className="w-5/6 h-4 bg-orange-200 rounded-md mb-2"></div>
            <div className="w-4/6 h-4 bg-orange-200 rounded-md mb-8"></div>

            {/* Included Files */}
            <div className="w-1/4 h-6 bg-orange-200 rounded-md mb-4"></div>
            <div className="flex gap-2 mb-8">
              <div className="w-20 h-8 bg-orange-200 rounded-lg"></div>
              <div className="w-20 h-8 bg-orange-200 rounded-lg"></div>
              <div className="w-20 h-8 bg-orange-200 rounded-lg"></div>
            </div>

            <div className="w-full h-px bg-orange-200 my-6"></div>

            {/* Add to Cart button */}
            <div className="w-full h-14 bg-orange-200 rounded-xl mb-4"></div>
            
            {/* Guarantee */}
            <div className="w-1/2 h-4 bg-orange-200 rounded-md mx-auto mt-4"></div>
          </div>
        </div>
      </main>
    </div>
  );
};
