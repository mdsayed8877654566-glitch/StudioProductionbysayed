import React, { useState, useEffect } from 'react';
import { Send, ShieldCheck, Download, Award, Sparkles, Heart, Loader2, X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { subscribeNewsletterInSupabase } from '../../lib/supabase';
import { storeService } from '../../services/storeService';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onSelectCategory?: (slug: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onSelectCategory }) => {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  useEffect(() => {
    const handleStoreChange = () => forceUpdate();
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  const categories = storeService.getCategories().filter(c => c.enabled);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribing(true);
      setSubscribeError(null);
      const res = await subscribeNewsletterInSupabase(email);
      setIsSubscribing(false);

      if (res.success) {
        setSubscribed(true);
        setEmail('');
      } else {
        setSubscribeError(res.error || 'Failed to subscribe. Please try again.');
      }
    }
  };

  return (
    <footer className="bg-zinc-950 text-zinc-400 pt-16 pb-12 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Proposition Highlights Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-zinc-800 text-xs">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="p-2 bg-zinc-800 text-orange-400 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">Instant Access</h4>
              <p className="text-zinc-400 mt-0.5">Download your digital files immediately after payment.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="p-2 bg-zinc-800 text-orange-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">100% Verified Quality</h4>
              <p className="text-zinc-400 mt-0.5">Every asset is hand-audited for code quality and security.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="p-2 bg-zinc-800 text-orange-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">Commercial Licensing</h4>
              <p className="text-zinc-400 mt-0.5">Clear commercial rights included for client & personal projects.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="p-2 bg-zinc-800 text-orange-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">Lifetime Updates</h4>
              <p className="text-zinc-400 mt-0.5">Re-download newer versions at zero extra cost.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Navigation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 py-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.websiteName} 
                  className="h-10 w-auto max-w-[140px] object-contain rounded-xl drop-shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xl tracking-tighter shadow-md shadow-orange-600/20">
                  {(settings.logoText || settings.websiteName || 'S').trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-base font-black tracking-tight text-white block leading-tight">
                  {settings.logoText || settings.websiteName}
                </span>
                <span className="text-[10px] font-semibold text-orange-500 block uppercase tracking-widest leading-none">
                  {settings.logoSubtext || settings.tagline}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              {settings.footerAbout}
            </p>

            {/* Newsletter */}
            <div className="pt-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Subscribe to New Release Drops</h5>
              {subscribed ? (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-start justify-between gap-2">
                  <span>Thank you for subscribing! Check your inbox for exclusive creator discounts.</span>
                  <button 
                    onClick={() => setSubscribed(false)}
                    className="p-1 hover:bg-emerald-900/50 rounded-md transition-colors shrink-0 text-emerald-400 hover:text-emerald-300"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                    <input
                      type="email"
                      required
                      disabled={isSubscribing}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-orange-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing}
                      className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                    >
                      {isSubscribing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          Join
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                  {subscribeError && (
                    <p className="text-red-400 text-[10px]">{subscribeError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Categories Links */}
          <div className="space-y-3 text-xs">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Product Categories ({categories.length})</h5>
            <ul className="space-y-2 text-zinc-400 font-medium">
              {categories.map(cat => (
                <li key={cat.id || cat.slug}>
                  <button
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat.slug);
                      setActiveTab('shop');
                    }}
                    className="hover:text-orange-400 transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Navigation & Help</h5>
            <ul className="space-y-2 text-zinc-400 font-medium">
              <li>
                <button onClick={() => setActiveTab('about')} className="hover:text-orange-400 transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('contact')} className="hover:text-orange-400 transition-colors">
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('faq')} className="hover:text-orange-400 transition-colors">
                  FAQ & Help Center
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('customer-dashboard')} className="hover:text-orange-400 transition-colors">
                  Customer Account
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('track-order')} className="hover:text-orange-400 transition-colors">
                  Track Order Status
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('my-downloads')} className="hover:text-orange-400 transition-colors">
                  Download Library
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('license')} className="hover:text-orange-400 transition-colors">
                  Commercial License Terms
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Policies & Contact */}
          <div className="space-y-3 text-xs">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Legal & Terms</h5>
            <ul className="space-y-2 text-zinc-400 font-medium">
              <li>
                <button onClick={() => setActiveTab('terms')} className="hover:text-orange-400 transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('privacy')} className="hover:text-orange-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('refund')} className="hover:text-orange-400 transition-colors">
                  Refund & Guarantee Policy
                </button>
              </li>
              <li>
                <span className="text-zinc-400 block pt-2">Email: {settings.contactEmail}</span>
              </li>
              <li>
                <span className="text-zinc-400 block">Phone: {settings.contactPhone}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>&copy; {new Date().getFullYear()} {settings.websiteName}. All rights reserved. Crafted for global creators.</p>
          
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> Premium Digital Marketplace
            </span>
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-300">
              Currency: {settings.currencyCode} ({settings.currencySymbol})
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
