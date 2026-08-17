import React, { useState } from 'react';
import { CheckCircle, Download, FileText, ArrowRight, ShieldCheck, Copy, Sparkles, Star, MessageSquare } from 'lucide-react';
import { Order } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { storeService } from '../services/storeService';

interface OrderSuccessPageProps {
  order: Order | null;
  setActiveTab: (tab: string) => void;
}

const PostPurchaseReviewItem: React.FC<{
  productId: string;
  productName: string;
  thumbnail: string;
  order: Order;
}> = ({ productId, productName, thumbnail, order }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const existingReview = storeService.hasUserReviewedProduct(order.userId, order.customerEmail, productId);

  if (submitted || existingReview) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-3">
          <img src={thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
          <div>
            <h4 className="font-bold text-zinc-900">{productName}</h4>
            <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Verified Customer Review Submitted
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-full shrink-0">
          Verified
        </span>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newReview = storeService.addReview({
      productId,
      productName,
      userId: order.userId || user?.id || 'cust-' + Date.now(),
      userName: order.customerName || user?.name || 'Verified Customer',
      userEmail: order.customerEmail || user?.email,
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      rating,
      comment,
      verifiedPurchase: true
    });

    setSubmitted(true);
  };

  return (
    <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
      <div className="flex items-center gap-3">
        <img src={thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover bg-zinc-200 shrink-0" />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
            Rate Your Purchase
          </span>
          <h4 className="text-xs font-bold text-zinc-900 mt-1">{productName}</h4>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div>
          <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Select Star Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
              </button>
            ))}
            <span className="text-xs font-bold text-zinc-700 ml-2">{rating} / 5</span>
          </div>
        </div>

        <div>
          <textarea
            required
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`How is your experience with ${productName}? Leave a quick review...`}
            className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <Star className="w-3.5 h-3.5 fill-white" /> Submit Verified Review
        </button>
      </form>
    </div>
  );
};

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ order, setActiveTab }) => {
  const { settings } = useSettings();

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">No order details found</h2>
        <button onClick={() => setActiveTab('shop')} className="px-5 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl">
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Confirmation Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${order.orderStatus === 'Pending' ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>
            {order.orderStatus === 'Pending' ? 'Payment Verification Pending' : 'Payment Verified & Completed'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">{order.orderStatus === 'Pending' ? 'Order Received!' : 'Thank You for Your Order!'}</h1>
          <p className="text-xs text-zinc-600">Order Number: <strong className="text-zinc-900 font-mono">{order.orderNumber}</strong></p>
        </div>

        <div className="p-3 bg-zinc-50 rounded-2xl text-xs text-zinc-700 max-w-md mx-auto">
          We have sent a purchase confirmation and receipt to <strong className="text-zinc-900">{order.customerEmail}</strong>.
        </div>
      </div>

      {/* Digital Download Action Box */}
      <div className="bg-zinc-950 text-white p-8 rounded-3xl shadow-xl space-y-6 border border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold">Your Purchased Digital Deliverables</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Token: {order.downloadToken.substring(0, 10)}...</span>
        </div>

        {order.orderStatus === 'Pending' ? (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-2">
            <p className="text-sm font-bold text-amber-400">Downloads Locked - Payment Pending</p>
            <p className="text-xs text-zinc-400">Once an admin verifies your bKash payment, the order will be completed and your downloads will be unlocked.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover bg-zinc-800 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.productName}</h4>
                    <p className="text-[11px] text-zinc-400">{item.categoryName} • {item.version} ({item.fileSize})</p>
                  </div>
                </div>

                <a
                  href={item.downloadUrl || '#'}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4 text-white" />
                  Download Files
                </a>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-400" /> Lifetime access saved in your account dashboard
          </span>
          <button
            onClick={() => setActiveTab('my-downloads')}
            className="text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 font-bold"
          >
            Go to My Downloads &rarr;
          </button>
        </div>
      </div>
      {/* Automatically Suggest Customer Leave Reviews Box */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Verified Customer Review Suggestion
            </span>
            <h3 className="text-base font-extrabold text-zinc-900 mt-1">
              Rate Your New Digital Deliverables
            </h3>
            <p className="text-xs text-zinc-600">
              Help fellow creators by sharing your authentic feedback on your recent purchase!
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <PostPurchaseReviewItem
              key={idx}
              productId={item.productId}
              productName={item.productName}
              thumbnail={item.thumbnail}
              order={order}
            />
          ))}
        </div>
      </div>

    </div>
  );
};
