import React, { useState } from 'react';
import { X, Monitor, Tablet, Smartphone, ExternalLink, ShoppingBag, ShieldCheck, RefreshCw } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';

interface LiveDemoModalProps {
  product: Product | null;
  onClose: () => void;
}

export const LiveDemoModal: React.FC<LiveDemoModalProps> = ({ product, onClose }) => {
  const { addToCart, cart } = useCart();
  const { settings } = useSettings();
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!product) return null;

  const inCart = cart.some(item => item?.product?.id === product.id);

  const getContainerWidth = () => {
    switch (deviceMode) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      default: return 'w-full';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/80 backdrop-blur-md flex flex-col animate-in fade-in">
      
      {/* Top Demo Bar Controls */}
      <div className="bg-orange-600 border-b border-orange-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-xs font-bold tracking-wide truncate max-w-xs">{product.name}</h3>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-orange-400 bg-orange-800 px-2.5 py-0.5 rounded-full">
            {product.productType} Live Simulator
          </span>
        </div>

        {/* Viewport Device Selectors */}
        <div className="hidden md:flex items-center bg-zinc-950 p-1 rounded-xl border border-orange-800 text-xs">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              deviceMode === 'desktop' ? 'bg-orange-800 text-white shadow-sm' : 'text-orange-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              deviceMode === 'tablet' ? 'bg-orange-800 text-white shadow-sm' : 'text-orange-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" /> Tablet
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              deviceMode === 'mobile' ? 'bg-orange-800 text-white shadow-sm' : 'text-orange-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
        </div>

        {/* Buy CTA & Close */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-orange-400">Price: </span>
            <span className="text-sm font-bold text-white">{settings.currencySymbol}{product.price}</span>
          </div>

          <button
            onClick={() => {
              addToCart(product);
            }}
            disabled={inCart}
            className="px-4 py-2 bg-white text-zinc-950 hover:bg-orange-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {inCart ? 'In Cart' : 'Buy & Download'}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-orange-400 hover:text-white hover:bg-orange-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Frame Preview Canvas */}
      <div className="flex-1 bg-zinc-950 p-4 md:p-8 flex items-center justify-center overflow-hidden relative">
        <div className={`h-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-orange-800 transition-all duration-300 flex flex-col ${getContainerWidth()}`}>
          
          {/* Simulated Browser Bar */}
          <div className="bg-orange-100 border-b border-orange-100 px-4 py-2 flex items-center justify-between text-xs text-orange-600 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="bg-white px-4 py-1 rounded-md text-[11px] font-mono text-orange-700 border border-orange-100/80 max-w-xs truncate flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              https://demo.studiocollection.com/{product.slug}
            </div>
            <button className="text-orange-400 hover:text-orange-700">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Frame Body */}
          <div className="flex-1 overflow-y-auto bg-orange-50 relative p-6">
            <div className="max-w-4xl mx-auto space-y-8 text-orange-900">
              
              {/* Demo Hero Banner */}
              <div className="relative rounded-2xl overflow-hidden shadow-md">
                <img
                  src={product.images[0] || product.thumbnail}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-[360px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent p-6 flex flex-col justify-end text-white">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md w-fit">
                    {product.categoryName} Preview
                  </span>
                  <h1 className="text-2xl font-black mt-2 leading-tight">{product.name}</h1>
                  <p className="text-xs text-orange-300 mt-1 max-w-xl line-clamp-2">{product.shortDescription}</p>
                </div>
              </div>

              {/* Demo Technical Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-orange-100 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider">Tech Stack & Tools</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {product.compatibility.map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-orange-100 text-orange-800 text-[11px] font-medium rounded-md">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-orange-100 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider">Included Deliverables</h4>
                  <ul className="text-xs text-orange-700 space-y-1">
                    {product.whatsIncluded.map((inc, i) => (
                      <li key={i}>✓ {inc}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Additional Screenshot Previews */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-orange-900">Screenshots & Design Previews</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-48 object-cover rounded-xl border border-orange-100 shadow-sm"
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
