import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  CreditCard, 
  Package, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Star, 
  UploadCloud, 
  FileText, 
  HelpCircle,
  X,
  Loader2,
  Calendar,
  DollarSign,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { Order, Product } from '../../types';
import { storeService } from '../../services/storeService';
import { useSettings } from '../../contexts/SettingsContext';
import { uploadPaymentProof, upsertOrderInSupabase } from '../../lib/supabase';

interface OrderStatusTrackerProps {
  initialOrderId?: string;
  customerOrders?: Order[];
  onOpenReviewModal?: (productId: string, productName: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  initialOrderId = '',
  customerOrders = [],
  onOpenReviewModal,
  onSelectProduct
}) => {
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState(initialOrderId);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofSuccessMsg, setProofSuccessMsg] = useState(false);

  // Function to execute real-time order tracking
  const handleTrackOrder = useCallback(async (queryToTrack?: string) => {
    const targetQuery = (queryToTrack !== undefined ? queryToTrack : searchQuery).trim();
    if (!targetQuery) {
      setErrorMessage('Please enter an Order ID or Order Number (e.g. SC-123456).');
      setTrackedOrder(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await storeService.fetchOrderRealtime(targetQuery);
      if (result.success && result.order) {
        setTrackedOrder(result.order);
        setLastSyncTime(new Date().toLocaleTimeString());
        setErrorMessage(null);
      } else {
        setTrackedOrder(null);
        setErrorMessage(result.error || `No order found matching "${targetQuery}". Please verify the order ID.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to fetch real-time order status.');
      setTrackedOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Handle manual live refresh
  const handleManualRefresh = async () => {
    if (!trackedOrder) return;
    setIsRefreshing(true);
    try {
      const result = await storeService.fetchOrderRealtime(trackedOrder.orderNumber || trackedOrder.id);
      if (result.success && result.order) {
        setTrackedOrder(result.order);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // If initialOrderId provided or changes, track automatically
  useEffect(() => {
    if (initialOrderId && initialOrderId.trim()) {
      setSearchQuery(initialOrderId.trim());
      handleTrackOrder(initialOrderId.trim());
    } else if (customerOrders.length > 0 && !trackedOrder) {
      // Default to most recent order if customer has orders
      const latest = customerOrders[0];
      if (latest) {
        setSearchQuery(latest.orderNumber);
        setTrackedOrder(latest);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    }
  }, [initialOrderId, customerOrders, handleTrackOrder]);

  // Subscribe to live store changes (e.g. when Admin changes status in DB)
  useEffect(() => {
    const handleStoreChange = () => {
      if (trackedOrder) {
        const updated = storeService.findOrderByQuery(trackedOrder.orderNumber || trackedOrder.id);
        if (updated) {
          setTrackedOrder(updated);
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      }
    };

    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, [trackedOrder]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Helper to determine status progress step
  const getStatusStepIndex = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'pending') return 1;
    if (normalized === 'approved' || normalized === 'paid') return 2;
    if (normalized === 'completed') return 3;
    return 0; // Failed / Cancelled / Refunded
  };

  const isOrderSuccessful = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'completed' || s === 'approved' || s === 'paid';
  };

  const isOrderFailedOrCancelled = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'failed' || s === 'cancelled' || s === 'refunded';
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Lookup Header Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-zinc-900 tracking-tight">Real-Time Order Status Tracker</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Track live processing milestones, bKash verification, and digital asset releases directly from the database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>
        </div>

        {/* Search Bar Input */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleTrackOrder();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Order Number (e.g. SC-849120) or Order ID (e.g. ord-171...)"
              className="w-full pl-11 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-orange-600 focus:outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTrackedOrder(null);
                  setErrorMessage(null);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isLoading ? 'Checking Database...' : 'Track Real-Time Status'}</span>
          </button>
        </form>

        {/* Quick-Select Recent Orders Chips */}
        {customerOrders.length > 0 && (
          <div className="pt-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Quick Select Your Orders:
            </span>
            <div className="flex flex-wrap gap-2">
              {customerOrders.map((ord) => {
                const isSelected = trackedOrder?.id === ord.id || trackedOrder?.orderNumber === ord.orderNumber;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(ord.orderNumber);
                      setTrackedOrder(ord);
                      setErrorMessage(null);
                      setLastSyncTime(new Date().toLocaleTimeString());
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <span>#{ord.orderNumber}</span>
                    <span className="text-[10px] opacity-70 font-normal">({settings.currencySymbol}{ord.total})</span>
                    <span className={`w-2 h-2 rounded-full ${
                      isOrderFailedOrCancelled(ord.orderStatus)
                        ? 'bg-red-500'
                        : isOrderSuccessful(ord.orderStatus)
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-800 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Order Lookup Notice</p>
              <p className="text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* TRACKED ORDER RESULT PANEL */}
      {trackedOrder && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Order Header & Live Sync Status */}
          <div className="bg-zinc-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">Order Number:</span>
                  <span className="text-xl font-black text-white font-mono">#{trackedOrder.orderNumber}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(trackedOrder.orderNumber)}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Copy Order Number"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Placed on {new Date(trackedOrder.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="font-mono text-zinc-400 text-[11px]">ID: {trackedOrder.id}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                  title="Poll database for real-time changes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
                </button>

                <div className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border ${
                  isOrderFailedOrCancelled(trackedOrder.orderStatus)
                    ? 'bg-red-950/80 border-red-800 text-red-400'
                    : isOrderSuccessful(trackedOrder.orderStatus)
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                    : 'bg-amber-950/80 border-amber-800 text-amber-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isOrderFailedOrCancelled(trackedOrder.orderStatus)
                      ? 'bg-red-400'
                      : isOrderSuccessful(trackedOrder.orderStatus)
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400 animate-pulse'
                  }`} />
                  <span>{trackedOrder.orderStatus}</span>
                </div>
              </div>
            </div>

            {/* LIVE STEPPER PROGRESS TIMELINE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold text-zinc-200">Real-Time Progression Milestones</span>
                <span className="text-[11px] text-zinc-400">Last verified: {lastSyncTime}</span>
              </div>

              {isOrderFailedOrCancelled(trackedOrder.orderStatus) ? (
                <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="font-bold">Order {trackedOrder.orderStatus}</p>
                    <p className="text-red-400 text-[11px] mt-0.5">
                      This order has been marked as {trackedOrder.orderStatus.toLowerCase()}. Digital download access is inactive. If you have questions, please reach out to customer support.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  {(() => {
                    const stepIdx = getStatusStepIndex(trackedOrder.orderStatus);
                    const stages = [
                      { title: 'Order Placed', desc: 'Recorded in Database', icon: <FileText className="w-4 h-4" /> },
                      { title: 'Payment Processing', desc: trackedOrder.paymentMethod === 'BKASH' ? 'bKash Verification' : 'Gateway Verification', icon: <CreditCard className="w-4 h-4" /> },
                      { title: 'Payment Verified', desc: 'Approved by System', icon: <ShieldCheck className="w-4 h-4" /> },
                      { title: 'Deliverables Active', desc: 'Files Ready in Vault', icon: <Package className="w-4 h-4" /> },
                    ];

                    return (
                      <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-zinc-800 z-0">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${(Math.min(stepIdx, 3) / 3) * 100}%` }}
                          />
                        </div>

                        {/* Stages Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                          {stages.map((stage, idx) => {
                            const isDone = idx <= stepIdx;
                            const isCurrent = idx === stepIdx;

                            return (
                              <div 
                                key={idx}
                                className={`p-4 rounded-2xl border transition-all flex md:flex-col items-center md:text-center gap-3 ${
                                  isDone
                                    ? isCurrent
                                      ? 'bg-zinc-800 border-orange-500 text-white shadow-lg'
                                      : 'bg-zinc-800/60 border-emerald-500/50 text-zinc-200'
                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 opacity-60'
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all ${
                                  isDone
                                    ? isCurrent
                                      ? 'bg-orange-600 text-white shadow-md animate-pulse'
                                      : 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                                }`}>
                                  {isDone && !isCurrent ? <Check className="w-5 h-5" /> : stage.icon}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold flex items-center md:justify-center gap-1.5">
                                    <span>{stage.title}</span>
                                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 mt-0.5">{stage.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Contextual Status Help Message */}
            <div className="p-4 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                <div>
                  {trackedOrder.orderStatus === 'Pending' && (
                    <span>We are verifying your transaction. As soon as the administrator or gateway verifies payment, files will be immediately unlocked below.</span>
                  )}
                  {trackedOrder.orderStatus === 'Paid' && (
                    <span>Payment confirmed! Your digital assets and lifetime license keys are active and ready.</span>
                  )}
                  {trackedOrder.orderStatus === 'Approved' && (
                    <span>Order approved by store administration! Your digital assets are ready for instant download.</span>
                  )}
                  {trackedOrder.orderStatus === 'Completed' && (
                    <span>Order successfully fulfilled! Download your deliverables and access your files anytime.</span>
                  )}
                  {isOrderFailedOrCancelled(trackedOrder.orderStatus) && (
                    <span>Processing halted. If this is an error, please reach out to our 24/7 customer support.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* bKash Payment Proof Section (If BKASH and Proof Needed) */}
          {trackedOrder.paymentMethod === 'BKASH' && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 font-black flex items-center justify-center text-xs">
                    bK
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">bKash Mobile Payment Verification</h3>
                    <p className="text-[11px] text-zinc-500">Transaction details submitted during checkout</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  trackedOrder.paymentProofUrl ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {trackedOrder.paymentProofUrl ? 'Screenshot Attached' : 'Awaiting Screenshot Proof'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-zinc-50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Submitted TrxID</span>
                  <p className="text-sm font-mono font-bold text-zinc-900">{trackedOrder.transactionId || 'Not provided'}</p>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Screenshot Proof</span>
                    <p className="text-xs font-semibold text-zinc-800">
                      {trackedOrder.paymentProofUrl ? 'Attached to Order' : 'Upload proof for fast approval'}
                    </p>
                  </div>

                  {trackedOrder.paymentProofUrl ? (
                    <a
                      href={trackedOrder.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-600" /> View Proof
                    </a>
                  ) : (
                    <label className={`cursor-pointer px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                      isUploadingProof ? 'opacity-70 cursor-wait' : ''
                    }`}>
                      {isUploadingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      <span>{isUploadingProof ? 'Uploading...' : 'Upload Proof'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingProof}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingProof(true);
                          try {
                            const url = await uploadPaymentProof(`proof_${trackedOrder.orderNumber}_${Date.now()}`, file);
                            if (url) {
                              const updated = { ...trackedOrder, paymentProofUrl: url };
                              await upsertOrderInSupabase(updated);
                              storeService.updateOrder(updated);
                              setTrackedOrder(updated);
                              setProofSuccessMsg(true);
                              setTimeout(() => setProofSuccessMsg(false), 4000);
                            }
                          } catch (err) {
                            console.error('Proof upload error:', err);
                          } finally {
                            setIsUploadingProof(false);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {proofSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Payment proof uploaded and synced to database! Our team is reviewing it.</span>
                </div>
              )}
            </div>
          )}

          {/* DIGITAL DELIVERABLES & ITEMS LIST */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" /> Purchased Digital Items ({trackedOrder.items.length})
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isOrderSuccessful(trackedOrder.orderStatus)
                    ? 'Instant download access is fully authorized.'
                    : 'Download links will activate immediately upon payment verification.'}
                </p>
              </div>

              <span className="text-xs font-black text-zinc-900">
                Total: {settings.currencySymbol}{trackedOrder.total}
              </span>
            </div>

            <div className="space-y-3">
              {trackedOrder.items.map((item, idx) => {
                const canDownload = isOrderSuccessful(trackedOrder.orderStatus);

                return (
                  <div
                    key={idx}
                    className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-all hover:bg-zinc-100/70"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={item.thumbnail}
                        alt={item.productName}
                        className="w-12 h-12 rounded-xl object-cover bg-white border border-zinc-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                          {item.categoryName}
                        </span>
                        <h4 className="font-bold text-zinc-900 text-sm truncate">{item.productName}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span>Version: {item.version || 'v1.0.0'}</span>
                          <span>•</span>
                          <span>Size: {item.fileSize || 'Digital Asset'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <span className="font-black text-zinc-900 text-sm">
                        {settings.currencySymbol}{item.price}
                      </span>

                      {canDownload ? (
                        <div className="flex items-center gap-2">
                          {onOpenReviewModal && (
                            <button
                              type="button"
                              onClick={() => onOpenReviewModal(item.productId, item.productName)}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Star className="w-3.5 h-3.5 fill-white" /> Review
                            </button>
                          )}
                          <a
                            href={item.downloadUrl || '#'}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 bg-zinc-200 text-zinc-500 font-bold text-[11px] rounded-xl flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Pending Verification
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ORDER FINANCIAL SUMMARY */}
            <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div className="space-y-1 text-zinc-500">
                <p>Payment Method: <strong className="text-zinc-800 font-semibold">{trackedOrder.paymentMethod}</strong></p>
                <p>Customer: <strong className="text-zinc-800 font-semibold">{trackedOrder.customerName}</strong> ({trackedOrder.customerEmail})</p>
                {trackedOrder.couponCode && (
                  <p className="text-emerald-600 font-bold">Coupon Applied: {trackedOrder.couponCode} (-{settings.currencySymbol}{trackedOrder.discountAmount})</p>
                )}
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span>{settings.currencySymbol}{trackedOrder.subtotal || trackedOrder.total}</span>
                </div>
                {trackedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{settings.currencySymbol}{trackedOrder.discountAmount}</span>
                  </div>
                )}
                {trackedOrder.taxAmount > 0 && (
                  <div className="flex justify-between text-zinc-500">
                    <span>Tax</span>
                    <span>{settings.currencySymbol}{trackedOrder.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-zinc-900 pt-1.5 border-t border-zinc-200">
                  <span>Grand Total</span>
                  <span className="text-orange-600">{settings.currencySymbol}{trackedOrder.total}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
