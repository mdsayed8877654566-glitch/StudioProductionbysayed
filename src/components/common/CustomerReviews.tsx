import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  X,
  PenSquare,
  CheckCircle,
  ShoppingBag
} from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { storeService } from '../../services/storeService';
import { upsertReviewInSupabase } from '../../lib/supabase';

interface CustomerReviewsProps {
  product: Product;
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (isOpen: boolean) => void;
  onBuyNow: () => void;
  setActiveTab: (tab: string) => void;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  product,
  isReviewModalOpen,
  setIsReviewModalOpen,
  onBuyNow,
  setActiveTab
}) => {
  const { user, isAdmin } = useAuth();
  
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const reviews = storeService.getProductReviews(product.id);
  
  const isCustomer = user && !isAdmin;
  const hasPurchased = user ? storeService.hasUserPurchasedProduct(user.id, user.email, product.id) : false;
  const hasReviewed = user ? storeService.hasUserReviewedProduct(user.id, user.email, product.id) : false;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    if (!user || !isCustomer) {
      alert("Only registered customer accounts can post reviews.");
      return;
    }
    if (!hasPurchased) {
      alert("Only customers who have purchased this product can leave a review.");
      return;
    }

    const newReview = storeService.addReview({
      productId: product.id,
      productName: product.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      rating: reviewRating,
      title: reviewTitle.trim() || undefined,
      comment: reviewComment.trim(),
      verifiedPurchase: true
    });
    upsertReviewInSupabase(newReview);

    setReviewComment('');
    setReviewTitle('');
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setIsReviewModalOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Reviews Section Top Action Bar */}
      <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            Verified Customer Feedback ({reviews.length})
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Authentic reviews and ratings from verified buyers of this digital asset.
          </p>
        </div>

        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all shrink-0 w-fit"
        >
          <PenSquare className="w-4 h-4 text-white" />
          <span>Write a Review</span>
        </button>
      </div>
      
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="p-8 bg-white text-center rounded-2xl border border-zinc-200/80 space-y-3">
            <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-xs text-zinc-600 font-medium">No reviews yet for this product.</p>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-xs font-bold rounded-xl transition-all"
            >
              Be the First Purchaser to Write a Review
            </button>
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-5 bg-white rounded-2xl border border-zinc-200/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={rev.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-900">{rev.userName}</h4>
                      {rev.verifiedPurchase && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 font-bold text-[9px] uppercase rounded-full flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3 text-orange-600" /> Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">{rev.date}</span>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              {rev.title && <h5 className="font-bold text-xs text-zinc-900">{rev.title}</h5>}
              <p className="text-xs text-zinc-600 leading-relaxed">{rev.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* ADD REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-50 text-orange-700 rounded-xl border border-orange-200/80">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Add Customer Review</h3>
                  <p className="text-[11px] text-zinc-500">Submit verified rating & feedback</p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Banner */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80">
              <img
                src={product.thumbnail}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-zinc-900 truncate">{product.name}</h4>
                <span className="text-[11px] text-zinc-500 font-medium">{product.categoryName} • {product.fileFormat}</span>
              </div>
            </div>

            {/* Customer Verification State Conditions */}
            {reviewSubmitted ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Review Submitted Successfully!</span>
                </div>
                <p className="text-emerald-700 text-xs leading-relaxed">
                  Thank you for sharing your feedback. Your rating and comment have been verified and added to the product catalog.
                </p>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                >
                  Done
                </button>
              </div>
            ) : !user ? (
              <div className="p-5 bg-orange-50/90 border border-orange-200/80 rounded-2xl text-xs text-orange-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-orange-900">
                  <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
                  Authentication Required
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  You must be logged in as a registered customer account to rate and review this product.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      setActiveTab('auth');
                    }}
                    className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all text-xs shadow-lg shadow-orange-600/20"
                  >
                    Log In / Sign Up
                  </button>
                  <button
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-50 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : isAdmin ? (
              <div className="p-5 bg-zinc-100 border border-zinc-200 rounded-2xl text-xs text-zinc-700 space-y-3">
                <p className="font-semibold text-zinc-900">Administrator Notice</p>
                <p className="leading-relaxed">
                  You are currently logged in as an <strong>Administrator</strong>. Customer reviews are reserved for customer accounts to preserve genuine customer feedback.
                </p>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="w-full py-2.5 bg-zinc-950 text-white font-bold rounded-xl text-xs hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            ) : !hasPurchased ? (
              <div className="p-5 bg-orange-50 border border-orange-200/90 rounded-2xl text-xs text-orange-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-zinc-950">
                  <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                  Verified Purchase Required
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  To maintain authentic customer feedback, only customers who have purchased or downloaded this asset can leave a review.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      onBuyNow();
                    }}
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-600/20"
                  >
                    <ShoppingBag className="w-4 h-4" /> Purchase & Download
                  </button>
                  <button
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-50 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : hasReviewed ? (
              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Review Already Submitted
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  You have already submitted a verified customer review for this product. Thank you!
                </p>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="w-full py-2.5 bg-zinc-950 text-white font-bold rounded-xl text-xs hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Verified Review Submission Form */
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex items-center justify-between text-xs text-orange-700 bg-orange-50 px-3.5 py-2 rounded-xl border border-orange-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-orange-600" /> Verified Customer Purchaser
                  </span>
                  <span className="text-[11px] text-zinc-900 font-medium">{user.name}</span>
                </div>

                {/* Star Rating Interactive Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800">Your Star Rating</label>
                    <span className="text-xs font-bold text-amber-600">
                      {(hoverRating || reviewRating) === 5 && '5.0 — Excellent!'}
                      {(hoverRating || reviewRating) === 4 && '4.0 — Very Good'}
                      {(hoverRating || reviewRating) === 3 && '3.0 — Average'}
                      {(hoverRating || reviewRating) === 2 && '2.0 — Fair'}
                      {(hoverRating || reviewRating) === 1 && '1.0 — Poor'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 transition-transform hover:scale-110 focus:outline-none"
                        title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            (hoverRating || reviewRating) >= star
                              ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                              : 'text-zinc-300 fill-zinc-100'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-800 block">Review Headline (Optional)</label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Clean code structure, excellent documentation!"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-600"
                  />
                </div>

                {/* Review Comment Area */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800 block">Detailed Feedback</label>
                    <span className="text-[10px] text-zinc-400">{reviewComment.length}/500 chars</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    maxLength={500}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this codebase, template, performance, design quality, or support..."
                    className="w-full p-3.5 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-600 leading-relaxed"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Star className="w-4 h-4 fill-white text-white" />
                    Submit Review
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
