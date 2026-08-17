import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CreditCard, CheckCircle2, ArrowRight, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { storeService } from '../services/storeService';
import { imageStorage } from '../services/imageStorage';
import { Order } from '../types';

interface CheckoutPageProps {
  onOrderComplete: (order: Order) => void;
  setActiveTab: (tab: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onOrderComplete, setActiveTab }) => {
  const { cart, subtotal, discountAmount, taxAmount, total, appliedCoupon, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<'bkash'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <button onClick={() => setActiveTab('shop')} className="px-5 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl">
          Return to Shop
        </button>
      </div>
    );
  }

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) return;

    if (total > 0 && paymentMethod === 'bkash' && !transactionId.trim()) {
      alert("Please provide the bKash Transaction ID.");
      return;
    }

    if (user) {
      const currentUserData = storeService.getUsers().find(u => u.id === user.id);
      if (currentUserData && currentUserData.status === 'disabled') {
        alert("Your account has been banned. You cannot place orders.");
        return;
      }
    }

    setProcessing(true);

    setTimeout(async () => {
      const orderItems = cart.filter(item => item && item.product).map(({ product }) => ({
        productId: product.id,
        productName: product.name,
        categoryName: product.categoryName,
        thumbnail: product.thumbnail,
        price: product.price,
        version: product.version,
        downloadUrl: product.downloadFileUrl || '#',
        fileSize: product.fileSize
      }));

      const newOrder = await storeService.createOrder({
        userId: user?.id || 'guest-' + Date.now(),
        customerName,
        customerEmail,
        items: orderItems,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon?.code,
        taxAmount,
        total,
        paymentMethod: total > 0 ? 'BKASH' : 'FREE',
        paymentStatus: total > 0 ? 'Pending' : 'Paid',
        orderStatus: total > 0 ? 'Pending' : 'Completed',
        transactionId: total > 0 ? transactionId : undefined,
        paymentProofUrl: total > 0 ? paymentProofUrl : undefined
      });

      // Send email notification to admin via backend
      fetch('/api/notify-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: newOrder.orderNumber,
          customerName: newOrder.customerName,
          customerEmail: newOrder.customerEmail,
          total: newOrder.total,
          paymentMethod: newOrder.paymentMethod,
        })
      }).catch(err => console.error("Error sending notification:", err));

      clearCart();
      setProcessing(false);
      onOrderComplete(newOrder);
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Secure Digital Checkout</h1>
        <p className="text-xs text-zinc-500 mt-1">Complete your purchase to receive instant access to your digital files.</p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Customer Information & Payment Gateways */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Customer Details */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-600" /> Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Email Address (for Digital Delivery)</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-zinc-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Configured Options */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-900" /> Payment Method
            </h3>

            {total > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700">
                  <p className="font-bold text-zinc-900 mb-2">Instructions for bKash Payment:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Send the money to our bKash number: <strong className="text-zinc-900">+8801333345207</strong>.</li>
                    <li>After sending the money, an authentic transaction ID will be provided to you by bKash.</li>
                    <li>Once the authentic transaction ID is provided below, your order will be submitted.</li>
                    <li>Then it will go to pending status.</li>
                    <li>After we verify the transaction and approve your order, we will deliver your digital assets.</li>
                  </ul>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">bKash Transaction ID (TrxID) *</label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 9XZ3A7K"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Payment Screenshot (Optional)</label>
                  <label className={`cursor-pointer w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-dashed border-zinc-200 hover:border-orange-500 rounded-xl transition-colors text-xs font-bold text-zinc-700 ${isUploadingProof ? 'opacity-50 cursor-wait' : ''}`}>
                    {isUploadingProof ? <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> : (paymentProofUrl ? <ImageIcon className="w-4 h-4 text-orange-500" /> : <UploadCloud className="w-4 h-4 text-zinc-500" />)}
                    {isUploadingProof ? 'Uploading...' : (paymentProofUrl ? 'Screenshot Uploaded' : 'Upload Screenshot')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingProof}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setIsUploadingProof(true);
                            const url = await imageStorage.uploadPaymentProof(`proof_${Date.now()}`, file);
                            if (url) {
                              setPaymentProofUrl(url);
                            } else {
                              alert("Failed to upload screenshot.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Failed to upload screenshot.");
                          } finally {
                            setIsUploadingProof(false);
                          }
                        }
                      }}
                    />
                  </label>
                  {paymentProofUrl && (
                    <div className="mt-2 flex justify-end">
                      <button type="button" onClick={() => setPaymentProofUrl('')} className="text-[10px] font-medium text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 text-center font-medium">
                No payment required for free orders.
              </div>
            )}

            <div className="pt-2 flex items-center gap-2 text-[11px] text-zinc-500">
              <Lock className="w-3.5 h-3.5 text-orange-600" />
              <span>Encrypted 256-bit SSL server verification</span>
            </div>
          </div>

        </div>

        {/* Order Review & Complete Order */}
        <div className="lg:col-span-5 bg-zinc-50 border border-zinc-200 p-6 rounded-2xl space-y-6 h-fit">
          <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-200 pb-3">Order Items</h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.filter(item => item && item.product).map(({ product }) => (
              <div key={product.id} className="flex gap-3 text-xs">
                <img src={product.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover bg-zinc-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-zinc-900 truncate">{product.name}</h4>
                  <p className="text-[11px] text-zinc-500">{product.fileFormat}</p>
                </div>
                <span className="font-bold text-zinc-900">{settings.currencySymbol}{product.price}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-zinc-700 border-t border-zinc-200 pt-3">
            <div className="flex justify-between"><span>Subtotal</span><span>{settings.currencySymbol}{subtotal.toFixed(2)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-orange-600 font-semibold"><span>Discount</span><span>-{settings.currencySymbol}{discountAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-sm font-black text-zinc-900 pt-2 border-t border-zinc-200">
              <span>Total Due</span>
              <span>{settings.currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <span>Verifying & Generating Download Tokens...</span>
            ) : (
              <>
                Pay {settings.currencySymbol}{total.toFixed(2)} & Get Downloads
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
