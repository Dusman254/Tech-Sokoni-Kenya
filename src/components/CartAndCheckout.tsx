import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Copy,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types/store';
import { downloadOrderReceiptPdf } from '../services/pdfReceiptService';
import { StudioImage } from './StudioImage';

/**
 * Branded M-Pesa Icon Mark (Green & Red M-Pesa Mobile Money Emblem)
 */
export const MpesaBrandIcon: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect width="40" height="40" rx="8" fill="#1F6F43" />
    <rect
      x="11"
      y="6"
      width="18"
      height="28"
      rx="3"
      fill="#F4F3EF"
      stroke="#141413"
      strokeWidth="1.5"
    />
    <rect x="15" y="9" width="10" height="1.5" rx="0.75" fill="#141413" />
    {/* M-Pesa Red & Green Crest */}
    <path d="M14 14H26V22H14V14Z" fill="#1F6F43" />
    <path d="M14 19.5L26 16.5V22H14V19.5Z" fill="#E1251B" />
    <text
      x="20"
      y="19.5"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="5.5"
      fontWeight="bold"
      fontFamily="monospace"
    >
      M-PESA
    </text>
    <circle cx="20" cy="29" r="2" fill="#1F6F43" />
  </svg>
);

/**
 * Helper to extract an M-Pesa transaction code (e.g. SHK8492M1P) from either a code or full SMS text
 */
function extractMpesaCodeFromText(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\b([A-Z0-9]{10})\b/i);
  if (match) return match[1].toUpperCase();
  return trimmed.slice(0, 14).toUpperCase();
}

export const CartAndCheckout: React.FC = () => {
  const {
    products,
    cart,
    savedForLater,
    settings,
    currentClient,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    updateCartQuantity,
    removeFromCart,
    moveToSavedForLater,
    moveToCartFromSaved,
    removeFromSaved,
    getEffectivePricing,
    placeOrder,
    submitMpesaConfirmation,
    showToast,
    navigate,
  } = useStore();

  // Multi-Step Checkout Progress Stepper State (1: Delivery, 2: Payment, 3: Confirm)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  // Simple Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>(
    'M-Pesa Express'
  );
  const [mpesaInput, setMpesaInput] = useState('');
  const [copiedTill, setCopiedTill] = useState(false);

  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [postOrderMpesaInput, setPostOrderMpesaInput] = useState('');
  const [postOrderMpesaSent, setPostOrderMpesaSent] = useState(false);

  // Pre-fill from logged-in client account when opening checkout
  useEffect(() => {
    if (isCheckoutOpen) {
      setCheckoutStep(1);
      setPostOrderMpesaSent(false);
      if (currentClient) {
        setCustomerName((prev) => prev || currentClient.name);
        setCustomerEmail((prev) => prev || currentClient.email);
        setCustomerPhone((prev) => prev || currentClient.phone);
        setShippingAddress((prev) => prev || currentClient.defaultAddress);
        setCity((prev) => prev || currentClient.city || 'Nairobi');
      }
    }
  }, [currentClient, isCheckoutOpen]);

  const detailedCart = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const pricing = getEffectivePricing(product);
        const delta = item.variationPriceDelta || 0;
        const unitOriginal = Math.max(1, pricing.originalPrice + delta);
        const unitFinal = Math.max(1, pricing.finalPrice + delta);
        return {
          ...item,
          itemKey: item.cartItemKey || item.productId,
          product,
          pricing,
          unitOriginal,
          unitFinal,
          lineOriginal: unitOriginal * item.quantity,
          lineFinal: unitFinal * item.quantity,
          lineDiscount: pricing.discountAmount * item.quantity,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [cart, products, getEffectivePricing]);

  const detailedSaved = useMemo(() => {
    return savedForLater
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const pricing = getEffectivePricing(product);
        const delta = item.variationPriceDelta || 0;
        return {
          ...item,
          itemKey: item.cartItemKey || item.productId,
          product,
          pricing,
          unitFinal: Math.max(1, pricing.finalPrice + delta),
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [savedForLater, products, getEffectivePricing]);

  const subtotal = detailedCart.reduce((acc, i) => acc + i.lineOriginal, 0);
  const discountTotal = detailedCart.reduce((acc, i) => acc + i.lineDiscount, 0);
  const total = detailedCart.reduce((acc, i) => acc + i.lineFinal, 0);

  const handleCopyTill = () => {
    navigator.clipboard?.writeText('9309020').catch(() => {});
    setCopiedTill(true);
    showToast('Copied M-Pesa Buy Goods Till: 9309020');
    setTimeout(() => setCopiedTill(false), 2500);
  };

  const handleNextStep = () => {
    if (checkoutStep === 1) {
      if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
        showToast('Please enter your name, phone number, and delivery location.');
        return;
      }
      setCheckoutStep(2);
    } else if (checkoutStep === 2) {
      setCheckoutStep(3);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (detailedCart.length === 0) return;

    const extractedCode =
      paymentMethod === 'M-Pesa Express' && mpesaInput.trim()
        ? extractMpesaCodeFromText(mpesaInput)
        : undefined;

    const created = placeOrder({
      customerName: customerName.trim() || 'Tech Sokoni Client',
      customerEmail:
        customerEmail.trim() ||
        `${customerPhone.replace(/\D/g, '').slice(-9) || 'client'}@techsokoni.co.ke`,
      customerPhone: customerPhone.trim() || '+254 700 000 000',
      shippingAddress: shippingAddress.trim() || 'Nairobi CBD',
      city: city.trim() || 'Nairobi',
      paymentMethod,
      mpesaCode: extractedCode,
      mpesaMessage:
        paymentMethod === 'M-Pesa Express' && mpesaInput.trim()
          ? mpesaInput.trim()
          : undefined,
      mpesaStatus:
        paymentMethod === 'M-Pesa Express'
          ? 'Pending Verification'
          : 'Pay on Delivery',
      items: detailedCart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        brand: c.product.brand,
        sku: c.product.sku,
        quantity: c.quantity,
        unitPrice: c.unitFinal,
        originalPrice: c.unitOriginal,
        image: c.product.images[0],
        selectedVariations: c.selectedVariations,
      })),
      subtotal,
      discountTotal,
      total,
    });

    setConfirmedOrder(created);
    setMpesaInput('');
  };

  const handlePostOrderMpesaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedOrder || !postOrderMpesaInput.trim()) return;
    const code = extractMpesaCodeFromText(postOrderMpesaInput);
    submitMpesaConfirmation(
      confirmedOrder.id,
      code,
      postOrderMpesaInput.trim()
    );
    setConfirmedOrder({
      ...confirmedOrder,
      mpesaCode: code,
      mpesaMessage: postOrderMpesaInput.trim(),
      mpesaStatus: 'Pending Verification',
    });
    setPostOrderMpesaInput('');
    setPostOrderMpesaSent(true);
  };

  const steps = [
    { num: 1 as const, label: 'Delivery' },
    { num: 2 as const, label: 'M-Pesa / Pay' },
    { num: 3 as const, label: 'Confirm' },
  ];

  return (
    <>
      {/* =====================================================================
          SLIDE-OUT CART DRAWER
         ===================================================================== */}
      {isCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Bag"
          className="fixed inset-0 z-50 flex justify-end bg-[#141413]/40 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-[#F4F3EF] h-full flex flex-col justify-between border-l border-[#141413]/15 shadow-2xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#141413]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-mono-num uppercase tracking-[0.2em] font-semibold text-[#141413]">
                  TECH SOKONI BAG ({detailedCart.length})
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close bag"
                className="p-1 text-[#141413] hover:opacity-65 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#141413]/10">
              {detailedCart.length > 0 ? (
                detailedCart.map((item) => (
                  <div key={item.itemKey} className="py-5 flex gap-4">
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate({
                          page: 'product',
                          productId: item.product.id,
                        });
                      }}
                      className="w-20 h-20 bg-[#EAE9E4] p-2 shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      <StudioImage
                        src={item.product.images[0]}
                        alt={item.product.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-contain"
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                            {item.product.brand}
                          </p>
                          <h4 className="text-sm font-semibold text-[#141413] truncate">
                            {item.product.name}
                          </h4>
                          {item.selectedVariations &&
                            Object.keys(item.selectedVariations).length > 0 && (
                              <p className="text-[10px] font-mono-num text-[#5E5D59] mt-0.5">
                                {Object.entries(item.selectedVariations)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' · ')}
                              </p>
                            )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.itemKey)}
                          aria-label="Remove item"
                          className="text-[#6E6D68] hover:text-[#D94E34] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Unit & Line Price */}
                      <div className="mt-1 flex items-baseline gap-2 font-mono-num text-xs">
                        <span className="font-semibold text-[#141413]">
                          {settings.currencySymbol}
                          {item.unitFinal.toLocaleString()}
                        </span>
                        {item.pricing.hasDiscount && (
                          <span className="text-[11px] text-[#8E8D87] line-through">
                            {settings.currencySymbol}
                            {item.unitOriginal.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper & Save for Later */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-[#141413]/20 bg-[#EAE9E4]/50">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.itemKey,
                                item.quantity - 1
                              )
                            }
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#141413] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono-num text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.itemKey,
                                item.quantity + 1
                              )
                            }
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#141413] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => moveToSavedForLater(item.itemKey)}
                          className="text-[11px] font-mono-num text-[#6E6D68] hover:text-[#141413] flex items-center gap-1 cursor-pointer"
                        >
                          <Bookmark className="w-3 h-3" />
                          <span>Save for later</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center space-y-3">
                  <p className="font-editorial text-2xl text-[#141413]">
                    Your Tech Sokoni bag is empty.
                  </p>
                  <p className="text-xs text-[#6E6D68]">
                    Explore our curated laptops, smartphones, monitors, and
                    accessories.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate({ page: 'category', categoryId: 'all' });
                    }}
                    className="mt-2 px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest cursor-pointer"
                  >
                    Explore Hardware
                  </button>
                </div>
              )}

              {/* Saved for Later Section */}
              {detailedSaved.length > 0 && (
                <div className="pt-6">
                  <p className="text-[11px] font-mono-num uppercase tracking-[0.18em] text-[#6E6D68] mb-3">
                    Saved for Later ({detailedSaved.length})
                  </p>
                  <div className="space-y-3">
                    {detailedSaved.map((saved) => (
                      <div
                        key={saved.productId}
                        className="p-3 bg-[#EAE9E4]/60 border border-[#141413]/10 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#141413] truncate">
                            {saved.product.name}
                          </p>
                          <p className="text-xs font-mono-num text-[#6E6D68]">
                            {settings.currencySymbol}
                            {saved.pricing.finalPrice.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              moveToCartFromSaved(saved.productId)
                            }
                            className="px-2.5 py-1 bg-[#141413] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider cursor-pointer"
                          >
                            Move to Bag
                          </button>
                          <button
                            onClick={() => removeFromSaved(saved.productId)}
                            aria-label="Remove saved item"
                            className="text-[#6E6D68] hover:text-[#D94E34] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Totals & Checkout CTA */}
            {detailedCart.length > 0 && (
              <div className="p-6 bg-[#EAE9E4]/80 border-t border-[#141413]/12 space-y-4">
                <div className="space-y-1.5 text-xs font-mono-num">
                  <div className="flex justify-between text-[#5E5D59]">
                    <span>Subtotal</span>
                    <span>
                      {settings.currencySymbol}
                      {subtotal.toLocaleString()}
                    </span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-[#1F6F43]">
                      <span>Active Offer Privilege</span>
                      <span>
                        −{settings.currencySymbol}
                        {discountTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5E5D59]">
                    <span>Courier Delivery</span>
                    <span className="text-[#1F6F43]">FREE</span>
                  </div>
                  <div className="pt-2 border-t border-[#141413]/10 flex justify-between text-base font-semibold text-[#141413]">
                    <span>Total (KSh)</span>
                    <span>
                      {settings.currencySymbol}
                      {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setConfirmedOrder(null);
                    setCheckoutStep(1);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SIMPLE MULTI-STEP MOBILE-FIRST CHECKOUT MODAL
         ===================================================================== */}
      {isCheckoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tech Sokoni Checkout"
          className="fixed inset-0 z-50 bg-[#141413]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-[#F4F3EF] border-t sm:border border-[#141413]/20 max-w-lg w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Top Header Bar */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-[#141413]/12 bg-[#F4F3EF] flex items-center justify-between shrink-0">
              <div>
                <p className="text-[11px] font-mono-num uppercase tracking-[0.18em] text-[#141413] font-semibold">
                  TECH SOKONI · EXPRESS CHECKOUT
                </p>
                <p className="text-[10px] font-mono-num text-[#6E6D68]">
                  Total: {settings.currencySymbol}
                  {total.toLocaleString()} · Free Delivery
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                aria-label="Close checkout"
                className="w-8 h-8 flex items-center justify-center border border-[#141413]/15 text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MULTI-STEP PROGRESS STEPPER (Hidden once order is confirmed) */}
            {!confirmedOrder && (
              <div className="px-4 sm:px-6 py-3 bg-[#EAE9E4]/80 border-b border-[#141413]/10 shrink-0">
                <div className="flex items-center justify-between">
                  {steps.map((s, idx) => {
                    const isCompleted = checkoutStep > s.num;
                    const isCurrent = checkoutStep === s.num;
                    return (
                      <React.Fragment key={s.num}>
                        <button
                          type="button"
                          onClick={() => {
                            if (s.num < checkoutStep) setCheckoutStep(s.num);
                          }}
                          className={`flex items-center gap-2 text-left ${
                            s.num < checkoutStep
                              ? 'cursor-pointer'
                              : 'cursor-default'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 flex items-center justify-center text-[11px] font-mono-num font-semibold transition-colors ${
                              isCompleted
                                ? 'bg-[#1F6F43] text-[#F4F3EF]'
                                : isCurrent
                                ? 'bg-[#141413] text-[#F4F3EF]'
                                : 'bg-[#F4F3EF] text-[#6E6D68] border border-[#141413]/20'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              s.num
                            )}
                          </span>
                          <span
                            className={`text-[11px] font-mono-num uppercase tracking-wider ${
                              isCurrent
                                ? 'text-[#141413] font-semibold'
                                : isCompleted
                                ? 'text-[#1F6F43] font-medium'
                                : 'text-[#6E6D68]'
                            }`}
                          >
                            {s.label}
                          </span>
                        </button>

                        {idx < steps.length - 1 && (
                          <div
                            className={`flex-1 h-[2px] mx-2 sm:mx-3 transition-colors ${
                              checkoutStep > s.num
                                ? 'bg-[#1F6F43]'
                                : 'bg-[#141413]/15'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
              {confirmedOrder ? (
                <div className="py-3 text-center space-y-4">
                  <CheckCircle2 className="w-11 h-11 text-[#1F6F43] mx-auto stroke-[1.6]" />
                  <div>
                    <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#1F6F43] font-semibold">
                      ORDER RECEIVED · {confirmedOrder.orderNumber}
                    </p>
                    <h3 className="font-editorial text-2xl sm:text-3xl text-[#141413] mt-1">
                      Thank you, {confirmedOrder.customerName}.
                    </h3>
                    <p className="text-xs text-[#5E5D59] mt-1 max-w-sm mx-auto">
                      Sent directly to the Tech Sokoni Admin Dashboard for
                      dispatch to {confirmedOrder.shippingAddress},{' '}
                      {confirmedOrder.city}.
                    </p>
                  </div>

                  <div className="bg-[#EAE9E4] border border-[#141413]/12 p-3.5 text-left text-xs font-mono-num space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#6E6D68]">Order Ref:</span>
                      <span className="font-semibold text-[#141413]">
                        {confirmedOrder.orderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6D68]">Payment:</span>
                      <span className="font-semibold text-[#141413]">
                        {confirmedOrder.paymentMethod}
                      </span>
                    </div>
                    {confirmedOrder.mpesaCode && (
                      <div className="flex justify-between text-[#1F6F43]">
                        <span>M-Pesa Code:</span>
                        <span className="font-semibold">
                          {confirmedOrder.mpesaCode}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-[#141413]/10 text-sm font-semibold text-[#141413]">
                      <span>Total (KSh):</span>
                      <span>
                        {settings.currencySymbol}
                        {confirmedOrder.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Allow submitting M-Pesa confirmation SMS/code right on confirmation if not provided yet */}
                  {confirmedOrder.paymentMethod === 'M-Pesa Express' &&
                    !confirmedOrder.mpesaCode &&
                    !postOrderMpesaSent && (
                      <form
                        onSubmit={handlePostOrderMpesaSubmit}
                        className="p-3.5 bg-[#1F6F43]/10 border border-[#1F6F43]/30 text-left space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <MpesaBrandIcon className="w-6 h-6 shrink-0" />
                          <p className="text-[11px] font-mono-num font-semibold text-[#141413]">
                            Paid to Till 9309020? Paste M-Pesa Code / SMS:
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={postOrderMpesaInput}
                            onChange={(e) =>
                              setPostOrderMpesaInput(e.target.value)
                            }
                            placeholder="e.g. SHK8492M1P or full M-Pesa SMS"
                            className="flex-1 bg-[#F4F3EF] border border-[#141413]/20 px-3 py-2 text-xs text-[#141413]"
                          />
                          <button
                            type="submit"
                            className="px-3.5 py-2 bg-[#1F6F43] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send</span>
                          </button>
                        </div>
                      </form>
                    )}

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        downloadOrderReceiptPdf(confirmedOrder, settings)
                      }
                      className="flex-1 py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest hover:bg-[#2B2B28] cursor-pointer"
                    >
                      Download Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setConfirmedOrder(null);
                        navigate({ page: 'client-portal', tab: 'history' });
                      }}
                      className="flex-1 py-3 border border-[#141413] text-[#141413] text-xs font-mono-num uppercase tracking-widest hover:bg-[#141413] hover:text-[#F4F3EF] cursor-pointer"
                    >
                      Live Order Tracking
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  {/* =========================================================
                      STEP 1: SIMPLE DELIVERY DETAILS
                     ========================================================= */}
                  {checkoutStep === 1 && (
                    <div className="space-y-3.5">
                      <p className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-semibold">
                        Step 1 · Where should we deliver?
                      </p>

                      <div>
                        <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Brian Kiprop"
                          className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                          M-Pesa / Contact Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. 0792 620 789"
                          className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                            Building / Street / Pickup *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="e.g. Delta Corner, Westlands"
                            className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-1">
                            Town / County *
                          </label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Nairobi"
                            className="w-full bg-[#EAE9E4]/60 border border-[#141413]/20 px-3.5 py-2.5 text-xs text-[#141413]"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full py-3.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Continue to Payment</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      STEP 2: PAYMENT METHOD & HIGHLIGHTED M-PESA INSTRUCTIONS
                     ========================================================= */}
                  {checkoutStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-semibold">
                        Step 2 · Choose Payment Method
                      </p>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Option 1: M-Pesa Express */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('M-Pesa Express')}
                          className={`p-3 border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            paymentMethod === 'M-Pesa Express'
                              ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                              : 'bg-[#EAE9E4]/60 text-[#141413] border-[#141413]/20'
                          }`}
                        >
                          <MpesaBrandIcon className="w-8 h-8 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-mono-num font-semibold uppercase">
                              M-Pesa
                            </p>
                            <p
                              className={`text-[10px] font-mono-num truncate ${
                                paymentMethod === 'M-Pesa Express'
                                  ? 'text-[#36B37E]'
                                  : 'text-[#1F6F43]'
                              }`}
                            >
                              Till 9309020
                            </p>
                          </div>
                        </button>

                        {/* Option 2: Payment on Delivery */}
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentMethod('Payment on Delivery')
                          }
                          className={`p-3 border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            paymentMethod === 'Payment on Delivery'
                              ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                              : 'bg-[#EAE9E4]/60 text-[#141413] border-[#141413]/20'
                          }`}
                        >
                          <div className="w-8 h-8 bg-[#EAE9E4] text-[#141413] flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-mono-num font-semibold uppercase">
                              On Delivery
                            </p>
                            <p
                              className={`text-[10px] font-mono-num truncate ${
                                paymentMethod === 'Payment on Delivery'
                                  ? 'text-[#F4F3EF]/75'
                                  : 'text-[#6E6D68]'
                              }`}
                            >
                              Inspect First
                            </p>
                          </div>
                        </button>
                      </div>

                      {/* Highlighted Branded M-Pesa Instructions Card */}
                      {paymentMethod === 'M-Pesa Express' ? (
                        <div className="p-4 bg-[#1F6F43]/10 border-2 border-[#1F6F43] space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <MpesaBrandIcon className="w-9 h-9 shrink-0" />
                              <div>
                                <span className="text-[10px] font-mono-num uppercase tracking-widest text-[#1F6F43] font-bold block">
                                  LIPA NA M-PESA · BUY GOODS
                                </span>
                                <span className="text-sm font-mono-num font-bold text-[#141413]">
                                  Till Number: 9309020
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyTill}
                              className="px-2.5 py-1.5 bg-[#1F6F43] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              {copiedTill ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Till</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="bg-[#F4F3EF] p-3 border border-[#1F6F43]/25 text-xs space-y-1 font-mono-num text-[#141413]">
                            <p>
                              1. Open <strong>M-Pesa</strong> →{' '}
                              <strong>Lipa Na M-Pesa</strong> →{' '}
                              <strong>Buy Goods</strong>
                            </p>
                            <p>
                              2. Enter Till No: <strong>9309020</strong> (Tech
                              Sokoni Kenya)
                            </p>
                            <p>
                              3. Amount:{' '}
                              <strong className="text-[#1F6F43]">
                                {settings.currencySymbol}
                                {total.toLocaleString()}
                              </strong>
                            </p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono-num uppercase tracking-wider text-[#141413] font-semibold mb-1">
                              M-Pesa Code or Confirmation SMS (Sent to Admin)
                            </label>
                            <input
                              type="text"
                              value={mpesaInput}
                              onChange={(e) => setMpesaInput(e.target.value)}
                              placeholder="Paste M-Pesa code (e.g. SHK8492M1P) or full SMS..."
                              className="w-full bg-[#F4F3EF] border border-[#1F6F43]/40 px-3 py-2 text-xs text-[#141413] font-mono-num"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-[#EAE9E4] border border-[#141413]/15 flex items-start gap-3">
                          <ShieldCheck className="w-5 h-5 text-[#1F6F43] shrink-0 mt-0.5" />
                          <div className="text-xs text-[#141413] space-y-1">
                            <p className="font-semibold">
                              Pay on Delivery (Inspect Package First)
                            </p>
                            <p className="text-[#5E5D59]">
                              Inspect your hardware upon arrival before paying{' '}
                              <strong className="text-[#141413] font-mono-num">
                                {settings.currencySymbol}
                                {total.toLocaleString()}
                              </strong>{' '}
                              via M-Pesa or Cash to our courier.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setCheckoutStep(1)}
                          className="px-4 py-3 border border-[#141413]/25 text-xs font-mono-num uppercase tracking-wider text-[#141413] flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="flex-1 py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Review Order</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      STEP 3: SIMPLE REVIEW & PLACE ORDER
                     ========================================================= */}
                  {checkoutStep === 3 && (
                    <div className="space-y-4">
                      <p className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-semibold">
                        Step 3 · Confirm & Dispatch
                      </p>

                      <div className="bg-[#EAE9E4]/80 border border-[#141413]/12 p-3.5 space-y-2.5 text-xs">
                        <div className="flex justify-between items-start gap-2 pb-2 border-b border-[#141413]/10">
                          <div>
                            <p className="text-[10px] font-mono-num uppercase text-[#6E6D68]">
                              Deliver To
                            </p>
                            <p className="font-semibold text-[#141413]">
                              {customerName} · {customerPhone}
                            </p>
                            <p className="text-[#5E5D59]">
                              {shippingAddress}, {city}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCheckoutStep(1)}
                            className="text-[10px] font-mono-num uppercase underline text-[#141413] cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="flex justify-between items-center gap-2 pb-2 border-b border-[#141413]/10">
                          <div className="flex items-center gap-2">
                            {paymentMethod === 'M-Pesa Express' ? (
                              <MpesaBrandIcon className="w-6 h-6 shrink-0" />
                            ) : (
                              <Truck className="w-4 h-4 text-[#141413]" />
                            )}
                            <div>
                              <p className="font-semibold text-[#141413]">
                                {paymentMethod === 'M-Pesa Express'
                                  ? 'Lipa Na M-Pesa (Till 9309020)'
                                  : 'Payment on Delivery'}
                              </p>
                              {mpesaInput.trim() && (
                                <p className="text-[10px] font-mono-num text-[#1F6F43]">
                                  Ref: {extractMpesaCodeFromText(mpesaInput)}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCheckoutStep(2)}
                            className="text-[10px] font-mono-num uppercase underline text-[#141413] cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {detailedCart.map((c) => (
                            <div
                              key={c.itemKey}
                              className="flex justify-between font-mono-num text-[11px]"
                            >
                              <span className="truncate pr-2">
                                {c.quantity}× {c.product.name}
                              </span>
                              <span className="font-semibold shrink-0">
                                {settings.currencySymbol}
                                {c.lineFinal.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-[#141413]/12 flex justify-between items-baseline font-mono-num">
                          <span className="text-xs uppercase text-[#6E6D68]">
                            Total (Free Delivery)
                          </span>
                          <span className="text-base font-bold text-[#141413]">
                            {settings.currencySymbol}
                            {total.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setCheckoutStep(2)}
                          className="px-4 py-3.5 border border-[#141413]/25 text-xs font-mono-num uppercase tracking-wider text-[#141413] flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3.5 bg-[#1F6F43] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.18em] hover:bg-[#185835] transition-colors cursor-pointer font-semibold"
                        >
                          Place Order ({settings.currencySymbol}
                          {total.toLocaleString()})
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
