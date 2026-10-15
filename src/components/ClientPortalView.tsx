import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  EyeOff,
  History,
  KeyRound,
  LogOut,
  Mail,
  Package,
  Radio,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types/store';
import { PdfReceiptService } from '../services/pdfReceiptService';
import { StudioImage } from './StudioImage';

const PROGRESS_STEPS: Array<{
  status: OrderStatus;
  label: string;
  shortLabel: string;
}> = [
  {
    status: 'Processing',
    label: 'Order Confirmed',
    shortLabel: 'Confirmed',
  },
  {
    status: 'Packed & Verified',
    label: 'Serial Verified & Packed',
    shortLabel: 'Packed',
  },
  {
    status: 'Dispatched',
    label: 'In Transit / Dispatched',
    shortLabel: 'Dispatched',
  },
  {
    status: 'Delivered',
    label: 'Delivered',
    shortLabel: 'Delivered',
  },
];

function getStepIndex(status: OrderStatus): number {
  if (status === 'Processing') return 0;
  if (status === 'Packed & Verified') return 1;
  if (status === 'Dispatched') return 2;
  if (status === 'Delivered') return 3;
  return -1; // Cancelled
}

const GoogleMarkSvg: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

/**
 * Real-Time Delivery Tracking Status Indicator Component
 * Updates live when the Admin Dashboard / Firestore backend changes order delivery or M-Pesa status
 */
const RealTimeTrackingIndicator: React.FC<{ order: Order }> = ({ order }) => {
  const stepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'Cancelled';
  const isDelivered = order.status === 'Delivered';
  const progressPercent = isCancelled
    ? 0
    : stepIdx === 0
    ? 25
    : stepIdx === 1
    ? 50
    : stepIdx === 2
    ? 75
    : 100;

  return (
    <div className="bg-[#F4F3EF] border border-[#141413]/12 p-3.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isCancelled
                ? 'bg-[#D94E34]'
                : isDelivered
                ? 'bg-[#1F6F43]'
                : 'bg-[#1F6F43] animate-pulse'
            }`}
          />
          <span className="text-[10px] font-mono-num uppercase tracking-[0.16em] text-[#6E6D68] flex items-center gap-1">
            <Radio className="w-3 h-3 text-[#1F6F43]" />
            <span>LIVE TRACKING INDICATOR</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-mono-num font-bold uppercase ${
              isCancelled
                ? 'text-[#D94E34]'
                : isDelivered
                ? 'text-[#1F6F43]'
                : 'text-[#141413]'
            }`}
          >
            {order.status} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Animated Progress Bar */}
      {!isCancelled && (
        <div className="space-y-1.5">
          <div className="w-full h-1.5 bg-[#EAE9E4] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-[#1F6F43]"
            />
          </div>

          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono-num uppercase">
            {PROGRESS_STEPS.map((s, idx) => {
              const active = idx <= stepIdx;
              const current = idx === stepIdx;
              return (
                <div
                  key={s.status}
                  className={`${
                    idx === 3
                      ? 'text-right'
                      : idx === 1 || idx === 2
                      ? 'text-center'
                      : 'text-left'
                  } ${
                    current
                      ? 'text-[#141413] font-bold'
                      : active
                      ? 'text-[#1F6F43] font-medium'
                      : 'text-[#8E8D87]'
                  }`}
                >
                  {active ? '● ' : '○ '}
                  {s.shortLabel}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Backend Tracking Note & Last Synced Timestamp */}
      {(order.trackingNote || order.updatedAt) && (
        <div className="pt-1.5 border-t border-[#141413]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#5E5D59]">
          <span className="truncate">
            {order.trackingNote ||
              'Connected to Tech Sokoni Dispatch — status updates appear automatically.'}
          </span>
          {order.updatedAt && (
            <span className="text-[10px] font-mono-num text-[#6E6D68] shrink-0">
              Synced{' '}
              {new Date(order.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const ClientPortalView: React.FC = () => {
  const {
    currentClient,
    orders,
    settings,
    route,
    loginClient,
    registerClient,
    loginWithGoogle,
    logoutClient,
    updateClientProfile,
    cancelClientOrder,
    submitMpesaConfirmation,
    resetPassword,
    verifyResetCode,
    confirmNewPassword,
    passwordResetCode,
    clearPasswordResetCode,
    addToCart,
    navigate,
  } = useStore();

  const [authMode, setAuthMode] = useState<
    'login' | 'signup' | 'forgot-password' | 'reset-password'
  >('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [authError, setAuthError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Dedicated Password Reset States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [codeError, setCodeError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [showManualCodeInput, setShowManualCodeInput] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  // Automatically switch to reset-password view if an email reset link (oobCode) is present
  useEffect(() => {
    if (passwordResetCode) {
      setAuthMode('reset-password');
      setIsVerifyingCode(true);
      setCodeError('');
      setAuthError('');
      verifyResetCode(passwordResetCode).then((res) => {
        setIsVerifyingCode(false);
        if (res.ok && res.email) {
          setVerifiedEmail(res.email);
          setEmail(res.email);
        } else {
          setCodeError(
            res.error ||
              'This password reset link is invalid or has already expired.'
          );
        }
      });
    }
  }, [passwordResetCode]);

  // Portal view tabs: 'orders' (Live Progress), 'history' (Past Order History), 'profile' (Delivery Profile)
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'profile'>(
    route.page === 'client-portal' && route.tab ? route.tab : 'history'
  );

  // Inline M-Pesa confirmation input per order
  const [mpesaDrafts, setMpesaDrafts] = useState<Record<string, string>>({});

  // Sync activeTab if route specifies a tab
  useEffect(() => {
    if (route.page === 'client-portal' && route.tab) {
      setActiveTab(route.tab);
    }
  }, [route]);

  // Order History Filter States
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<
    'all' | 'M-Pesa Express' | 'Payment on Delivery'
  >('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<
    'all' | OrderStatus
  >('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await loginClient(email, password);
      if (!res.ok) {
        setAuthError(
          res.error ||
            'Invalid email or password. Please verify your credentials or create an account.'
        );
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('Please complete all required fields.');
      return;
    }
    if (password.trim().length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setIsSubmittingAuth(true);
    try {
      const res = await registerClient({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+254 700 000 000',
        password: password.trim(),
        defaultAddress: address.trim() || 'Nairobi CBD',
        city: city.trim() || 'Nairobi',
      });
      if (!res.ok && res.error) {
        setAuthError(res.error);
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await loginWithGoogle();
      if (!res.ok && res.error) {
        setAuthError(res.error);
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setAuthError('Please enter your client email to receive a password reset link.');
      setResetSuccess('');
      return;
    }
    setAuthError('');
    setResetSuccess('');
    setIsSubmittingAuth(true);
    try {
      const res = await resetPassword(cleanEmail);
      if (!res.ok) {
        setAuthError(res.error || 'Failed to send password reset email.');
      } else {
        setResetSuccess(
          `Password reset link dispatched to ${cleanEmail}. Please check your inbox and click the link inside to set your new password.`
        );
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const codeToUse = passwordResetCode || manualCode.trim();
    if (!codeToUse) {
      setAuthError('No reset security code detected. Please request a new password reset email or paste your code below.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setAuthError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const res = await confirmNewPassword(codeToUse, newPassword);
      if (res.ok) {
        setResetCompleted(true);
      } else {
        setAuthError(
          res.error ||
            'Failed to reset password. The link may have expired or already been used. Please request a new link.'
        );
      }
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Orders belonging to this client
  const displayedOrders = useMemo(() => {
    if (!currentClient) return orders;
    const clientPhoneTail = currentClient.phone.replace(/\D/g, '').slice(-8);
    const clientOrders = orders.filter((o) => {
      const orderPhoneTail = o.customerPhone.replace(/\D/g, '').slice(-8);
      return (
        o.clientId === currentClient.id ||
        o.customerEmail.toLowerCase() === currentClient.email.toLowerCase() ||
        (clientPhoneTail.length >= 7 && orderPhoneTail === clientPhoneTail)
      );
    });
    return clientOrders.length > 0 ? clientOrders : orders;
  }, [orders, currentClient]);

  // Filtered orders for the Order History tab
  const filteredHistoryOrders = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    return displayedOrders.filter((order) => {
      if (
        historyPaymentFilter !== 'all' &&
        order.paymentMethod !== historyPaymentFilter
      ) {
        return false;
      }
      if (
        historyStatusFilter !== 'all' &&
        order.status !== historyStatusFilter
      ) {
        return false;
      }
      if (q) {
        const productNames = order.items
          .map((i) => `${i.productName} ${i.brand} ${i.sku}`)
          .join(' ')
          .toLowerCase();
        const haystack = `${order.orderNumber} ${order.paymentMethod} ${order.mpesaCode || ''} ${order.status} ${order.city} ${order.shippingAddress} ${productNames}`.toLowerCase();
        return haystack.includes(q);
      }
      return true;
    });
  }, [
    displayedOrders,
    historyPaymentFilter,
    historyStatusFilter,
    historySearchQuery,
  ]);

  // 9 items per page for client order history
  const [historyOrdersPage, setHistoryOrdersPage] = useState<number>(1);
  const CLIENT_ORDERS_PAGE_SIZE = 9;

  useEffect(() => {
    setHistoryOrdersPage(1);
  }, [historyPaymentFilter, historyStatusFilter, historySearchQuery]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(filteredHistoryOrders.length / CLIENT_ORDERS_PAGE_SIZE)
  );
  const safeHistoryPage = Math.min(
    Math.max(1, historyOrdersPage),
    historyTotalPages
  );
  const paginatedHistoryOrders = filteredHistoryOrders.slice(
    (safeHistoryPage - 1) * CLIENT_ORDERS_PAGE_SIZE,
    safeHistoryPage * CLIENT_ORDERS_PAGE_SIZE
  );

  // Summary metrics for Order History
  const historyStats = useMemo(() => {
    const mpesaOrders = displayedOrders.filter(
      (o) => o.paymentMethod === 'M-Pesa Express'
    );
    const podOrders = displayedOrders.filter(
      (o) => o.paymentMethod === 'Payment on Delivery'
    );
    const deliveredOrders = displayedOrders.filter(
      (o) => o.status === 'Delivered'
    );
    return {
      totalCount: displayedOrders.length,
      mpesaCount: mpesaOrders.length,
      mpesaTotal: mpesaOrders.reduce((sum, o) => sum + o.total, 0),
      podCount: podOrders.length,
      podTotal: podOrders.reduce((sum, o) => sum + o.total, 0),
      deliveredCount: deliveredOrders.length,
    };
  }, [displayedOrders]);

  const handleSendMpesaForOrder = (orderId: string) => {
    const raw = (mpesaDrafts[orderId] || '').trim();
    if (!raw) return;
    const match = raw.match(/\b([A-Z0-9]{10})\b/i);
    const code = match ? match[1].toUpperCase() : raw.slice(0, 14).toUpperCase();
    submitMpesaConfirmation(orderId, code, raw);
    setMpesaDrafts((prev) => ({ ...prev, [orderId]: '' }));
  };

  if (!currentClient) {
    return (
      <div className="min-h-[82vh] showroom-canvas flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F4F3EF] border border-[#141413]/15 max-w-md w-full p-6 sm:p-10 shadow-xl"
        >
          <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68] text-center">
            TECH SOKONI KENYA · CLIENT PORTAL
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413] text-center mt-1">
            {authMode === 'login'
              ? 'Client Sign In'
              : authMode === 'signup'
              ? 'Create Client Account'
              : authMode === 'forgot-password'
              ? 'Reset Account Password'
              : 'Choose New Password'}
          </h1>
          <p className="text-xs text-[#6E6D68] text-center mt-1.5">
            {authMode === 'forgot-password'
              ? "We'll send a secure password reset link to your registered email address."
              : authMode === 'reset-password'
              ? 'Enter and confirm your new secure password to access your account.'
              : 'Track real-time delivery status, M-Pesa payment confirmations, and download official PDF receipts.'}
          </p>

          {/* Mode Switcher (Visible on Login & Sign Up) */}
          {(authMode === 'login' || authMode === 'signup') && (
            <>
              <div className="grid grid-cols-2 border border-[#141413]/15 mt-6 text-xs font-mono-num uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setResetSuccess('');
                  }}
                  className={`py-2.5 cursor-pointer transition-colors ${
                    authMode === 'login'
                      ? 'bg-[#141413] text-[#F4F3EF]'
                      : 'text-[#6E6D68] hover:text-[#141413]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                    setResetSuccess('');
                  }}
                  className={`py-2.5 cursor-pointer transition-colors ${
                    authMode === 'signup'
                      ? 'bg-[#141413] text-[#F4F3EF]'
                      : 'text-[#6E6D68] hover:text-[#141413]'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Google Sign-In Button */}
              <div className="mt-5">
                <button
                  type="button"
                  disabled={isSubmittingAuth}
                  onClick={handleGoogleAuth}
                  className="w-full py-3 px-4 bg-white hover:bg-[#EAE9E4]/80 border border-[#141413]/20 text-[#141413] text-xs font-mono-num uppercase tracking-wider flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <GoogleMarkSvg className="w-4 h-4 shrink-0" />
                  <span>
                    {authMode === 'login'
                      ? 'Sign In with Google'
                      : 'Sign Up with Google'}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="border-t border-[#141413]/12 w-full" />
                <span className="bg-[#F4F3EF] px-3 text-[10px] font-mono-num uppercase tracking-widest text-[#6E6D68] shrink-0">
                  Or with Email
                </span>
                <div className="border-t border-[#141413]/12 w-full" />
              </div>
            </>
          )}

          {authError && (
            <div className="mb-4 p-3 bg-[#D94E34]/10 border border-[#D94E34]/30 text-xs text-[#D94E34]">
              {authError}
            </div>
          )}

          {resetSuccess && authMode !== 'reset-password' && (
            <div className="mb-4 p-3.5 bg-[#1F6F43]/10 border border-[#1F6F43]/30 text-xs text-[#1F6F43] space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
              <p className="text-[11px] text-[#5E5D59] leading-relaxed">
                Deliverability note: If the message does not appear in your primary inbox, please check your Spam, Junk, or Updates folder, and mark <span className="font-mono text-[#141413]">shop@techsokoni.com</span> as a safe sender.
              </p>
            </div>
          )}

          {/* VIEW 1: SIGN IN */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                  Client Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot-password');
                      setAuthError('');
                      setResetSuccess('');
                    }}
                    className="text-[10px] font-mono-num text-[#6E6D68] hover:text-[#141413] underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmittingAuth ? 'Signing In...' : 'Access Client Area'}
              </button>
            </form>
          )}

          {/* VIEW 2: SIGN UP */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nadia Mutua"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nadia@company.co.ke"
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    M-Pesa / Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0792 620 789"
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    Default Delivery Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Building / Street"
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    Town / County
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                  Create Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer mt-2 disabled:opacity-60"
              >
                {isSubmittingAuth
                  ? 'Creating Account...'
                  : 'Create Account & Enter Portal'}
              </button>
            </form>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {authMode === 'forgot-password' && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setResetSuccess('');
                  }}
                  className="text-xs font-mono-num uppercase tracking-wider text-[#6E6D68] hover:text-[#141413] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>

              <div className="border border-[#141413]/15 bg-[#EAE9E4]/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#141413]" />
                  <h3 className="font-semibold text-xs text-[#141413] uppercase tracking-wider">
                    Secure Password Reset
                  </h3>
                </div>
                <p className="text-xs text-[#5E5D59] leading-relaxed">
                  Enter the email address tied to your account. We will send you an email with a secure link so you can create a new password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                    Registered Client Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 pl-3.5 pr-10 py-2.5 text-xs text-[#141413]"
                    />
                    <Mail className="w-4 h-4 text-[#6E6D68] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingAuth ? 'Sending Reset Email...' : 'Send Password Reset Link'}</span>
                </button>
              </form>

              <div className="pt-2 text-center border-t border-[#141413]/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualCodeInput((prev) => !prev);
                    setAuthError('');
                  }}
                  className="text-[11px] font-mono-num text-[#6E6D68] hover:text-[#141413] underline cursor-pointer"
                >
                  Already received your reset link or code? Click here to change password
                </button>
              </div>

              {showManualCodeInput && (
                <div className="p-3 bg-[#EAE9E4]/60 border border-[#141413]/15 space-y-2">
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                    Paste Reset Code or Full Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('oobCode=')) {
                          try {
                            const urlObj = new URL(val);
                            const c = urlObj.searchParams.get('oobCode');
                            setManualCode(c || val);
                            return;
                          } catch {
                            // ignore
                          }
                        }
                        setManualCode(val);
                      }}
                      placeholder="Paste oobCode or link from email"
                      className="flex-1 bg-[#F4F3EF] border border-[#141413]/20 px-2.5 py-1.5 text-xs font-mono-num"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!manualCode.trim()) return;
                        setAuthMode('reset-password');
                        setIsVerifyingCode(true);
                        verifyResetCode(manualCode.trim()).then((res) => {
                          setIsVerifyingCode(false);
                          if (res.ok && res.email) {
                            setVerifiedEmail(res.email);
                            setEmail(res.email);
                          } else {
                            setCodeError(res.error || 'Invalid reset code.');
                          }
                        });
                      }}
                      className="px-3 py-1.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: RESET PASSWORD USING LINK / CODE */}
          {authMode === 'reset-password' && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    clearPasswordResetCode();
                    setAuthMode('login');
                    setAuthError('');
                    setResetCompleted(false);
                  }}
                  className="text-xs font-mono-num uppercase tracking-wider text-[#6E6D68] hover:text-[#141413] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>

                {passwordResetCode && (
                  <span className="text-[10px] font-mono-num text-[#1F6F43] bg-[#1F6F43]/10 px-2 py-0.5 border border-[#1F6F43]/20">
                    Email Link Active
                  </span>
                )}
              </div>

              {resetCompleted ? (
                <div className="p-6 bg-[#1F6F43]/10 border border-[#1F6F43]/30 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#1F6F43] mx-auto" />
                  <h3 className="font-editorial text-2xl text-[#141413]">Password Reset Complete!</h3>
                  <p className="text-xs text-[#5E5D59] leading-relaxed max-w-sm mx-auto">
                    Your Tech Sokoni password has been updated successfully. You can now log into your client portal with your new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearPasswordResetCode();
                      setAuthMode('login');
                      setPassword('');
                      setAuthError('');
                      setResetSuccess('Password reset successfully. Please sign in below.');
                    }}
                    className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] cursor-pointer mt-3"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              ) : isVerifyingCode ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-7 h-7 border-2 border-[#141413] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono-num uppercase tracking-wider text-[#6E6D68]">
                    Verifying security link from email...
                  </p>
                </div>
              ) : codeError ? (
                <div className="p-5 bg-[#D94E34]/10 border border-[#D94E34]/30 space-y-3 text-left">
                  <p className="text-xs font-semibold text-[#D94E34]">{codeError}</p>
                  <p className="text-[11px] text-[#5E5D59] leading-relaxed">
                    Security links expire after a short period or once used. Please request a fresh reset email to create a new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearPasswordResetCode();
                      setAuthMode('forgot-password');
                      setAuthError('');
                      setCodeError('');
                    }}
                    className="w-full py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider cursor-pointer"
                  >
                    Request New Reset Link
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div className="p-3.5 bg-[#EAE9E4]/60 border border-[#141413]/12 space-y-1">
                    <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                      Account Being Reset
                    </p>
                    <p className="text-xs font-semibold text-[#141413] font-mono">
                      {verifiedEmail || email || 'Registered Client Account'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                      New Password * (Min 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 pl-3.5 pr-10 py-2.5 text-xs text-[#141413]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6D68] hover:text-[#141413] cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 pl-3.5 pr-10 py-2.5 text-xs text-[#141413]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6D68] hover:text-[#141413] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSubmittingReset ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-20">
      {/* Top Client Banner */}
      <div className="showroom-canvas border-b border-[#141413]/12 py-8 sm:py-10 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentClient.photoURL && (
              <img
                src={currentClient.photoURL}
                alt={currentClient.name}
                className="w-12 h-12 rounded-full border border-[#141413]/20 object-cover shrink-0"
              />
            )}
            <div>
              <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68]">
                TECH SOKONI KENYA · CLIENT PORTAL
              </p>
              <h1 className="font-editorial text-3xl sm:text-5xl text-[#141413] mt-1">
                Welcome, {currentClient.name}
              </h1>
              <p className="text-xs font-mono-num text-[#5E5D59] mt-1">
                {currentClient.email} · {currentClient.phone} ·{' '}
                {currentClient.defaultAddress}, {currentClient.city}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate({ page: 'category', categoryId: 'all' })}
              className="px-4 py-2 border border-[#141413]/25 text-xs font-mono-num uppercase tracking-wider text-[#141413] hover:border-[#141413] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Shop Hardware</span>
            </button>
            <button
              onClick={logoutClient}
              className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Portal Navigation Tabs */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-8">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 border-b border-[#141413]/10 pb-4">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>
              Order History & Real-Time Tracking ({displayedOrders.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Detailed Receipts ({displayedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Delivery Profile</span>
          </button>
        </div>

        {/* =====================================================================
            VIEW 1: ORDER HISTORY & REAL-TIME DELIVERY / M-PESA TRACKING
           ===================================================================== */}
        {activeTab === 'history' && (
          <div className="py-8 space-y-8">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#1F6F43] font-semibold">
                  LIVE BACKEND SYNC · M-PESA TILL 9309020 & COURIER TRACKING
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl text-[#141413] mt-1">
                  Order History & Real-Time Delivery Status
                </h2>
                <p className="text-xs text-[#5E5D59] mt-1">
                  Track your orders in real time as the Tech Sokoni Admin
                  verifies M-Pesa payments and updates dispatch progress.
                </p>
              </div>
            </div>

            {/* Transaction Summary Strip in KSh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4">
                <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                  Total Orders
                </p>
                <p className="font-editorial text-3xl text-[#141413] mt-1">
                  {historyStats.totalCount} Orders
                </p>
                <p className="text-[11px] font-mono-num text-[#5E5D59] mt-1">
                  {historyStats.deliveredCount} Delivered · Live Synced
                </p>
              </div>

              <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#1F6F43]">
                    M-Pesa Express (Till 9309020)
                  </p>
                  <Smartphone className="w-3.5 h-3.5 text-[#1F6F43]" />
                </div>
                <p className="font-editorial text-3xl text-[#141413] mt-1">
                  {settings.currencySymbol}
                  {historyStats.mpesaTotal.toLocaleString()}
                </p>
                <p className="text-[11px] font-mono-num text-[#5E5D59] mt-1">
                  {historyStats.mpesaCount} M-Pesa Transactions
                </p>
              </div>

              <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#141413]">
                    Payment on Delivery
                  </p>
                  <Truck className="w-3.5 h-3.5 text-[#141413]" />
                </div>
                <p className="font-editorial text-3xl text-[#141413] mt-1">
                  {settings.currencySymbol}
                  {historyStats.podTotal.toLocaleString()}
                </p>
                <p className="text-[11px] font-mono-num text-[#5E5D59] mt-1">
                  {historyStats.podCount} Pay-on-Delivery Orders
                </p>
              </div>

              <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4">
                <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                  Showroom Support
                </p>
                <p className="text-sm font-mono-num font-semibold text-[#141413] mt-2">
                  {settings.supportPhone}
                </p>
                <p className="text-[11px] text-[#5E5D59] mt-1 truncate">
                  Kenyatta Pioneer Bldg, 5th Flr, Shop 514
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#EAE9E4]/45 border border-[#141413]/12 p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-5">
                  <span className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Transaction Type
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'All Transactions' },
                        { id: 'M-Pesa Express', label: 'M-Pesa Express' },
                        {
                          id: 'Payment on Delivery',
                          label: 'Payment on Delivery',
                        },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setHistoryPaymentFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-mono-num transition-colors cursor-pointer border ${
                          historyPaymentFilter === tab.id
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                            : 'bg-[#F4F3EF] text-[#5E5D59] border-[#141413]/15 hover:text-[#141413]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <span className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Delivery Status
                  </span>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) =>
                      setHistoryStatusFilter(
                        e.target.value as 'all' | OrderStatus
                      )
                    }
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-3 py-1.5 text-xs font-mono-num text-[#141413] focus:outline-none"
                  >
                    <option value="all">All Delivery Statuses</option>
                    <option value="Processing">Processing</option>
                    <option value="Packed & Verified">Packed & Verified</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <span className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Search Product / Order / M-Pesa Code
                  </span>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#6E6D68] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="e.g. MacBook, TS-2026..."
                      className="w-full bg-[#F4F3EF] border border-[#141413]/15 pl-8 pr-3 py-1.5 text-xs text-[#141413] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order History Cards with Real-Time Tracking Indicator */}
            {filteredHistoryOrders.length > 0 ? (
              <>
                <div className="space-y-5">
                  {paginatedHistoryOrders.map((order) => {
                  const formattedDate = new Date(
                    order.createdAt
                  ).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                  });
                  const formattedTime = new Date(
                    order.createdAt
                  ).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isMpesa = order.paymentMethod === 'M-Pesa Express';
                  const mpesaVerified =
                    order.mpesaStatus === 'Verified & Paid';

                  return (
                    <div
                      key={order.id}
                      className="bg-[#EAE9E4]/55 border border-[#141413]/12 p-4 sm:p-6 space-y-4"
                    >
                      {/* Top Row: Order #, Date, M-Pesa Status Badge, Total in KSh & Actions */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#141413]/10">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-sm font-mono-num font-bold text-[#141413]">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs font-mono-num text-[#6E6D68] flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {formattedDate} · {formattedTime}
                              </span>
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono-num uppercase tracking-wider font-semibold ${
                                isMpesa
                                  ? mpesaVerified
                                    ? 'bg-[#1F6F43] text-[#F4F3EF]'
                                    : 'bg-[#D94E34]/15 text-[#D94E34]'
                                  : 'bg-[#141413] text-[#F4F3EF]'
                              }`}
                            >
                              {isMpesa
                                ? mpesaVerified
                                  ? `M-Pesa Verified (${order.mpesaCode || 'Till 9309020'})`
                                  : `M-Pesa: ${order.mpesaStatus || 'Pending Verification'}`
                                : 'Payment on Delivery'}
                            </span>
                          </div>
                          <p className="text-xs text-[#5E5D59]">
                            Deliver to: {order.shippingAddress}, {order.city} ·{' '}
                            {order.customerPhone}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-left lg:text-right mr-2">
                            <p className="text-[10px] font-mono-num uppercase text-[#6E6D68]">
                              Order Total
                            </p>
                            <p className="text-base font-mono-num font-bold text-[#141413]">
                              {settings.currencySymbol}
                              {order.total.toLocaleString()}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              PdfReceiptService.generateAndDownloadReceipt(
                                order,
                                settings
                              )
                            }
                            className="px-3 py-2 bg-[#141413] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF Receipt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              order.items.forEach((item) =>
                                addToCart(
                                  item.productId,
                                  item.quantity,
                                  true,
                                  item.selectedVariations
                                )
                              );
                            }}
                            className="px-3 py-2 border border-[#141413]/25 text-[#141413] text-[11px] font-mono-num uppercase tracking-wider hover:border-[#141413] flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reorder</span>
                          </button>
                        </div>
                      </div>

                      {/* REAL-TIME DELIVERY TRACKING STATUS INDICATOR */}
                      <RealTimeTrackingIndicator order={order} />

                      {/* If M-Pesa payment is still Pending Verification, allow client to submit/update M-Pesa SMS or Code */}
                      {isMpesa && !mpesaVerified && (
                        <div className="p-3 bg-[#1F6F43]/10 border border-[#1F6F43]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-[#141413]">
                            <span className="font-mono-num font-semibold text-[#1F6F43]">
                              Lipa Na M-Pesa Till 9309020:
                            </span>{' '}
                            {order.mpesaCode
                              ? `Submitted Code: ${order.mpesaCode} (Awaiting Admin confirmation)`
                              : 'Paste your M-Pesa confirmation code or SMS to notify Admin:'}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={mpesaDrafts[order.id] || ''}
                              onChange={(e) =>
                                setMpesaDrafts((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              placeholder="Paste M-Pesa code or SMS..."
                              className="bg-[#F4F3EF] border border-[#141413]/20 px-3 py-1.5 text-xs font-mono-num text-[#141413]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendMpesaForOrder(order.id)}
                              className="px-3 py-1.5 bg-[#1F6F43] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Ordered Products List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-[#F4F3EF] border border-[#141413]/10 p-3"
                          >
                            <div className="w-12 h-12 bg-[#EAE9E4] p-1 shrink-0 flex items-center justify-center">
                              <StudioImage
                                src={item.image}
                                alt={item.productName}
                                containerClassName="w-full h-full"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#141413] truncate">
                                {item.productName}
                              </p>
                              <p className="text-[10px] font-mono-num text-[#6E6D68] truncate">
                                {item.brand} · {item.sku} · Qty {item.quantity}{' '}
                                × {settings.currencySymbol}
                                {item.unitPrice.toLocaleString()}
                              </p>
                              {item.selectedVariations &&
                                Object.keys(item.selectedVariations).length >
                                  0 && (
                                  <p className="text-[10px] font-mono-num text-[#5E5D59] truncate">
                                    {Object.entries(item.selectedVariations)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(' · ')}
                                  </p>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls for Client Order History (when > 9 orders) */}
              {filteredHistoryOrders.length > CLIENT_ORDERS_PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 font-mono-num text-xs border-t border-[#141413]/10">
                  <div className="text-[#6E6D68]">
                    Showing {(safeHistoryPage - 1) * CLIENT_ORDERS_PAGE_SIZE + 1}–
                    {Math.min(safeHistoryPage * CLIENT_ORDERS_PAGE_SIZE, filteredHistoryOrders.length)} of{' '}
                    {filteredHistoryOrders.length} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryOrdersPage((p) => Math.max(1, p - 1))}
                      disabled={safeHistoryPage === 1}
                      className="px-3 py-1.5 border border-[#141413]/20 bg-[#F4F3EF] text-[#141413] uppercase tracking-wider flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#141413] cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((pn) => (
                        <button
                          key={pn}
                          type="button"
                          onClick={() => setHistoryOrdersPage(pn)}
                          className={`w-8 h-8 flex items-center justify-center border text-xs font-mono-num transition-colors cursor-pointer ${
                            safeHistoryPage === pn
                              ? 'bg-[#141413] text-[#F4F3EF] border-[#141413] font-semibold'
                              : 'border-[#141413]/20 bg-transparent text-[#5E5D59] hover:border-[#141413]'
                          }`}
                        >
                          {pn}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setHistoryOrdersPage((p) => Math.min(historyTotalPages, p + 1))}
                      disabled={safeHistoryPage === historyTotalPages}
                      className="px-3 py-1.5 border border-[#141413]/20 bg-[#F4F3EF] text-[#141413] uppercase tracking-wider flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#141413] cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
              <div className="p-10 text-center bg-[#EAE9E4]/40 border border-[#141413]/12 space-y-3">
                <p className="text-sm font-medium text-[#141413]">
                  {displayedOrders.length === 0
                    ? 'You have not placed any hardware orders yet.'
                    : 'No orders matched your selected filter criteria.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (displayedOrders.length === 0) {
                      navigate({ page: 'category', categoryId: 'all' });
                    } else {
                      setHistoryPaymentFilter('all');
                      setHistoryStatusFilter('all');
                      setHistorySearchQuery('');
                    }
                  }}
                  className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider cursor-pointer"
                >
                  {displayedOrders.length === 0
                    ? 'Browse Hardware Catalog'
                    : 'Show All Orders'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 2: DETAILED RECEIPTS & STAGE BREAKDOWN
           ===================================================================== */}
        {activeTab === 'orders' && (
          <div className="py-8 space-y-6">
            {displayedOrders.length > 0 ? (
              displayedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#EAE9E4]/55 border border-[#141413]/12 p-5 sm:p-8 space-y-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#141413]/10">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-num">
                        <span className="font-semibold text-sm text-[#141413]">
                          {order.orderNumber}
                        </span>
                        <span>·</span>
                        <span className="text-[#6E6D68]">
                          Placed{' '}
                          {new Date(order.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                            }
                          )}
                        </span>
                        <span>·</span>
                        <span className="text-[#141413]">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-[#5E5D59] mt-1">
                        Destination: {order.shippingAddress}, {order.city}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() =>
                          PdfReceiptService.generateAndDownloadReceipt(
                            order,
                            settings
                          )
                        }
                        className="px-4 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF Receipt</span>
                      </button>

                      {order.status === 'Processing' && (
                        <button
                          onClick={() => cancelClientOrder(order.id)}
                          className="px-3.5 py-2.5 border border-[#D94E34]/40 text-[#D94E34] text-xs font-mono-num uppercase tracking-wider hover:bg-[#D94E34] hover:text-[#F4F3EF] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <RealTimeTrackingIndicator order={order} />

                  <div className="pt-2 border-t border-[#141413]/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-num">
                    <div className="flex items-center gap-2 text-[#1F6F43]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        Official Tech Sokoni Serial & Warranty Registered
                      </span>
                    </div>
                    <span className="text-base font-semibold text-[#141413]">
                      Total: {settings.currencySymbol}
                      {order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center bg-[#EAE9E4]/40 border border-[#141413]/12">
                <p className="text-sm text-[#141413]">
                  No orders found for your account yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 3: DELIVERY & CONTACT PROFILE
           ===================================================================== */}
        {activeTab === 'profile' && (
          <div className="py-8 max-w-xl space-y-4">
            <h2 className="font-editorial text-3xl text-[#141413]">
              Delivery & Contact Preferences
            </h2>
            <p className="text-xs text-[#6E6D68]">
              Your delivery preferences are automatically synced with your Tech
              Sokoni Firestore profile for express checkout.
            </p>
            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={currentClient.name}
                onChange={(e) => updateClientProfile({ name: e.target.value })}
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                M-Pesa / Contact Phone
              </label>
              <input
                type="text"
                value={currentClient.phone}
                onChange={(e) => updateClientProfile({ phone: e.target.value })}
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                Default Delivery Street / Building
              </label>
              <input
                type="text"
                value={currentClient.defaultAddress}
                onChange={(e) =>
                  updateClientProfile({ defaultAddress: e.target.value })
                }
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-num uppercase text-[#6E6D68] mb-1">
                Town / County
              </label>
              <input
                type="text"
                value={currentClient.city}
                onChange={(e) => updateClientProfile({ city: e.target.value })}
                className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
