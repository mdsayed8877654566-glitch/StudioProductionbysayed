import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface StaticPageProps {
  pageType: 'about' | 'contact' | 'faq' | 'terms' | 'privacy' | 'license';
}

export const StaticPages: React.FC<StaticPageProps> = ({ pageType }) => {
  const { settings } = useSettings();
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* ABOUT US */}
      {pageType === 'about' && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-orange-900">About Studio Collection</h1>
            <p className="text-xs text-orange-600 mt-1">{settings.tagline}</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-orange-700 leading-relaxed">
            <p>
              Studio Collection is a high-performance digital marketplace built specifically for modern creators, developers, designers, and entrepreneurs. Our mission is to curate the highest quality web applications, portfolio themes, Figma design systems, video graphics, e-books, and source code.
            </p>
            <p>
              Unlike generic static digital marketplaces, every item in Studio Collection is thoroughly tested for architectural cleanliness, responsive design, and production readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-5 bg-white border border-orange-100 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-orange-900">12,400+ Downloads</h3>
              <p className="text-xs text-orange-600">Delivered to customers worldwide.</p>
            </div>
            <div className="p-5 bg-white border border-orange-100 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-orange-900">Commercial License</h3>
              <p className="text-xs text-orange-600">Included standard with every purchase.</p>
            </div>
            <div className="p-5 bg-white border border-orange-100 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-orange-900">Lifetime Updates</h3>
              <p className="text-xs text-orange-600">Instant access from your dashboard.</p>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT US */}
      {pageType === 'contact' && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-orange-900">Contact Support Team</h1>
            <p className="text-xs text-orange-600 mt-1">Have a question about a digital asset or license? Send us a message.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 text-xs text-orange-700">
              <div className="p-4 bg-white border border-orange-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-orange-900">
                  <Mail className="w-4 h-4 text-orange-900" /> Support Email
                </div>
                <p>{settings.contactEmail}</p>
              </div>

              <div className="p-4 bg-white border border-orange-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-orange-900">
                  <Phone className="w-4 h-4 text-orange-900" /> Customer Phone
                </div>
                <p>{settings.contactPhone}</p>
              </div>
            </div>

            <div className="p-6 bg-white border border-orange-100 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-orange-900">Send Direct Message</h3>
              
              {contactSubmitted ? (
                <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl">
                  Thank you! Your message has been sent to support.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Your Name</label>
                    <input required type="text" className="w-full p-2.5 bg-orange-50 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Your Email</label>
                    <input required type="email" className="w-full p-2.5 bg-orange-50 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Message</label>
                    <textarea required rows={3} className="w-full p-2.5 bg-orange-50 border rounded-xl" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-orange-600 text-white font-bold rounded-xl">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      {pageType === 'faq' && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-orange-900">Frequently Asked Questions</h1>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {[
              { q: 'How do digital downloads work?', a: 'Immediately after completing checkout, your files will be available for direct download on the Order Confirmation page and in your Customer Dashboard under "My Downloads".' },
              { q: 'Can I use purchased templates for client work?', a: 'Yes! All digital products include a commercial license allowing you to use them in personal projects as well as client deliverables.' },
              { q: 'What payment methods do you support?', a: 'We support Stripe (Credit Cards), PayPal, SSLCommerz, bKash, and Nagad.' },
              { q: 'Do products receive future framework updates?', a: 'Yes. All codebase purchases include lifetime access to updated versions from your account dashboard.' }
            ].map((faq, idx) => (
              <div key={idx} className="p-5 bg-white border border-orange-100 rounded-2xl space-y-2">
                <h3 className="font-bold text-orange-900">{faq.q}</h3>
                <p className="text-xs text-orange-700 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TERMS & PRIVACY & LICENSE */}
      {(pageType === 'terms' || pageType === 'privacy' || pageType === 'license') && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-orange-900 capitalize">{pageType} Policy</h1>
          </div>

          <div className="p-6 bg-white border border-orange-100 rounded-2xl space-y-4 text-xs text-orange-700 leading-relaxed">
            <p>
              Last Updated: {new Date().toLocaleDateString()}
            </p>
            <p>
              Welcome to Studio Collection. By purchasing or downloading digital items from our platform, you agree to abide by our standard commercial terms and usage policies.
            </p>
            <h4 className="font-bold text-orange-900">Commercial Usage</h4>
            <p>
              You are granted a non-exclusive, non-transferable license to use the downloaded asset in commercial projects. Re-distribution or selling the raw source code on competing marketplaces is strictly prohibited.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
