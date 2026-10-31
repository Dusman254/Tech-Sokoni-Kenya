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
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, WarrantyRegistration, CategoryId } from '../types/store';
import { PdfReceiptService } from '../services/pdfReceiptService';
import { StudioImage } from './StudioImage';
import { TrackShipmentView } from './TrackShipmentView';

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
    products,
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
    sendOtpResetCode,
    verifyOtpResetCode,
    completeOtpPasswordReset,
    sendMfaCode,
    verifyMfaCode,
    toggleClientMfa,
    addToCart,
    navigate,
    warrantyRegistrations,
    registerWarranty,
    getWarrantyBySerial,
    showToast,
    categories,
    openBookViewingModal,
    viewingAppointments,
    isAdminAuthenticated,
  } = useStore();

  const [authMode, setAuthMode] = useState<
    'login' | 'signup' | 'forgot-password' | 'reset-password' | 'mfa-challenge'
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

  // 3-Step Email OTP Password Reset States (Strict Requirement: 6-digit code, NO link)
  const [otpStep, setOtpStep] = useState<
    'enter-email' | 'enter-code' | 'enter-password' | 'completed'
  >('enter-email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Two-Step Verification (MFA) States
  const [mfaEmail, setMfaEmail] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaCooldown, setMfaCooldown] = useState(0);

  // Password Input Toggles
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cooldown timers
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (mfaCooldown <= 0) return;
    const timer = setInterval(() => setMfaCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [mfaCooldown]);

  // If an external reset code is detected in query params, route to OTP forgot-password view
  useEffect(() => {
    if (passwordResetCode) {
      setAuthMode('forgot-password');
      setOtpStep('enter-email');
      clearPasswordResetCode();
    }
  }, [passwordResetCode, clearPasswordResetCode]);

  // Portal view tabs: 'history' | 'orders' | 'profile' | 'track' | 'warranty'
  // Portal view tabs: 'history' | 'orders' | 'warranty' | 'bookings' | 'profile' | 'track'
  const [activeTab, setActiveTab] = useState<
    'orders' | 'history' | 'profile' | 'track' | 'warranty' | 'bookings'
  >(route.page === 'client-portal' && route.tab ? (route.tab as any) : 'history');

  // Dedicated Warranty Registration & Serial Tracking State
  const [regSerial, setRegSerial] = useState('');
  const [regModel, setRegModel] = useState('');
  const [regCategory, setRegCategory] = useState<CategoryId>('laptops');
  const [regPurchaseDate, setRegPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [regOrderNumber, setRegOrderNumber] = useState('');
  const [regNotes, setRegNotes] = useState('');
  const [isSubmittingWarranty, setIsSubmittingWarranty] = useState(false);
  const [warrantyFilterStatus, setWarrantyFilterStatus] = useState<'all' | 'active' | 'expiring-soon' | 'expired'>('all');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<WarrantyRegistration | null | 'not_found'>(null);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

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
      if (res.requiresMfa) {
        setMfaEmail(email.trim().toLowerCase());
        setMfaCode('');
        setAuthMode('mfa-challenge');
        setMfaCooldown(60);
        showToast('Two-step verification code sent to your email.');
        return;
      }
      if (!res.ok) {
        setAuthError(
          res.error ||
            'Invalid email or password. Please verify your credentials or click "Forgot Password?".'
        );
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = mfaCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setAuthError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await verifyMfaCode(mfaEmail, cleanCode, 'client_login');
      if (!res.ok) {
        setAuthError(res.error || 'Invalid verification code. Please check your email and try again.');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleResendMfa = async () => {
    if (mfaCooldown > 0) return;
    setAuthError('');
    const res = await sendMfaCode(mfaEmail, 'client_login');
    if (res.ok) {
      showToast('A new 6-digit verification code has been dispatched.');
      setMfaCooldown(60);
    } else {
      setAuthError(res.error || 'Failed to resend code.');
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

  // 3-Step Email OTP Password Reset Handlers (Strictly NO link - 6-digit code flow)
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (otpEmail || email).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await sendOtpResetCode(cleanEmail);
      if (!res.ok) {
        setAuthError(res.error || 'Failed to send verification code. Please try again.');
      } else {
        setOtpEmail(cleanEmail);
        setOtpStep('enter-code');
        setOtpCooldown(60);
        showToast(`Verification code sent to ${cleanEmail}`);
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleResendResetCode = async () => {
    if (otpCooldown > 0) return;
    setAuthError('');
    const res = await sendOtpResetCode(otpEmail);
    if (res.ok) {
      showToast('A new 6-digit code has been sent to your email.');
      setOtpCooldown(60);
    } else {
      setAuthError(res.error || 'Failed to resend code.');
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setAuthError('Please enter the 6-digit code from your email.');
      return;
    }
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await verifyOtpResetCode(otpEmail, cleanCode);
      if (!res.ok || !res.resetToken) {
        setAuthError(res.error || 'Invalid or expired code. Please request a new code.');
      } else {
        setResetToken(res.resetToken);
        setOtpStep('enter-password');
        showToast('Code verified! Enter your new password.');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify.');
      return;
    }
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await completeOtpPasswordReset(otpEmail, resetToken, newPassword);
      if (!res.ok) {
        setAuthError(res.error || 'Failed to reset password. Please try again.');
      } else {
        setOtpStep('completed');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Orders strictly belonging to this client (NEVER fall back to storewide orders!)
  const displayedOrders = useMemo(() => {
    if (!currentClient) return [];
    const clientEmail = (currentClient.email || '').toLowerCase().trim();
    const clientPhoneTail = currentClient.phone ? currentClient.phone.replace(/\D/g, '').slice(-8) : '';
    return orders.filter((o) => {
      const orderEmail = (o.customerEmail || '').toLowerCase().trim();
      const orderPhoneTail = o.customerPhone ? o.customerPhone.replace(/\D/g, '').slice(-8) : '';
      return (
        o.clientId === currentClient.id ||
        (Boolean(clientEmail) && Boolean(orderEmail) && orderEmail === clientEmail) ||
        (clientPhoneTail.length >= 7 && orderPhoneTail === clientPhoneTail)
      );
    });
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

  // 9 items per page for receipts view
  const [receiptsOrdersPage, setReceiptsOrdersPage] = useState<number>(1);
  const receiptsTotalPages = Math.max(
    1,
    Math.ceil(displayedOrders.length / CLIENT_ORDERS_PAGE_SIZE)
  );
  const safeReceiptsPage = Math.min(
    Math.max(1, receiptsOrdersPage),
    receiptsTotalPages
  );
  const paginatedReceiptsOrders = displayedOrders.slice(
    (safeReceiptsPage - 1) * CLIENT_ORDERS_PAGE_SIZE,
    safeReceiptsPage * CLIENT_ORDERS_PAGE_SIZE
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

  // Client's registered warranties strictly isolated (NEVER fall back to all warranties!)
  const clientWarranties = useMemo(() => {
    if (!currentClient) return [];
    const clientEmail = (currentClient.email || '').toLowerCase().trim();
    const clientPhoneTail = currentClient.phone ? currentClient.phone.replace(/\D/g, '').slice(-8) : '';
    return warrantyRegistrations.filter((w) => {
      const wEmail = (w.clientEmail || '').toLowerCase().trim();
      const wPhoneTail = w.clientPhone ? w.clientPhone.replace(/\D/g, '').slice(-8) : '';
      const emailMatch = Boolean(clientEmail && wEmail && wEmail === clientEmail);
      const phoneMatch = Boolean(clientPhoneTail.length >= 7 && wPhoneTail === clientPhoneTail);
      return emailMatch || phoneMatch;
    });
  }, [warrantyRegistrations, currentClient]);

  // Client's showroom viewing appointments strictly isolated
  const clientViewings = useMemo(() => {
    if (!currentClient) return [];
    const clientEmail = (currentClient.email || '').toLowerCase().trim();
    const clientPhoneTail = currentClient.phone ? currentClient.phone.replace(/\D/g, '').slice(-8) : '';
    return (viewingAppointments || []).filter((a) => {
      const aEmail = (a.customerEmail || '').toLowerCase().trim();
      const aPhoneTail = a.customerPhone ? a.customerPhone.replace(/\D/g, '').slice(-8) : '';
      const emailMatch = Boolean(clientEmail && aEmail && aEmail === clientEmail);
      const phoneMatch = Boolean(clientPhoneTail.length >= 7 && aPhoneTail === clientPhoneTail);
      return emailMatch || phoneMatch;
    });
  }, [viewingAppointments, currentClient]);

  const filteredWarranties = useMemo(() => {
    return clientWarranties.filter((w) => {
      if (warrantyFilterStatus === 'all') return true;
      return w.status === warrantyFilterStatus;
    });
  }, [clientWarranties, warrantyFilterStatus]);

  const handleRegisterWarrantySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regSerial.trim()) {
      showToast('Please enter the hardware serial number.');
      return;
    }
    if (!regModel.trim()) {
      showToast('Please enter the hardware model name.');
      return;
    }
    setIsSubmittingWarranty(true);
    try {
      const res = await registerWarranty({
        serialNumber: regSerial.trim().toUpperCase(),
        modelName: regModel.trim(),
        category: regCategory,
        purchaseDate: regPurchaseDate,
        orderNumber: regOrderNumber.trim() || undefined,
        clientName: currentClient?.name || 'Showroom Client',
        clientEmail: currentClient?.email || 'customer@techsokoni.com',
        clientPhone: currentClient?.phone || '0792620789',
        notes: regNotes.trim() || undefined,
      });
      if (res.ok) {
        setRegSerial('');
        setRegModel('');
        setRegOrderNumber('');
        setRegNotes('');
        showToast('Serial registered! Official 6-Month warranty is active.');
      } else {
        showToast(res.error || 'Failed to register serial.');
      }
    } finally {
      setIsSubmittingWarranty(false);
    }
  };

  const handleLookupSerial = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupQuery.trim().toUpperCase();
    if (!clean) return;
    const found = getWarrantyBySerial(clean);
    if (found) {
      setLookupResult(found);
    } else {
      setLookupResult('not_found');
    }
  };

  const handleCopySerial = (serial: string) => {
    navigator.clipboard?.writeText(serial);
    setCopiedSerial(serial);
    showToast(`Serial copied: ${serial}`);
    setTimeout(() => setCopiedSerial(null), 2500);
  };

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
              : authMode === 'mfa-challenge'
              ? 'Two-Step Verification'
              : 'Choose New Password'}
          </h1>
          <p className="text-xs text-[#6E6D68] text-center mt-1.5">
            {authMode === 'forgot-password'
              ? 'We will send a 6-digit verification code to your email to verify your identity before creating a new password.'
              : authMode === 'mfa-challenge'
              ? 'Enter the 6-digit security code dispatched to your email to verify your identity.'
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

          {/* VIEW 3: 3-STEP EMAIL OTP PASSWORD RESET (STRICT REQUIREMENT: NO LINK, 6-DIGIT CODE SENT TO EMAIL) */}
          {authMode === 'forgot-password' && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setOtpStep('enter-email');
                    setOtpCode('');
                    setResetToken('');
                  }}
                  className="text-xs font-mono-num uppercase tracking-wider text-[#6E6D68] hover:text-[#141413] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>

              {/* Step Progress Indicators */}
              <div className="grid grid-cols-3 gap-1 border-b border-[#141413]/10 pb-3">
                <div
                  className={`text-center py-1 text-[10px] font-mono-num uppercase tracking-wider ${
                    otpStep === 'enter-email'
                      ? 'border-b-2 border-[#141413] text-[#141413] font-bold'
                      : 'text-[#6E6D68]'
                  }`}
                >
                  1. Email
                </div>
                <div
                  className={`text-center py-1 text-[10px] font-mono-num uppercase tracking-wider ${
                    otpStep === 'enter-code'
                      ? 'border-b-2 border-[#141413] text-[#141413] font-bold'
                      : 'text-[#6E6D68]'
                  }`}
                >
                  2. 6-Digit Code
                </div>
                <div
                  className={`text-center py-1 text-[10px] font-mono-num uppercase tracking-wider ${
                    otpStep === 'enter-password' || otpStep === 'completed'
                      ? 'border-b-2 border-[#141413] text-[#141413] font-bold'
                      : 'text-[#6E6D68]'
                  }`}
                >
                  3. New Password
                </div>
              </div>

              {/* STEP 1: Enter Email to Send 6-Digit Code */}
              {otpStep === 'enter-email' && (
                <form onSubmit={handleSendResetCode} className="space-y-4">
                  <div className="border border-[#141413]/15 bg-[#EAE9E4]/50 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#141413]" />
                      <h3 className="font-semibold text-xs text-[#141413] uppercase tracking-wider">
                        Email OTP Verification
                      </h3>
                    </div>
                    <p className="text-xs text-[#5E5D59] leading-relaxed">
                      Enter your account email. We will send a 6-digit verification code to your email. Enter that code on the next screen to create your new password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                      Registered Client Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={otpEmail || email}
                        onChange={(e) => {
                          setOtpEmail(e.target.value);
                          setEmail(e.target.value);
                        }}
                        placeholder="client@example.com"
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
                    <span>{isSubmittingAuth ? 'Sending 6-Digit Code...' : 'Send 6-Digit Verification Code'}</span>
                  </button>
                </form>
              )}

              {/* STEP 2: Enter 6-Digit Code */}
              {otpStep === 'enter-code' && (
                <form onSubmit={handleVerifyResetCode} className="space-y-4">
                  <div className="p-3.5 bg-[#1F6F43]/10 border border-[#1F6F43]/30 space-y-1 text-left">
                    <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#1F6F43] font-semibold">
                      Code Sent to Email
                    </p>
                    <p className="text-xs text-[#141413] leading-relaxed">
                      We dispatched a 6-digit code to <span className="font-mono font-bold">{otpEmail}</span>. Enter it below to verify your identity.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1 text-center">
                      Enter 6-Digit Security Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full bg-white border border-[#141413]/30 py-3 text-center text-2xl font-mono tracking-[0.35em] text-[#141413] font-bold focus:border-[#141413] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth || otpCode.trim().length !== 6}
                    className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSubmittingAuth ? 'Verifying Code...' : 'Verify Code & Proceed'}</span>
                  </button>

                  <div className="flex items-center justify-between text-xs font-mono-num pt-2">
                    <button
                      type="button"
                      disabled={otpCooldown > 0}
                      onClick={handleResendResetCode}
                      className="text-[#6E6D68] hover:text-[#141413] underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                    >
                      {otpCooldown > 0 ? `Resend Code (${otpCooldown}s)` : 'Resend Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpStep('enter-email')}
                      className="text-[#6E6D68] hover:text-[#141413] underline cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Create New Password */}
              {otpStep === 'enter-password' && (
                <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                  <div className="p-3.5 bg-[#1F6F43]/10 border border-[#1F6F43]/30 space-y-1">
                    <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#1F6F43] font-semibold">
                      Code Verified Successfully
                    </p>
                    <p className="text-xs text-[#5E5D59]">
                      Set a new password for <span className="font-mono text-[#141413]">{otpEmail}</span>.
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
                    disabled={isSubmittingAuth}
                    className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingAuth ? 'Updating Password...' : 'Save New Password & Finish'}</span>
                  </button>
                </form>
              )}

              {/* STEP 4: Reset Completed */}
              {otpStep === 'completed' && (
                <div className="p-6 bg-[#1F6F43]/10 border border-[#1F6F43]/30 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#1F6F43] mx-auto" />
                  <h3 className="font-editorial text-2xl text-[#141413]">Password Reset Complete!</h3>
                  <p className="text-xs text-[#5E5D59] leading-relaxed max-w-sm mx-auto">
                    Your password has been securely updated. You can now log into your client portal with your new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setPassword('');
                      setAuthError('');
                      setResetSuccess('Password reset successfully! Please sign in with your new password below.');
                    }}
                    className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] cursor-pointer mt-3"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: TWO-STEP VERIFICATION (MFA) CHALLENGE */}
          {authMode === 'mfa-challenge' && (
            <div className="space-y-4 mt-6">
              <div className="border border-[#141413]/15 bg-[#EAE9E4]/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1F6F43]" />
                  <h3 className="font-semibold text-xs text-[#141413] uppercase tracking-wider">
                    Two-Step Verification
                  </h3>
                </div>
                <p className="text-xs text-[#5E5D59] leading-relaxed">
                  For your account security, a 6-digit verification code was sent to{' '}
                  <span className="font-mono font-bold text-[#141413]">{mfaEmail}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1 text-center">
                    Enter 6-Digit Security Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-white border border-[#141413]/30 py-3 text-center text-2xl font-mono tracking-[0.35em] text-[#141413] font-bold focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth || mfaCode.trim().length !== 6}
                  className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmittingAuth ? 'Verifying...' : 'Verify & Enter Portal'}</span>
                </button>

                <div className="flex items-center justify-between text-xs font-mono-num pt-2">
                  <button
                    type="button"
                    disabled={mfaCooldown > 0}
                    onClick={handleResendMfa}
                    className="text-[#6E6D68] hover:text-[#141413] underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                  >
                    {mfaCooldown > 0 ? `Resend Code (${mfaCooldown}s)` : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className="text-[#6E6D68] hover:text-[#141413] underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Shipment Tracking Link Without Sign-In */}
          {(authMode === 'login' || authMode === 'signup') && (
            <div className="mt-6 pt-5 border-t border-[#141413]/12 text-center">
              <p className="text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-2.5">
                Have an Order ID or Consignment Ref?
              </p>
              <button
                type="button"
                onClick={() => navigate({ page: 'track-shipment' })}
                className="w-full py-2.5 px-4 bg-[#EAE9E4] hover:bg-[#141413] hover:text-[#F4F3EF] border border-[#141413]/20 text-xs font-mono-num uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-[#1F6F43]" />
                <span>Track Live Shipment by Order ID</span>
              </button>
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block px-2 py-0.5 text-[9px] font-mono-num uppercase tracking-wider bg-[#141413] text-[#F4F3EF]">
                  Client Account
                </span>
                {currentClient.mfaEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono-num uppercase tracking-wider bg-[#1F6F43]/15 text-[#1F6F43] border border-[#1F6F43]/30">
                    <ShieldCheck className="w-3 h-3" />
                    2-Step Protected
                  </span>
                )}
                {(currentClient.email.toLowerCase() === 'sirdusman@gmail.com' || isAdminAuthenticated) && (
                  <span className="inline-block px-2 py-0.5 text-[9px] font-mono-num uppercase tracking-wider bg-[#D94E34]/15 text-[#D94E34] border border-[#D94E34]/30 font-bold">
                    Store Administrator
                  </span>
                )}
              </div>
              <h1 className="font-editorial text-3xl sm:text-5xl text-[#141413] mt-1">
                Welcome, {currentClient.name}
              </h1>
              <p className="text-xs font-mono-num text-[#5E5D59] mt-1">
                {currentClient.email} · {currentClient.phone || 'No phone'} ·{' '}
                {currentClient.defaultAddress || 'Nairobi'}, {currentClient.city || 'Nairobi'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(currentClient.email.toLowerCase() === 'sirdusman@gmail.com' || isAdminAuthenticated) && (
              <button
                onClick={() => navigate({ page: 'admin' })}
                className="px-4 py-2 bg-[#D94E34] text-white text-xs font-mono-num uppercase tracking-wider hover:bg-[#B73D26] flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>
            )}
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
              <span>Sign Out / Switch</span>
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
            onClick={() => setActiveTab('warranty')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'warranty'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#1F6F43]" />
            <span>Warranty &amp; Serials ({clientWarranties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'bookings'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#D94E34]" />
            <span>Showroom Bookings ({clientViewings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`px-4 py-2.5 text-xs font-mono-num uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'track'
                ? 'bg-[#141413] text-[#F4F3EF]'
                : 'bg-[#EAE9E4] text-[#5E5D59] hover:text-[#141413]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track by Order ID</span>
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
                          <p className="text-xs text-[#5E5D59] break-words">
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
                              navigate({
                                page: 'track-shipment',
                                orderId: order.orderNumber,
                              })
                            }
                            className="px-3 py-2 bg-[#1F6F43] text-[#F4F3EF] hover:bg-[#185835] text-[11px] font-mono-num uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Track Shipment</span>
                          </button>

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
              <>
                {paginatedReceiptsOrders.map((order) => (
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
                        <p className="text-xs text-[#5E5D59] mt-1 break-words">
                          Destination: {order.shippingAddress}, {order.city}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() =>
                            navigate({
                              page: 'track-shipment',
                              orderId: order.orderNumber,
                            })
                          }
                          className="px-4 py-2.5 bg-[#1F6F43] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#185835] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Shipment</span>
                        </button>

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
                ))}

                {displayedOrders.length > CLIENT_ORDERS_PAGE_SIZE && (
                  <div className="pt-4 border-t border-[#141413]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-num">
                    <span className="text-[#6E6D68]">
                      Page {safeReceiptsPage} of {receiptsTotalPages} · Showing{' '}
                      {(safeReceiptsPage - 1) * CLIENT_ORDERS_PAGE_SIZE + 1}–
                      {Math.min(
                        safeReceiptsPage * CLIENT_ORDERS_PAGE_SIZE,
                        displayedOrders.length
                      )}{' '}
                      of {displayedOrders.length} receipts
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setReceiptsOrdersPage((p) => Math.max(1, p - 1))
                        }
                        disabled={safeReceiptsPage === 1}
                        className="px-3 py-1.5 border border-[#141413]/20 bg-[#F4F3EF] text-[#141413] uppercase tracking-wider flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#141413] cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReceiptsOrdersPage((p) =>
                            Math.min(receiptsTotalPages, p + 1)
                          )
                        }
                        disabled={safeReceiptsPage === receiptsTotalPages}
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

            {/* Two-Step Verification (MFA) Security Settings */}
            <div className="pt-6 border-t border-[#141413]/15 mt-6 space-y-3">
              <div>
                <h3 className="font-semibold text-sm text-[#141413] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1F6F43]" />
                  <span>Two-Step Verification (MFA)</span>
                </h3>
                <p className="text-xs text-[#6E6D68] mt-1 leading-relaxed">
                  Adds an extra layer of security to your client account. When enabled, a 6-digit security code is dispatched to <span className="font-mono text-[#141413] font-bold">{currentClient.email}</span> every time you sign in.
                </p>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#EAE9E4]/60 border border-[#141413]/15">
                <div>
                  <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">Status:</span>
                  <span className={`ml-2 text-xs font-mono-num font-bold ${currentClient.mfaEnabled ? 'text-[#1F6F43]' : 'text-[#6E6D68]'}`}>
                    {currentClient.mfaEnabled ? 'ENABLED & PROTECTED' : 'DISABLED'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleClientMfa(currentClient.email, !currentClient.mfaEnabled)}
                  className={`px-4 py-2 text-xs font-mono-num uppercase tracking-wider transition-colors cursor-pointer border ${
                    currentClient.mfaEnabled
                      ? 'bg-[#1F6F43] text-white border-[#1F6F43] hover:bg-[#185834]'
                      : 'bg-[#141413] text-[#F4F3EF] border-[#141413] hover:bg-[#2B2B28]'
                  }`}
                >
                  {currentClient.mfaEnabled ? 'Turn Off Two-Step' : 'Turn On Two-Step'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW: SHOWROOM VIEWING APPOINTMENTS (STRICTLY ISOLATED TO CLIENT)
           ===================================================================== */}
        {activeTab === 'bookings' && (
          <div className="py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#141413]">
                  My Showroom Viewing Appointments
                </h2>
                <p className="text-xs text-[#6E6D68] mt-1">
                  Physical testing appointments reserved at our Nairobi CBD showroom.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openBookViewingModal()}
                className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#D94E34]" />
                <span>Book New Viewing</span>
              </button>
            </div>

            {clientViewings.length === 0 ? (
              <div className="bg-[#EAE9E4]/40 border border-[#141413]/12 p-8 text-center space-y-3">
                <Calendar className="w-8 h-8 text-[#6E6D68] mx-auto" />
                <h3 className="font-editorial text-xl text-[#141413]">No Appointments Scheduled</h3>
                <p className="text-xs text-[#6E6D68] max-w-md mx-auto">
                  You have not scheduled any physical showroom hardware inspection appointments yet.
                </p>
                <button
                  type="button"
                  onClick={() => openBookViewingModal()}
                  className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] cursor-pointer mt-2"
                >
                  Book In-Person Viewing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientViewings.map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-[#F4F3EF] border border-[#141413]/15 p-5 space-y-3 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-[#6E6D68] tracking-widest uppercase">
                          Ref: {appt.bookingReference}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono-num uppercase font-semibold border ${
                            appt.status === 'Confirmed'
                              ? 'bg-[#1F6F43]/10 text-[#1F6F43] border-[#1F6F43]/30'
                              : appt.status === 'Completed'
                              ? 'bg-[#141413]/10 text-[#141413] border-[#141413]/30'
                              : appt.status === 'Cancelled'
                              ? 'bg-[#D94E34]/10 text-[#D94E34] border-[#D94E34]/30'
                              : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-[#141413] mt-2 line-clamp-2">
                        {appt.productName}
                      </h3>
                      <div className="mt-3 space-y-1.5 text-xs text-[#5E5D59]">
                        <p className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#6E6D68]" />
                          <span>Date: {appt.viewingDate}</span>
                        </p>
                        <p className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#6E6D68]" />
                          <span>Time: {appt.viewingTimeSlot}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] text-[#6E6D68]">
                          <span>Kenyatta Pioneer Bldg, 5th Flr, Shop 514</span>
                        </p>
                      </div>
                    </div>
                    {appt.customerNotes && (
                      <p className="text-[11px] text-[#6E6D68] italic border-t border-[#141413]/10 pt-2 mt-2">
                        Note: &ldquo;{appt.customerNotes}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 4: REAL-TIME SHIPMENT TRACKER BY ORDER ID
           ===================================================================== */}
        {activeTab === 'track' && (
          <div className="py-6">
            <TrackShipmentView
              initialOrderId={
                route.page === 'client-portal' ? route.initialOrderId : undefined
              }
            />
          </div>
        )}

        {/* =====================================================================
            VIEW 5: DEDICATED WARRANTY TRACKING & SERIAL REGISTRATION
           ===================================================================== */}
        {activeTab === 'warranty' && (
          <div className="py-8 space-y-10">
            {/* Header Banner */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#141413]/10">
              <div>
                <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#1F6F43] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1F6F43]" />
                  <span>OFFICIAL HARDWARE PROTECTION · 6-MONTH WARRANTY</span>
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl text-[#141413] mt-1">
                  Warranty Tracking &amp; Serial Registration
                </h2>
                <p className="text-xs text-[#6E6D68] max-w-2xl mt-2 leading-relaxed">
                  Every machine from Tech Sokoni is backed by an official <strong>6-Month Local &amp; Manufacturer Warranty</strong>.
                  Register your unit's serial number below to activate instant warranty status tracking, claim priority repair or replacement at our Kenyatta Avenue showroom, and download your verifiable proof of authentic provenance.
                </p>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-num shrink-0">
                <div className="bg-[#EAE9E4] p-3 border border-[#141413]/10">
                  <span className="text-[10px] text-[#6E6D68] uppercase block">Registered Units</span>
                  <span className="text-xl font-semibold text-[#141413]">{clientWarranties.length}</span>
                </div>
                <div className="bg-[#EAE9E4] p-3 border border-[#141413]/10">
                  <span className="text-[10px] text-[#6E6D68] uppercase block">Active Coverage</span>
                  <span className="text-xl font-semibold text-[#1F6F43]">
                    {clientWarranties.filter((w) => w.status === 'active' || w.status === 'expiring-soon').length}
                  </span>
                </div>
                <div className="bg-[#EAE9E4] p-3 border border-[#141413]/10">
                  <span className="text-[10px] text-[#6E6D68] uppercase block">Duration</span>
                  <span className="text-xl font-semibold text-[#141413]">6 Months</span>
                </div>
                <div className="bg-[#EAE9E4] p-3 border border-[#141413]/10">
                  <span className="text-[10px] text-[#6E6D68] uppercase block">Service Center</span>
                  <span className="text-xs font-semibold text-[#141413] truncate block mt-1">Pioneer 514</span>
                </div>
              </div>
            </div>

            {/* Top Grid: Registration Form + Live Serial Lookup */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT (7 cols): Serial Registration Form */}
              <div className="lg:col-span-7 bg-[#F4F3EF] border border-[#141413]/15 p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-editorial text-2xl text-[#141413]">
                    Register Hardware Serial Number
                  </h3>
                  <p className="text-xs text-[#6E6D68] mt-1 leading-relaxed">
                    Locate the serial number on your product chassis, laser-engraved bottom plate, or invoice receipt.
                  </p>
                </div>

                {/* Auto-fill Helper from Recent Orders */}
                {displayedOrders.length > 0 && (
                  <div className="bg-[#EAE9E4] p-3 border border-[#141413]/10 space-y-2">
                    <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold block">
                      Quick Auto-Fill From Your Order History:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {displayedOrders.slice(0, 4).map((ord) => {
                        const firstItem = ord.items[0];
                        return (
                          <button
                            key={ord.id}
                            type="button"
                            onClick={() => {
                              if (firstItem) {
                                setRegModel(firstItem.productName);
                              }
                              setRegOrderNumber(ord.orderNumber || ord.id);
                              setRegPurchaseDate(ord.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]);
                              showToast(`Loaded details from order #${ord.orderNumber || ord.id}`);
                            }}
                            className="px-2.5 py-1 text-[11px] font-mono-num bg-[#F4F3EF] border border-[#141413]/20 hover:border-[#141413] text-[#141413] cursor-pointer"
                          >
                            #{ord.orderNumber || ord.id} ({firstItem ? firstItem.productName.slice(0, 24) + '...' : 'System'})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <form onSubmit={handleRegisterWarrantySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold mb-1">
                        Hardware Serial Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. C02GK9XXMD6R"
                        value={regSerial}
                        onChange={(e) => setRegSerial(e.target.value.toUpperCase())}
                        className="w-full bg-[#EAE9E4]/60 border border-[#141413]/25 px-3 py-2 text-xs font-mono uppercase text-[#141413] focus:border-[#141413] outline-none"
                      />
                      <span className="text-[10px] font-mono text-[#8E8D87] block mt-1">
                        Apple:  Menu → About This Mac · Windows: 'wmic bios get serialnumber'
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold mb-1">
                        Hardware Category
                      </label>
                      <select
                        value={regCategory}
                        onChange={(e) => setRegCategory(e.target.value as CategoryId)}
                        className="w-full bg-[#EAE9E4]/60 border border-[#141413]/25 px-3 py-2 text-xs text-[#141413] focus:border-[#141413] outline-none cursor-pointer"
                      >
                        <option value="laptops">Laptops &amp; Notebooks</option>
                        <option value="phones">Smartphones &amp; iPhones</option>
                        <option value="desktops">Desktops &amp; Workstations</option>
                        <option value="monitors">Monitors &amp; Displays</option>
                        <option value="printers">Printers &amp; Scanners</option>
                        <option value="tablets">Tablets &amp; iPads</option>
                        <option value="accessories">Studio Audio &amp; Power</option>
                        <option value="storage">NVMe &amp; External Storage</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold mb-1">
                      Product Name &amp; Model Specifications *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apple MacBook Pro 16&quot; (M3 Pro, 18GB, 512GB)"
                      value={regModel}
                      onChange={(e) => setRegModel(e.target.value)}
                      className="w-full bg-[#EAE9E4]/60 border border-[#141413]/25 px-3 py-2 text-xs text-[#141413] focus:border-[#141413] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold mb-1">
                        Purchase Date (Start of 6-Mo Warranty) *
                      </label>
                      <input
                        type="date"
                        required
                        value={regPurchaseDate}
                        onChange={(e) => setRegPurchaseDate(e.target.value)}
                        className="w-full bg-[#EAE9E4]/60 border border-[#141413]/25 px-3 py-2 text-xs font-mono text-[#141413] focus:border-[#141413] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold mb-1">
                        Order / Receipt Reference (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TS-ORD-1002 or Till 9309020 ref"
                        value={regOrderNumber}
                        onChange={(e) => setRegOrderNumber(e.target.value)}
                        className="w-full bg-[#EAE9E4]/60 border border-[#141413]/25 px-3 py-2 text-xs text-[#141413] focus:border-[#141413] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold mb-1">
                      Chassis Color / Distinct Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Space Black, includes original 140W MagSafe charger"
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      className="w-full bg-[#EAE9E4]/60 border border-[#141413]/25 px-3 py-2 text-xs text-[#141413] focus:border-[#141413] outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingWarranty}
                      className="w-full sm:w-auto px-6 py-3 bg-[#141413] text-[#F4F3EF] hover:bg-[#2B2B28] text-xs font-mono-num uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#1F6F43]" />
                      <span>{isSubmittingWarranty ? 'Activating Coverage...' : 'Register Serial & Activate 6-Month Warranty'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT (5 cols): Live Serial Coverage Checker */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#EAE9E4] border border-[#141413]/15 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#141413]">
                    <Search className="w-4 h-4 text-[#141413]" />
                    <span>Instant Serial Coverage Lookup</span>
                  </div>
                  <p className="text-xs text-[#6E6D68] leading-relaxed">
                    Check the current official 6-Month warranty lifespan, factory status, and Nairobi CBD showroom service eligibility for any Tech Sokoni machine.
                  </p>

                  <form onSubmit={handleLookupSerial} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Serial (e.g. C02GK9XXMD6R)"
                      value={lookupQuery}
                      onChange={(e) => {
                        setLookupQuery(e.target.value.toUpperCase());
                        setLookupResult(null);
                      }}
                      className="flex-1 bg-[#F4F3EF] border border-[#141413]/25 px-3 py-2 text-xs font-mono uppercase text-[#141413] focus:border-[#141413] outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] cursor-pointer"
                    >
                      Verify
                    </button>
                  </form>

                  {/* Lookup Result Box */}
                  {lookupResult === 'not_found' && (
                    <div className="bg-[#F4F3EF] border border-[#D94E34]/30 p-4 space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-[#D94E34] font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Serial Not Yet Registered</span>
                      </div>
                      <p className="text-[#6E6D68]">
                        Serial <strong>{lookupQuery}</strong> has not yet been registered in our warranty registry. You can register it using the form on the left to activate your 6-Month coverage.
                      </p>
                    </div>
                  )}

                  {lookupResult && lookupResult !== 'not_found' && (
                    <div className="bg-[#F4F3EF] border border-[#1F6F43]/40 p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-[#1F6F43]/15 text-[#1F6F43] font-mono-num font-semibold uppercase text-[10px] tracking-wider">
                          ✓ Verified Authentic Tech Sokoni Hardware
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[#141413]">
                          {lookupResult.serialNumber}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-[#141413]">
                          {lookupResult.modelName}
                        </h4>
                        <p className="text-[#6E6D68] text-[11px] mt-0.5">
                          {lookupResult.coverageSummary}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-num pt-2 border-t border-[#141413]/10">
                        <div>
                          <span className="text-[#8E8D87] block text-[9px] uppercase">Registered Date</span>
                          <span className="text-[#141413] font-medium">{lookupResult.purchaseDate}</span>
                        </div>
                        <div>
                          <span className="text-[#8E8D87] block text-[9px] uppercase">6-Mo Expiry Date</span>
                          <span className="text-[#141413] font-medium">{lookupResult.warrantyExpiryDate}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[10px] text-[#1F6F43] font-mono-num font-medium">
                          Status: Active 6-Month Protection
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const matchedProd = products.find((p) =>
                              lookupResult.modelName.toLowerCase().includes(p.name.toLowerCase()) ||
                              p.name.toLowerCase().includes(lookupResult.modelName.toLowerCase())
                            ) || products[0];
                            openBookViewingModal(matchedProd);
                            showToast('Opening Diagnostic Appointment Booking...');
                          }}
                          className="text-[11px] font-mono-num text-[#141413] underline hover:text-[#1F6F43] cursor-pointer"
                        >
                          Book Diagnostic →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Showroom Service Guarantee Box */}
                <div className="border border-[#141413]/15 p-6 bg-[#F4F3EF] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#141413] font-mono-num uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-[#1F6F43]" />
                    <span>6-Month Showroom Service Guarantee</span>
                  </div>
                  <ul className="text-xs text-[#5E5D59] space-y-2 list-disc list-inside leading-relaxed">
                    <li>100% Genuine factory-verified logic boards, batteries &amp; panels.</li>
                    <li>Walk-in repairs &amp; priority replacement at Kenyatta Pioneer Building, Shop 514, Nairobi CBD.</li>
                    <li>Free annual thermal repasting, dust purge, and battery diagnostic audits.</li>
                    <li>Instant repair status updates via WhatsApp hotline: +254 792 620 789.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom: Registered Hardware Portfolio Cards */}
            <div className="space-y-4 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-editorial text-2xl text-[#141413]">
                    Your Registered Hardware Systems ({clientWarranties.length})
                  </h3>
                  <p className="text-xs text-[#6E6D68]">
                    Active 6-Month warranty certificates registered to your client profile.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-[#EAE9E4] p-1 border border-[#141413]/10 self-start">
                  {(['all', 'active', 'expiring-soon', 'expired'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setWarrantyFilterStatus(st)}
                      className={`px-3 py-1 text-[10px] font-mono-num uppercase tracking-wider transition-colors cursor-pointer ${
                        warrantyFilterStatus === st
                          ? 'bg-[#141413] text-[#F4F3EF]'
                          : 'text-[#6E6D68] hover:text-[#141413]'
                      }`}
                    >
                      {st.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {filteredWarranties.length === 0 ? (
                <div className="bg-[#EAE9E4]/40 border border-[#141413]/10 p-12 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-[#8E8D87] mx-auto stroke-[1.25]" />
                  <p className="text-sm font-semibold text-[#141413]">No Hardware Registered Yet</p>
                  <p className="text-xs text-[#6E6D68] max-w-md mx-auto">
                    Use the registration form above to enter the serial number of your laptop, phone, or desktop to activate official 6-Month warranty tracking.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWarranties.map((w) => {
                    const expiryDate = new Date(w.warrantyExpiryDate);
                    const now = new Date();
                    const diffTime = expiryDate.getTime() - now.getTime();
                    const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                    const isExp = remainingDays === 0;

                    return (
                      <div
                        key={w.id}
                        className="bg-[#F4F3EF] border border-[#141413]/15 p-5 space-y-4 relative hover:border-[#141413]/40 transition-colors"
                      >
                        {/* Top Row: Serial & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-[#141413] tracking-wide">
                                {w.serialNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopySerial(w.serialNumber)}
                                title="Copy Serial"
                                className="text-[#6E6D68] hover:text-[#141413] p-0.5 cursor-pointer"
                              >
                                {copiedSerial === w.serialNumber ? (
                                  <Check className="w-3.5 h-3.5 text-[#1F6F43]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#8E8D87] block mt-0.5">
                              ID: {w.id} {w.orderNumber ? `· Order #${w.orderNumber}` : ''}
                            </span>
                          </div>

                          <span
                            className={`px-2.5 py-1 text-[10px] font-mono-num uppercase tracking-wider font-semibold ${
                              isExp
                                ? 'bg-[#141413]/10 text-[#8E8D87]'
                                : remainingDays < 30
                                ? 'bg-[#D94E34]/15 text-[#D94E34]'
                                : 'bg-[#1F6F43]/15 text-[#1F6F43]'
                            }`}
                          >
                            {isExp ? 'Expired' : `${remainingDays} Days Left`}
                          </span>
                        </div>

                        {/* Middle: Hardware Title & Specs */}
                        <div>
                          <h4 className="font-editorial text-lg text-[#141413] leading-snug">
                            {w.modelName}
                          </h4>
                          <p className="text-xs text-[#5E5D59] mt-1 leading-relaxed">
                            {w.coverageSummary}
                          </p>
                          {w.notes && (
                            <p className="text-[11px] text-[#8E8D87] mt-1 italic">
                              "{w.notes}"
                            </p>
                          )}
                        </div>

                        {/* Lifespan Visual Meter (6-Months) */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-mono-num text-[#6E6D68]">
                            <span>Purchased: {w.purchaseDate}</span>
                            <span>Expires (6 Mo): {w.warrantyExpiryDate}</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#EAE9E4] overflow-hidden rounded-full">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isExp
                                  ? 'bg-[#8E8D87]'
                                  : remainingDays < 30
                                  ? 'bg-[#D94E34]'
                                  : 'bg-[#1F6F43]'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    5,
                                    Math.round((remainingDays / 180) * 100)
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Footer Card Actions */}
                        <div className="pt-2 border-t border-[#141413]/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-num">
                          <div className="flex items-center gap-1.5 text-[#1F6F43]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Official Tech Sokoni Kenya Certificate</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const matchedProd = products.find((p) =>
                                  w.modelName.toLowerCase().includes(p.name.toLowerCase()) ||
                                  p.name.toLowerCase().includes(w.modelName.toLowerCase())
                                ) || products[0];
                                openBookViewingModal(matchedProd);
                                showToast(`Booking diagnostic for serial ${w.serialNumber}...`);
                              }}
                              className="px-2.5 py-1 bg-[#141413] text-[#F4F3EF] hover:bg-[#2B2B28] text-[10px] font-mono-num uppercase tracking-wider cursor-pointer"
                            >
                              Book Diagnostic
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
