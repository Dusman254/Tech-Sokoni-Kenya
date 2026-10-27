import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  HelpCircle,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Truck,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types/store';
import { PdfReceiptService } from '../services/pdfReceiptService';
import { StudioImage } from './StudioImage';

interface TrackShipmentViewProps {
  initialOrderId?: string;
}

const DELIVERY_STEPS: Array<{
  status: OrderStatus;
  label: string;
  sublabel: string;
  description: string;
}> = [
  {
    status: 'Processing',
    label: 'Order Confirmed',
    sublabel: 'Payment & Order Verification',
    description: 'Order registered in Tech Sokoni ERP. M-Pesa or POD verified.',
  },
  {
    status: 'Packed & Verified',
    label: 'Serial Verified & Packed',
    sublabel: 'Hardware QC & Sealed Packaging',
    description: 'Hardware serials documented, accessories checked, tamper seals applied.',
  },
  {
    status: 'Dispatched',
    label: 'Dispatched / In Transit',
    sublabel: 'Handed to Courier Partner',
    description: 'En route with Nairobi Express Rider or G4S / Fargo Courier.',
  },
  {
    status: 'Delivered',
    label: 'Delivered & Completed',
    sublabel: 'Received & Inspected by Client',
    description: 'Order successfully delivered and accepted at destination.',
  },
];

function getStatusStepIndex(status: OrderStatus): number {
  if (status === 'Processing') return 0;
  if (status === 'Packed & Verified') return 1;
  if (status === 'Dispatched') return 2;
  if (status === 'Delivered') return 3;
  return -1; // Cancelled
}

export const TrackShipmentView: React.FC<TrackShipmentViewProps> = ({
  initialOrderId,
}) => {
  const {
    orders,
    settings,
    currentClient,
    submitMpesaConfirmation,
    navigate,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState(initialOrderId || '');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [mpesaInput, setMpesaInput] = useState('');
  const [mpesaSubmitSuccess, setMpesaSubmitSuccess] = useState(false);

  // Search function to match by Order Number or ID
  const performSearch = (query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setMatchedOrder(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const found = orders.find((o) => {
      const matchId = o.id.toLowerCase() === clean;
      const matchNum = o.orderNumber.toLowerCase() === clean;
      const matchPartial =
        clean.length >= 4 &&
        (o.orderNumber.toLowerCase().includes(clean) ||
          o.id.toLowerCase().includes(clean) ||
          (o.mpesaCode && o.mpesaCode.toLowerCase().includes(clean)));
      return matchId || matchNum || matchPartial;
    });

    setMatchedOrder(found || null);
    setMpesaSubmitSuccess(false);
    setMpesaInput('');
  };

  // Trigger search on mount if initialOrderId is supplied
  useEffect(() => {
    if (initialOrderId) {
      setSearchQuery(initialOrderId);
      performSearch(initialOrderId);
    }
  }, [initialOrderId, orders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // Recent orders belonging to current client (if logged in) or top store orders
  const clientOrders = currentClient
    ? orders.filter(
        (o) =>
          o.clientId === currentClient.id ||
          (currentClient.uid && o.clientId === currentClient.uid) ||
          o.customerEmail.toLowerCase() === currentClient.email.toLowerCase()
      )
    : [];

  const handleMpesaSubmit = async (orderId: string) => {
    const code = mpesaInput.trim().toUpperCase();
    if (!code) return;
    submitMpesaConfirmation(
      orderId,
      code,
      `Confirmation code ${code} submitted via Real-Time Shipment Tracker`
    );
    setMpesaSubmitSuccess(true);
    setMpesaInput('');
  };

  const handleDownloadReceipt = (order: Order) => {
    PdfReceiptService.generateAndDownloadReceipt(order, settings);
  };

  const currentStep = matchedOrder ? getStatusStepIndex(matchedOrder.status) : 0;
  const isCancelled = matchedOrder?.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-24 text-[#141413]">
      {/* Top Banner / Breadcrumb */}
      <div className="showroom-canvas border-b border-[#141413]/12 py-8 sm:py-12 px-4 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <button
              onClick={() => navigate({ page: 'client-portal' })}
              className="text-xs font-mono-num uppercase tracking-wider text-[#6E6D68] hover:text-[#141413] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Client Portal</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1F6F43] animate-pulse" />
              <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#1F6F43] font-semibold">
                Live Dispatch Sync · Nairobi CBD Showroom
              </span>
            </div>
          </div>

          <p className="text-[11px] font-mono-num uppercase tracking-[0.24em] text-[#6E6D68]">
            TECH SOKONI LOGISTICS · REAL-TIME SHIPMENT TRACKER
          </p>
          <h1 className="font-editorial text-3xl sm:text-5xl text-[#141413] mt-1.5">
            Track Shipment Status
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5D59] mt-2 max-w-2xl leading-relaxed">
            Enter your Tech Sokoni Order ID (e.g.{' '}
            <span className="font-mono text-[#141413] font-semibold">
              TSK-8921-X
            </span>
            ) to view real-time courier dispatch progress, serial verification,
            and estimated delivery time.
          </p>

          {/* Search Input Box */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 max-w-2xl bg-white border border-[#141413]/20 p-2 sm:p-2.5 shadow-sm flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-[#6E6D68] absolute left-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID or Order Number (e.g. TSK-8921-X)..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono-num text-[#141413] bg-transparent focus:outline-none placeholder:text-[#8E8D87]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setMatchedOrder(null);
                    setHasSearched(false);
                  }}
                  className="text-xs text-[#6E6D68] hover:text-[#141413] pr-2 cursor-pointer font-mono"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest hover:bg-[#2B2B28] transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Inspect Shipment</span>
            </button>
          </form>

          {/* Quick Order Selection Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
              {clientOrders.length > 0 ? 'Your Orders:' : 'Sample Order IDs:'}
            </span>
            {(clientOrders.length > 0 ? clientOrders : orders.slice(0, 4)).map(
              (o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(o.orderNumber);
                    performSearch(o.orderNumber);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono-num border cursor-pointer transition-all ${
                    matchedOrder?.id === o.id
                      ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                      : 'bg-white/80 border-[#141413]/15 text-[#5E5D59] hover:border-[#141413] hover:text-[#141413]'
                  }`}
                >
                  {o.orderNumber}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8">
        {matchedOrder ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Top Status & Summary Card */}
            <div className="bg-white border border-[#141413]/12 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#141413]/10">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                      Order Identification:
                    </span>
                    <span className="font-mono text-sm font-bold text-[#141413] bg-[#EAE9E4] px-2.5 py-0.5 border border-[#141413]/10">
                      {matchedOrder.orderNumber}
                    </span>
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl text-[#141413] mt-2">
                    Current Shipment Status:{' '}
                    <span
                      className={
                        isCancelled
                          ? 'text-[#D94E34]'
                          : matchedOrder.status === 'Delivered'
                          ? 'text-[#1F6F43]'
                          : 'text-[#1F6F43]'
                      }
                    >
                      {matchedOrder.status}
                    </span>
                  </h2>
                  <p className="text-xs font-mono-num text-[#5E5D59] mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Placed on{' '}
                      {new Date(matchedOrder.createdAt).toLocaleDateString(
                        'en-KE',
                        {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleDownloadReceipt(matchedOrder)}
                    className="px-3.5 py-2 bg-[#EAE9E4] text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] border border-[#141413]/15 text-xs font-mono-num uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Receipt (PDF)</span>
                  </button>

                  <a
                    href={`https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20am%20inquiring%20about%20my%20Order%20${encodeURIComponent(
                      matchedOrder.orderNumber
                    )}%20currently%20marked%20as%20${encodeURIComponent(
                      matchedOrder.status
                    )}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#1F6F43] text-[#F4F3EF] hover:bg-[#185835] text-xs font-mono-num uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Dispatch</span>
                  </a>
                </div>
              </div>

              {/* Multi-step Visual Progress Tracker */}
              {!isCancelled ? (
                <div className="py-4">
                  <p className="text-[10px] font-mono-num uppercase tracking-widest text-[#6E6D68] mb-6">
                    Fulfillment & Transit Milestones
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                    {DELIVERY_STEPS.map((step, idx) => {
                      const isComplete = currentStep >= idx;
                      const isCurrent = currentStep === idx;

                      return (
                        <div
                          key={step.status}
                          className={`p-4 border transition-all ${
                            isCurrent
                              ? 'bg-[#1F6F43]/5 border-[#1F6F43] ring-1 ring-[#1F6F43]'
                              : isComplete
                              ? 'bg-[#EAE9E4]/40 border-[#141413]/15'
                              : 'bg-white/40 border-[#141413]/10 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                              Stage 0{idx + 1}
                            </span>
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-[#1F6F43]" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-[#8E8D87]" />
                            )}
                          </div>
                          <p className="font-semibold text-xs text-[#141413] flex items-center gap-1.5">
                            {isCurrent && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1F6F43] animate-ping" />
                            )}
                            {step.label}
                          </p>
                          <p className="text-[11px] font-mono-num text-[#5E5D59] mt-0.5">
                            {step.sublabel}
                          </p>
                          <p className="text-[11px] text-[#6E6D68] mt-2 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#D94E34]/10 border border-[#D94E34]/30 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-[#D94E34] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm text-[#D94E34]">
                      This Order was Cancelled
                    </h3>
                    <p className="text-xs text-[#5E5D59] mt-1 leading-relaxed">
                      If you did not initiate this cancellation or require
                      clarification, please contact the Tech Sokoni support desk
                      on +254 792 620 789 or visit our Kenyatta Avenue showroom.
                    </p>
                  </div>
                </div>
              )}

              {/* Courier & Transit Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#141413]/10 text-xs">
                {/* Dispatch Details */}
                <div className="p-3.5 bg-[#F4F3EF] border border-[#141413]/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                    <Truck className="w-3.5 h-3.5 text-[#1F6F43]" />
                    <span>Courier & Dispatch Service</span>
                  </div>
                  <p className="font-semibold text-[#141413]">
                    {matchedOrder.city.toLowerCase() === 'nairobi'
                      ? 'Nairobi Same-Day Express Rider'
                      : 'Fargo Courier / G4S Secure Transport'}
                  </p>
                  <p className="text-[11px] text-[#5E5D59] leading-relaxed">
                    {matchedOrder.trackingNote ||
                      (matchedOrder.city.toLowerCase() === 'nairobi'
                        ? 'Package assigned to city dispatch rider. ETA: within 2-4 hours.'
                        : 'Consignment packaged for secure upcountry courier transit. ETA: 24-48 hours.')}
                  </p>
                </div>

                {/* Destination */}
                <div className="p-3.5 bg-[#F4F3EF] border border-[#141413]/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                    <MapPin className="w-3.5 h-3.5 text-[#1F6F43]" />
                    <span>Delivery Destination</span>
                  </div>
                  <p className="font-semibold text-[#141413]">
                    {matchedOrder.customerName}
                  </p>
                  <p className="text-[11px] font-mono-num text-[#5E5D59]">
                    {matchedOrder.shippingAddress}, {matchedOrder.city}
                  </p>
                  <p className="text-[11px] font-mono-num text-[#6E6D68]">
                    Recipient Contact: {matchedOrder.customerPhone}
                  </p>
                </div>

                {/* Payment Status & Lipa Na M-Pesa */}
                <div className="p-3.5 bg-[#F4F3EF] border border-[#141413]/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                    <Smartphone className="w-3.5 h-3.5 text-[#1F6F43]" />
                    <span>Payment Verification</span>
                  </div>
                  <p className="font-semibold text-[#141413]">
                    {matchedOrder.paymentMethod}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-mono-num">
                    <span className="text-[#6E6D68]">Status:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        matchedOrder.mpesaStatus === 'Verified & Paid'
                          ? 'bg-[#1F6F43]/15 text-[#1F6F43]'
                          : matchedOrder.paymentMethod === 'Payment on Delivery'
                          ? 'bg-[#141413]/10 text-[#141413]'
                          : 'bg-[#D94E34]/15 text-[#D94E34]'
                      }`}
                    >
                      {matchedOrder.mpesaStatus ||
                        (matchedOrder.paymentMethod === 'Payment on Delivery'
                          ? 'Pay on Delivery'
                          : 'Pending')}
                    </span>
                  </div>
                  {matchedOrder.mpesaCode && (
                    <p className="text-[11px] font-mono-num text-[#1F6F43] font-medium">
                      M-Pesa Ref: {matchedOrder.mpesaCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Inline M-Pesa Code Submission if still pending */}
              {matchedOrder.paymentMethod === 'M-Pesa Express' &&
                matchedOrder.mpesaStatus !== 'Verified & Paid' && (
                  <div className="p-4 bg-[#EAE9E4]/60 border border-[#141413]/12 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#141413] flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#1F6F43]" />
                        <span>Confirm M-Pesa Buy Goods Till 9309020</span>
                      </p>
                      <span className="text-[10px] font-mono-num uppercase text-[#6E6D68]">
                        Amount: {settings.currencySymbol}
                        {matchedOrder.total.toLocaleString()}
                      </span>
                    </div>
                    {mpesaSubmitSuccess ? (
                      <div className="text-xs text-[#1F6F43] flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          M-Pesa code submitted! Tech Sokoni dispatch will verify
                          and update your shipment status.
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mpesaInput}
                          onChange={(e) =>
                            setMpesaInput(e.target.value.toUpperCase())
                          }
                          placeholder="Enter Safaricom code (e.g. QK89XY21Z)"
                          className="flex-1 bg-white border border-[#141413]/20 px-3 py-1.5 text-xs font-mono-num text-[#141413]"
                        />
                        <button
                          type="button"
                          onClick={() => handleMpesaSubmit(matchedOrder.id)}
                          className="px-4 py-1.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] cursor-pointer flex items-center gap-1.5"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Hardware Items Manifest Card */}
            <div className="bg-white border border-[#141413]/12 p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#141413]/10">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#141413]" />
                  <h3 className="font-editorial text-xl text-[#141413]">
                    Package Hardware Contents ({matchedOrder.items.length}{' '}
                    {matchedOrder.items.length === 1 ? 'item' : 'items'})
                  </h3>
                </div>
                <span className="text-xs font-mono-num text-[#6E6D68]">
                  Total Order Value: {settings.currencySymbol}
                  {matchedOrder.total.toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-[#141413]/10">
                {matchedOrder.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 bg-[#EAE9E4] p-1.5 shrink-0 flex items-center justify-center border border-[#141413]/10">
                        <StudioImage
                          src={item.image}
                          alt={item.productName}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-[#141413]">
                          {item.productName}
                        </p>
                        <p className="text-[11px] font-mono-num text-[#6E6D68]">
                          {item.brand} · SKU: {item.sku}
                        </p>
                        {item.selectedVariations &&
                          Object.keys(item.selectedVariations).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {Object.entries(item.selectedVariations).map(
                                ([k, v]) => (
                                  <span
                                    key={k}
                                    className="text-[10px] font-mono-num px-1.5 py-0.5 bg-[#EAE9E4] text-[#5E5D59]"
                                  >
                                    {k}: {v}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="text-right sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                      <p className="text-xs font-mono-num text-[#6E6D68]">
                        Qty: {item.quantity} × {settings.currencySymbol}
                        {item.unitPrice.toLocaleString()}
                      </p>
                      <p className="text-sm font-mono-num font-semibold text-[#141413]">
                        {settings.currencySymbol}
                        {(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-4 border-t border-[#141413]/10 flex flex-col items-end text-xs space-y-1 font-mono-num">
                <div className="flex justify-between w-64 text-[#5E5D59]">
                  <span>Subtotal:</span>
                  <span>
                    {settings.currencySymbol}
                    {matchedOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                {matchedOrder.discountTotal > 0 && (
                  <div className="flex justify-between w-64 text-[#D94E34]">
                    <span>Privilege Discount:</span>
                    <span>
                      −{settings.currencySymbol}
                      {matchedOrder.discountTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-[#1F6F43]">
                  <span>Nationwide Courier Shipping:</span>
                  <span>Free (Kenya 47 Counties)</span>
                </div>
                <div className="flex justify-between w-64 pt-2 border-t border-[#141413]/15 text-sm font-bold text-[#141413]">
                  <span>Total Amount:</span>
                  <span>
                    {settings.currencySymbol}
                    {matchedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Card */}
            <div className="bg-[#EAE9E4]/60 border border-[#141413]/12 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#5E5D59]">
                <ShieldCheck className="w-4 h-4 text-[#1F6F43]" />
                <span>
                  Protected by 6-Month Local Warranty &amp; Same-Day Nairobi Dispatch.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setMatchedOrder(null);
                    setSearchQuery('');
                    setHasSearched(false);
                  }}
                  className="px-4 py-2 border border-[#141413]/20 bg-white text-xs font-mono-num uppercase tracking-wider text-[#141413] hover:border-[#141413] cursor-pointer"
                >
                  Track Another Order
                </button>
                <button
                  onClick={() => navigate({ page: 'category', categoryId: 'all' })}
                  className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </motion.div>
        ) : hasSearched ? (
          <div className="bg-white border border-[#141413]/12 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
            <XCircle className="w-10 h-10 text-[#D94E34] mx-auto" />
            <h3 className="font-editorial text-2xl text-[#141413]">
              No Order Found for &ldquo;{searchQuery}&rdquo;
            </h3>
            <p className="text-xs text-[#5E5D59] leading-relaxed max-w-md mx-auto">
              We couldn&apos;t locate an order with that identification number.
              Please check your confirmation SMS or email receipt to ensure the
              Order Number (e.g.{' '}
              <span className="font-mono text-[#141413] font-semibold">
                TSK-8921-X
              </span>
              ) is typed correctly.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHasSearched(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] cursor-pointer"
              >
                Try Again
              </button>

              <a
                href={`https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20am%20trying%20to%20track%20my%20order%20with%20ID:%20${encodeURIComponent(
                  searchQuery
                )}%20but%20cannot%20find%20it.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1F6F43] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider hover:bg-[#185835] flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Contact Dispatch Hotline</span>
              </a>
            </div>
          </div>
        ) : (
          /* Initial Guide / Instructions State */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#141413]/12 p-6 space-y-3">
              <div className="w-9 h-9 bg-[#1F6F43]/10 text-[#1F6F43] flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-lg text-[#141413]">
                1. Nairobi Same-Day Express
              </h3>
              <p className="text-xs text-[#5E5D59] leading-relaxed">
                Orders within Nairobi (CBD, Westlands, Kilimani, Karen, Upper
                Hill, Waiyaki Way) are dispatched via express direct riders within
                2 to 4 hours.
              </p>
            </div>

            <div className="bg-white border border-[#141413]/12 p-6 space-y-3">
              <div className="w-9 h-9 bg-[#1F6F43]/10 text-[#1F6F43] flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-lg text-[#141413]">
                2. Nationwide Insured Transit
              </h3>
              <p className="text-xs text-[#5E5D59] leading-relaxed">
                Upcountry deliveries across Kenya&apos;s 47 counties (Mombasa,
                Kisumu, Nakuru, Eldoret) arrive within 24–48 hours via Fargo
                Courier or G4S.
              </p>
            </div>

            <div className="bg-white border border-[#141413]/12 p-6 space-y-3">
              <div className="w-9 h-9 bg-[#1F6F43]/10 text-[#1F6F43] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-lg text-[#141413]">
                3. Inspect Before Payment
              </h3>
              <p className="text-xs text-[#5E5D59] leading-relaxed">
                With Payment on Delivery, you inspect the physical package and
                genuine hardware before completing payment via M-Pesa Till
                9309020.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
