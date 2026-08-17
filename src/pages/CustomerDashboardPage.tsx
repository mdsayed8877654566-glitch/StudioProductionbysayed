import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  ShoppingBag, 
  Download, 
  Heart, 
  ShieldCheck, 
  Key, 
  FolderTree, 
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Camera,
  Check,
  Eye,
  EyeOff,
  Star,
  MessageSquarePlus,
  X,
  Upload,
  Cloud,
  FileImage,
  Link as LinkIcon,
  Loader2,
  UploadCloud,
  Image as ImageIcon,
  Clock,
  Search,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';
import { storeService } from '../services/storeService';
import { imageStorage } from '../services/imageStorage';
import { uploadFile } from '../utils/uploadUtils';
import { Product } from '../types';
import { OrderStatusTracker } from '../components/common/OrderStatusTracker';
import { getDirectDownloadUrl } from '../utils/themeUtils';

interface CustomerDashboardPageProps {
  initialTab?: string;
  onSelectProduct: (product: Product) => void;
  setActiveTab: (tab: string) => void;
}

// Helper to convert Google Drive share link into direct displayable image URL
function parseGoogleDriveUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  
  if (trimmed.startsWith('data:image/') || trimmed.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
    return trimmed;
  }

  const match1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) {
    return `https://lh3.googleusercontent.com/d/${match1[1]}=s800`;
  }

  const match2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) {
    return `https://lh3.googleusercontent.com/d/${match2[1]}=s800`;
  }

  return trimmed;
}

export const CustomerDashboardPage: React.FC<CustomerDashboardPageProps> = ({
  initialTab = 'overview',
  onSelectProduct,
  setActiveTab
}) => {
  const { user, updateUserProfile, resetPasswordWithToken, isEmailVerified, logout } = useAuth();
  const { wishlistIds } = useWishlist();
  const { addToCart } = useCart();
  const { settings } = useSettings();

  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);
  const [trackedOrderId, setTrackedOrderId] = useState<string>('');
  const [storeVersion, setStoreVersion] = useState(0);

  // Subscribe to real-time store updates (Admin changes, broadcasts, background sync)
  useEffect(() => {
    const handleStoreChange = () => {
      setStoreVersion(v => v + 1);
    };
    window.addEventListener('studio_collection_store_change', handleStoreChange);
    return () => window.removeEventListener('studio_collection_store_change', handleStoreChange);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // Profile Edit State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [gdriveUrlInput, setGdriveUrlInput] = useState('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileAvatar(user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');
    } else {
      setProfileName('');
      setProfileEmail('');
      setProfileAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');
    }
  }, [user]);


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadNotice('File size is too large (max 5MB). Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileAvatar(event.target.result as string);
        setSelectedAvatarFile(file);
        setUploadNotice('Photo loaded from your device! Click "Save Account Profile" below.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportGDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdriveUrlInput.trim()) return;
    const directUrl = parseGoogleDriveUrl(gdriveUrlInput);
    setProfileAvatar(directUrl);
    setUploadNotice('Google Drive photo linked! Click "Save Account Profile" below.');
    setGdriveUrlInput('');
  };

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTargetProduct, setReviewTargetProduct] = useState<{ id: string; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState<Record<string, boolean>>({});

  // Filter Customer Data strictly by user.id
  const currentUserId = user?.id || '';
  const orders = storeService.getCustomerOrders(currentUserId);
  const downloads = storeService.getCustomerDownloads(currentUserId);
  const wishlistProducts = storeService.getProducts().filter(p => wishlistIds.includes(p.id));

  const handleOpenReviewModal = (productId: string, productName: string) => {
    setReviewTargetProduct({ id: productId, name: productName });
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTargetProduct || !user) return;

    const newReview = storeService.addReview({
      productId: reviewTargetProduct.id,
      productName: reviewTargetProduct.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      verifiedPurchase: true
    });

    setReviewSuccessMsg(true);
    setTimeout(() => {
      setReviewSuccessMsg(false);
      setReviewModalOpen(false);
    }, 1500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSavingProfile(true);
    let avatarUrl = profileAvatar;
    if (selectedAvatarFile) {
      const url = await imageStorage.uploadAvatar(user.id, selectedAvatarFile);
      if (url) {
        avatarUrl = url;
        setProfileAvatar(url);
        setSelectedAvatarFile(null);
      } else {
        setUploadNotice('Failed to upload avatar.');
      }
    }

    await updateUserProfile({
      name: profileName,
      email: profileEmail,
      avatar: avatarUrl
    });
    setIsSavingProfile(false);

    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!newPassword || !confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Please complete password fields.' });
      return;
    }

    if (newPassword.length < 8) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    const res = await resetPasswordWithToken(newPassword);
    if (res.success) {
      setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdMsg({ type: 'error', text: res.error || 'Failed to update password.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Unverified Email Alert Banner */}
      {!isEmailVerified && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">Your email address is pending verification</span>
              <span className="text-amber-800 text-[11px]">Check your inbox ({user?.email}) for the verification link.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('verify-email')}
            className="px-4 py-2 bg-amber-900 text-white font-bold rounded-xl whitespace-nowrap hover:bg-amber-800 transition-colors shadow-sm"
          >
            Verify Now
          </button>
        </div>
      )}

      {/* Top Profile Banner */}
      <div className="p-8 bg-zinc-900 border border-zinc-800 text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative group">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
              alt={user?.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-zinc-700 shadow-md"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{user?.name || 'Customer Account'}</h1>
              {user?.displayId && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-orange-400 border border-zinc-700 tracking-wider">
                  ID: {user.displayId}
                </span>
              )}
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase tracking-wider">
                {user?.role || 'Customer'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>{user?.email}</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Member since {user?.createdAt || 'Recent'}</span>
              <span className="mx-1">•</span>
              <span className="font-mono text-zinc-500">ID: {user?.id}</span>
            </p>
          </div>
        </div>

        {/* Stats Summary & Logout */}
        <div className="flex items-center gap-6 text-center text-xs relative z-10">
          <div>
            <div className="text-2xl font-extrabold text-white">{orders.length}</div>
            <div className="text-zinc-400 text-[11px]">Orders</div>
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <div>
            <div className="text-2xl font-extrabold text-white">{downloads.length}</div>
            <div className="text-zinc-400 text-[11px]">Downloads</div>
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <div>
            <div className="text-2xl font-extrabold text-white">{wishlistIds.length}</div>
            <div className="text-zinc-400 text-[11px]">Wishlist</div>
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <button
            onClick={() => { logout(); setActiveTab('login'); }}
            className="p-3 bg-zinc-800 hover:bg-red-950 text-zinc-300 hover:text-red-400 rounded-xl transition-colors border border-zinc-700"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-4 text-xs font-bold text-zinc-700 no-scrollbar">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 border-b-2 whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'overview' ? 'border-orange-600 text-orange-600' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <User className="w-4 h-4" /> Account Overview
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 border-b-2 whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'orders' ? 'border-orange-600 text-orange-600' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> My Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('track-order')}
          className={`pb-3 border-b-2 whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'track-order' ? 'border-orange-600 text-orange-600' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Clock className="w-4 h-4" /> Track Order Status
        </button>

        <button
          onClick={() => setActiveSubTab('downloads')}
          className={`pb-3 border-b-2 whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'downloads' ? 'border-orange-600 text-orange-600' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <FolderTree className="w-4 h-4" /> My Downloads ({downloads.length})
        </button>

        <button
          onClick={() => setActiveSubTab('wishlist')}
          className={`pb-3 border-b-2 whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'wishlist' ? 'border-orange-600 text-orange-600' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Heart className="w-4 h-4" /> Saved Wishlist ({wishlistIds.length})
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 border-b-2 whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'settings' ? 'border-orange-600 text-orange-600' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Key className="w-4 h-4" /> Edit Profile & Security
        </button>
      </div>

      {/* SUBTAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl space-y-2 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Customer Spent</span>
              <div className="text-2xl font-black text-zinc-900">{settings.currencySymbol}{user?.totalSpent || 0}</div>
            </div>

            <div className="p-6 bg-white border border-zinc-200 rounded-2xl space-y-2 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Digital Files Owned</span>
              <div className="text-2xl font-black text-zinc-900">{downloads.length} Download Files</div>
            </div>

            <div className="p-6 bg-white border border-zinc-200 rounded-2xl space-y-2 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Account Status</span>
              <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" /> {user?.status === "active" ? "Active Account" : "Account Status Unknown"}
              </div>
            </div>
          </div>

          {/* Real-time Order Tracking Quick Action */}
          <div className="p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/80 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-600 text-white rounded-lg inline-flex">
                  <Clock className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">Live Order Status Tracker</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">Real-Time Database Sync</span>
              </div>
              <p className="text-xs text-zinc-600 max-w-xl">
                Check instant real-time status updates for any order with payment verification stages, digital access readiness, and download links.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (orders.length > 0) {
                    setTrackedOrderId(orders[0].orderNumber);
                  }
                  setActiveSubTab('track-order');
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Track An Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Downloads Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">Recent Digital Vault Access</h3>
              {downloads.length > 0 && (
                <button 
                  onClick={() => setActiveSubTab('downloads')}
                  className="text-xs font-semibold text-orange-600 hover:underline"
                >
                  View All Downloads &rarr;
                </button>
              )}
            </div>

            {downloads.length === 0 ? (
              <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-center space-y-3">
                <FolderTree className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-600 font-medium">No digital downloads purchased yet.</p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20"
                >
                  Browse Digital Marketplace
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {downloads.slice(0, 3).map((dl) => (
                  <div key={dl.id} className="p-4 bg-white border border-zinc-200 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img src={dl.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover bg-zinc-100 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">{dl.productName}</h4>
                        <p className="text-[11px] text-zinc-500">{dl.fileFormat} • {dl.version} ({dl.fileSize})</p>
                      </div>
                    </div>

                    <a
                      href={getDirectDownloadUrl(dl.downloadUrl)}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-orange-600/20"
                    >
                      <Download className="w-3.5 h-3.5" /> Download File
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ORDERS */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Purchase Order History</h3>
              <p className="text-xs text-zinc-500">View your lifetime purchases and track live order progress.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (orders.length > 0) {
                  setTrackedOrderId(orders[0].orderNumber);
                }
                setActiveSubTab('track-order');
              }}
              className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
            >
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Track By Order ID</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-center space-y-3">
              <ShoppingBag className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-xs text-zinc-600 font-medium">No orders found for this account.</p>
              <button onClick={() => setActiveTab('shop')} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between border-b border-zinc-100 pb-3 text-xs gap-3">
                    <div>
                      <span className="font-bold text-zinc-900">Order #{ord.orderNumber}</span>
                      <span className="text-zinc-400 ml-2">{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setTrackedOrderId(ord.orderNumber);
                          setActiveSubTab('track-order');
                        }}
                        className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                        title="View Live Order Status Tracking"
                      >
                        <Clock className="w-3 h-3 text-orange-600" />
                        <span>Track Status</span>
                      </button>
                      <span className="font-bold text-zinc-900">{settings.currencySymbol}{ord.total}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        ['Failed', 'Cancelled', 'Refunded'].includes(ord.orderStatus)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order Tracking Timeline */}
                  {(() => {
                    const status = ord.orderStatus;
                    const steps = ['Pending', 'Paid', 'Completed'];
                    const failedSteps = ['Failed', 'Cancelled', 'Refunded'];
                    
                    if (failedSteps.includes(status)) {
                      return (
                        <div className="py-4 border-b border-zinc-100 flex items-center justify-center gap-2 text-red-600 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          Order {status} - Processing Halted
                        </div>
                      );
                    }

                    const currentIndex = steps.indexOf(status);

                    return (
                      <div className="py-6 border-b border-zinc-100">
                        <div className="flex items-center justify-between relative max-w-sm mx-auto">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 rounded-full z-0" />
                          <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-500"
                            style={{ width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' }}
                          />
                          
                          {steps.map((step, idx) => {
                            const isCompleted = idx <= currentIndex;
                            return (
                              <div key={step} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-zinc-200 text-zinc-400'}`}>
                                  {isCompleted ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-zinc-300" />}
                                </div>
                                <span className={`absolute -bottom-5 w-max text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-700' : 'text-zinc-400'}`}>
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-8 text-xs font-medium text-zinc-600 text-center">
                          {status === 'Pending' && 'We are waiting for your payment to clear.'}
                          {status === 'Paid' && 'Payment received! We are preparing your digital assets.'}
                          {status === 'Completed' && 'Your order is complete. You can download your assets below.'}
                        </div>
                      </div>
                    );
                  })()}

                  {ord.paymentMethod === 'BKASH' && (
                    <div className="py-4 border-b border-zinc-100">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-50 rounded-xl">
                        <div className="text-xs">
                          <h4 className="font-bold text-zinc-900 mb-1">bKash Payment Verification</h4>
                          {ord.transactionId && <p className="text-zinc-700 font-mono">TrxID: {ord.transactionId}</p>}
                          {ord.paymentProofUrl ? (
                            <p className="text-emerald-600 font-bold mt-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Screenshot Uploaded</p>
                          ) : (
                            <p className="text-amber-600 font-medium mt-1">Awaiting screenshot proof</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {ord.paymentProofUrl ? (
                            <a href={ord.paymentProofUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white text-zinc-700 font-bold text-xs rounded-xl shadow-sm border border-zinc-200 hover:text-zinc-900 transition-colors flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" /> View Proof
                            </a>
                          ) : (
                            <label className={`cursor-pointer px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap ${isUploadingProof[ord.id] ? 'opacity-70 cursor-wait' : ''}`}>
                              {isUploadingProof[ord.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                              {isUploadingProof[ord.id] ? 'Uploading...' : 'Upload Screenshot'}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden"
                                disabled={isUploadingProof[ord.id]}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      setIsUploadingProof(prev => ({ ...prev, [ord.id]: true }));
                                      const url = await imageStorage.uploadPaymentProof(`proof_${ord.orderNumber}_${Date.now()}`, file);
                                      if (url) {
                                        const updatedOrder = { ...ord, paymentProofUrl: url };
                                        await storeService.updateOrder(updatedOrder);
                                      } else {
                                        alert("Failed to upload screenshot.");
                                      }
                                    } catch (err) {
                                      console.error(err);
                                      alert("Failed to upload screenshot.");
                                    } finally {
                                      setIsUploadingProof(prev => ({ ...prev, [ord.id]: false }));
                                    }
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3 bg-zinc-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0" />
                          <div>
                            <h4 className="font-bold text-zinc-900">{item.productName}</h4>
                            <p className="text-[11px] text-zinc-500">{item.categoryName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="font-semibold text-zinc-800">{settings.currencySymbol}{item.price}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(item.productId, item.productName)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Star className="w-3 h-3 fill-white" /> Leave Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: ORDER STATUS TRACKER */}
      {(activeSubTab === 'track-order' || activeSubTab === 'order-status') && (
        <div className="space-y-4">
          <OrderStatusTracker
            initialOrderId={trackedOrderId}
            customerOrders={orders}
            onOpenReviewModal={handleOpenReviewModal}
            onSelectProduct={onSelectProduct}
          />
        </div>
      )}

      {/* SUBTAB 3: DOWNLOADS */}
      {activeSubTab === 'downloads' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Secure Digital Download Vault</h3>
          {downloads.length === 0 ? (
            <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-center space-y-3">
              <FolderTree className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-xs text-zinc-600 font-medium">Your download vault is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {downloads.map((dl) => (
                <div key={dl.id} className="p-5 bg-white border border-zinc-200 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <img src={dl.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover bg-zinc-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{dl.categoryName}</span>
                      <h4 className="text-xs font-bold text-zinc-900 line-clamp-1">{dl.productName}</h4>
                      <p className="text-[11px] text-zinc-600 mt-0.5">Format: {dl.fileFormat} • Version: {dl.version}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => handleOpenReviewModal(dl.productId, dl.productName)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Write Review
                    </button>
                    <a
                      href={getDirectDownloadUrl(dl.downloadUrl)}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Download File
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: WISHLIST */}
      {activeSubTab === 'wishlist' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Saved Wishlist Items</h3>
          {wishlistProducts.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">Your wishlist is currently empty.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistProducts.map((p) => (
                <div key={p.id} className="p-4 bg-white border border-zinc-200 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm">
                  <div className="flex gap-3">
                    <img src={p.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover bg-zinc-100" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 line-clamp-1">{p.name}</h4>
                      <span className="text-sm font-black text-zinc-900">{settings.currencySymbol}{p.price}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/20"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: SETTINGS & PROFILE UPDATE */}
      {activeSubTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PROFILE FORM */}
          <div className="bg-white border border-zinc-200 p-6 rounded-3xl space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" /> Update Account Profile
            </h3>

            {savedMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium focus:bg-white focus:border-orange-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium focus:bg-white focus:border-orange-600 focus:outline-none"
                />
              </div>

              {/* Profile Picture Upload Section */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Change Profile Picture
                </label>
                
                {/* Hidden File Input for Phone Gallery / Computer Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Upload Notice Message */}
                {uploadNotice && (
                  <div className="p-2.5 bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-medium rounded-xl flex items-center justify-between">
                    <span>{uploadNotice}</span>
                    <button type="button" onClick={() => setUploadNotice(null)} className="text-orange-600 hover:text-orange-900">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Avatar Live Preview Card */}
                <div className="flex items-center gap-4 p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="relative shrink-0">
                    <img
                      src={profileAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                      alt="Profile Avatar"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-600 shadow-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition-all"
                      title="Upload photo from phone or desktop"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-zinc-900 block truncate">
                      {profileName || 'Your Profile Photo'}
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Choose a photo from your phone gallery, desktop drive, or Google Drive link.
                    </p>
                  </div>
                </div>

                {/* Upload Methods Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Method 1: Upload from Device/Phone Gallery */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white border border-zinc-200 hover:border-orange-600 hover:bg-zinc-50 text-zinc-800 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-orange-600" />
                    <span>Phone Gallery / Desktop Drive</span>
                  </button>

                  {/* Method 2: Import from Google Drive */}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={gdriveUrlInput}
                      onChange={(e) => setGdriveUrlInput(e.target.value)}
                      placeholder="Google Drive link..."
                      className="flex-1 px-3 py-2 text-[11px] bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleImportGDrive}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 shrink-0"
                      title="Import image from Google Drive share link"
                    >
                      <Cloud className="w-3.5 h-3.5" /> Link
                    </button>
                  </div>
                </div>

                {/* Custom URL Fallback */}
                <div className="pt-1">
                  <label className="text-[10px] font-semibold text-zinc-500 block mb-1">Direct Image Web URL</label>
                  <input
                    type="url"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/your-photo.jpg"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all flex justify-center items-center gap-2"
              >
                {isSavingProfile ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                <span>{isSavingProfile ? 'Saving...' : 'Save Account Profile'}</span>
              </button>
            </form>
          </div>

          {/* SECURITY & PASSWORD FORM */}
          <div className="bg-white border border-zinc-200 p-6 rounded-3xl space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-600" /> Password & Security
            </h3>

            {pwdMsg && (
              <div className={`p-3 text-xs font-semibold rounded-xl flex items-center gap-2 ${
                pwdMsg.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {pwdMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium focus:bg-white focus:border-orange-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-zinc-700"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Confirm New Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium focus:bg-white focus:border-orange-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all"
              >
                Update Password
              </button>
            </form>
          </div>

        </div>
      )}

      {/* VERIFIED PURCHASE REVIEW MODAL */}
      {reviewModalOpen && reviewTargetProduct && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Write Verified Review</h3>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{reviewTargetProduct.name}</p>
                </div>
              </div>
              <button onClick={() => setReviewModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSuccessMsg ? (
              <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm">Review Submitted!</h4>
                <p className="text-xs text-emerald-700">Thank you for leaving an authentic verified customer review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-zinc-800 block mb-1">Star Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-zinc-700 text-sm">{reviewRating} / 5</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-800 block mb-1">Review Headline / Summary</label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Excellent template, code is clean and structured!"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:bg-white focus:border-orange-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-800 block mb-1">Your Detailed Experience</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe how this digital product helped your workflow..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:bg-white focus:border-orange-600 focus:outline-none"
                  />
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified Purchase Badge will be attached to your review.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 transition-all text-xs"
                >
                  Post Authentic Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
