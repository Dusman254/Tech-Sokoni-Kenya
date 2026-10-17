import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  Copy,
  MessageCircle,
  Phone,
  ShieldCheck,
  X,
  AlertCircle,
  ExternalLink,
  Users,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ViewingAppointment, ViewingLocation } from '../types/store';
import {
  isValidKenyanPhone,
  normalizeKenyanPhone,
  formatViewingDateDisplay,
  buildBookingWhatsAppUrl,
  getNairobiDateString,
  getCurrentNairobiTime,
} from '../data/viewingConfig';
import { StudioImage } from './StudioImage';
import { analyticsService } from '../services/analyticsService';

interface BookViewingModalProps {
  product?: Product | null;
  onClose?: () => void;
  standalonePage?: boolean;
}

export const BookViewingModal: React.FC<BookViewingModalProps> = ({
  product: propProduct,
  onClose: propOnClose,
  standalonePage = false,
}) => {
  const {
    products,
    bookingConfig,
    isBookViewingModalOpen,
    bookViewingTargetProduct,
    closeBookViewingModal,
    createViewingAppointment,
    getEffectiveViewingLocation,
    getAvailableSlotsForDate,
    isDateBlocked,
    settings,
    navigate,
    showToast,
  } = useStore();

  const activeProduct: Product | null =
    propProduct || bookViewingTargetProduct || (products.length > 0 ? products[0] : null);

  const effectiveLocation: ViewingLocation | null = activeProduct
    ? getEffectiveViewingLocation(activeProduct)
    : null;

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [attendeeCount, setAttendeeCount] = useState<number>(1);
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'phone'>('whatsapp');
  const [customerNotes, setCustomerNotes] = useState('');
  const [confirmedAttendance, setConfirmedAttendance] = useState(false);

  // Date and Time selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ViewingAppointment | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Generate 14-day date options starting today in Africa/Nairobi
  const dateOptions = useMemo(() => {
    const dates: Array<{
      dateStr: string;
      displayDay: string;
      displayDate: string;
      isToday: boolean;
      blocked: boolean;
    }> = [];

    const currentTime = getCurrentNairobiTime();

    for (let i = 0; i < (bookingConfig.maxAdvanceDays || 14); i++) {
      const dateStr = getNairobiDateString(i);
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const isBlocked = isDateBlocked(dateStr);

      dates.push({
        dateStr,
        displayDay: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-KE', { weekday: 'short' }),
        displayDate: d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
        isToday: i === 0,
        blocked: isBlocked,
      });
    }
    return dates;
  }, [bookingConfig, isDateBlocked]);

  // Set default date when dates are ready
  useEffect(() => {
    if (!selectedDate && dateOptions.length > 0) {
      const firstAvailable = dateOptions.find((d) => !d.blocked);
      if (firstAvailable) {
        setSelectedDate(firstAvailable.dateStr);
      }
    }
  }, [dateOptions, selectedDate]);

  // Available slots for currently selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate || !effectiveLocation) return [];
    return getAvailableSlotsForDate(selectedDate, effectiveLocation.id);
  }, [selectedDate, effectiveLocation, getAvailableSlotsForDate]);

  // Reset or select default slot
  useEffect(() => {
    if (availableSlots.length > 0) {
      if (!availableSlots.includes(selectedSlot)) {
        setSelectedSlot(availableSlots[0]);
      }
    } else {
      setSelectedSlot('');
    }
  }, [availableSlots, selectedSlot]);

  // Handle modal closing
  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      closeBookViewingModal();
      if (standalonePage) {
        navigate({ page: 'home' });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeProduct || !effectiveLocation) {
      setFormError('No laptop selected for viewing.');
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setFormError('Please enter your full legal name (minimum 2 characters).');
      return;
    }

    if (!isValidKenyanPhone(customerPhone)) {
      setFormError(
        'Please enter a valid Kenyan phone number (e.g. 0712 345 678, 0110 123 456, or +254 7XX XXX XXX).'
      );
      return;
    }

    if (customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        setFormError('Please enter a valid email address or leave it empty.');
        return;
      }
    }

    if (!selectedDate) {
      setFormError('Please select a preferred viewing date.');
      return;
    }

    if (!selectedSlot) {
      setFormError('Please select an available viewing time slot in East Africa Time.');
      return;
    }

    if (!confirmedAttendance) {
      setFormError(
        `Please confirm that you will be able to visit ${effectiveLocation.name} in person.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createViewingAppointment({
        productId: activeProduct.id,
        productName: activeProduct.name,
        productBrand: activeProduct.brand,
        productSku: activeProduct.sku,
        productImage: activeProduct.images[0] || '',
        productPrice: activeProduct.price,
        productCondition: activeProduct.condition,
        productShortSpec: activeProduct.shortSpec,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        attendeeCount: Number(attendeeCount) || 1,
        preferredContact,
        customerNotes: customerNotes.trim() || undefined,
        viewingDate: selectedDate,
        viewingTimeSlot: selectedSlot,
        locationId: effectiveLocation.id,
        locationSnapshot: effectiveLocation,
      });

      if (!res.ok || !res.appointment) {
        setFormError(res.error || 'Failed to reserve viewing appointment. Please try another time.');
        setIsSubmitting(false);
        return;
      }

      setConfirmedBooking(res.appointment);
      setIsSubmitting(false);
    } catch (err: any) {
      setFormError(err?.message || 'An unexpected error occurred while booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Copy booking reference to clipboard
  const handleCopyReference = () => {
    if (!confirmedBooking) return;
    const textToCopy = `Tech Sokoni Viewing Appointment
Reference: ${confirmedBooking.bookingReference}
Laptop: ${confirmedBooking.productName}
Date: ${formatViewingDateDisplay(confirmedBooking.viewingDate)} at ${confirmedBooking.viewingTimeSlot} (EAT)
Location: ${confirmedBooking.locationSnapshot.name}, ${confirmedBooking.locationSnapshot.building}, ${confirmedBooking.locationSnapshot.floor}
Status: ${confirmedBooking.status}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedRef(true);
    showToast('Booking details copied to clipboard');
    setTimeout(() => setCopiedRef(false), 2500);
  };

  if (!standalonePage && !isBookViewingModalOpen && !propProduct) {
    return null;
  }

  if (!activeProduct) {
    return null;
  }

  return (
    <div
      className={
        standalonePage
          ? 'min-h-[80vh] py-8 px-4 sm:px-6 max-w-4xl mx-auto'
          : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#141413]/70 backdrop-blur-sm overflow-y-auto'
      }
    >
      <div
        className={`w-full max-w-3xl bg-[#F4F3EF] border border-[#141413]/20 shadow-2xl relative flex flex-col my-auto transition-all ${
          standalonePage ? 'border-2 border-[#141413]/15' : 'max-h-[92vh] overflow-y-auto'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-[#141413] text-[#F4F3EF] px-5 sm:px-7 py-4 flex items-center justify-between border-b border-[#C5A028]/30 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#C5A028] shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold tracking-wide uppercase font-mono-num text-[#F4F3EF]">
                Book Physical Laptop Viewing
              </h2>
              <p className="text-[11px] text-[#A6A5A0] hidden sm:block">
                Inspect, test & verify specs in person before purchase · Zero advance payment required
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close booking modal"
            className="w-8 h-8 flex items-center justify-center text-[#A6A5A0] hover:text-[#F4F3EF] hover:bg-[#2B2B28] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {confirmedBooking ? (
            /* ================================================================ */
            /* SUCCESS CONFIRMATION SCREEN                                      */
            /* ================================================================ */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Gold Ribbon Banner */}
              <div className="bg-[#C5A028]/15 border border-[#C5A028] p-4 sm:p-5 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#C5A028] text-[#141413] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#B38F22] font-semibold block">
                    Appointment Reserved Successfully
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#141413] mt-0.5">
                    Viewing Reference: {confirmedBooking.bookingReference}
                  </h3>
                  <p className="text-xs text-[#5E5D59] mt-1">
                    {confirmedBooking.status === 'Confirmed'
                      ? 'Your physical viewing is confirmed on our showroom schedule. Our technicians will pre-stage the laptop for your arrival.'
                      : 'Your appointment is pending manual verification. Our showroom concierge will confirm within 15 minutes.'}
                  </p>
                </div>
              </div>

              {/* Product & Appointment Snapshot Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Snapshot Card */}
                <div className="border border-[#141413]/15 bg-white p-4 space-y-3">
                  <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                    Reserved Laptop Unit
                  </span>
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#EAE9E4] p-1.5 shrink-0 flex items-center justify-center">
                      <StudioImage
                        src={confirmedBooking.productImage}
                        alt={confirmedBooking.productName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#141413] leading-snug truncate">
                        {confirmedBooking.productName}
                      </h4>
                      <p className="text-[11px] font-mono-num text-[#6E6D68] mt-0.5">
                        SKU: {confirmedBooking.productSku} · {confirmedBooking.productCondition}
                      </p>
                      <p className="text-sm font-bold font-mono-num text-[#141413] mt-1.5">
                        {settings.currencySymbol}
                        {confirmedBooking.productPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6E6D68] border-t border-[#141413]/8 pt-2 line-clamp-2">
                    {confirmedBooking.productShortSpec}
                  </p>
                </div>

                {/* Viewing Time & Location Card */}
                <div className="border border-[#141413]/15 bg-white p-4 space-y-3">
                  <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                    Date & Location Details
                  </span>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-[#C5A028] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#141413]">
                        {formatViewingDateDisplay(confirmedBooking.viewingDate)}
                      </p>
                      <p className="text-xs font-mono-num text-[#5E5D59]">
                        {confirmedBooking.viewingTimeSlot} (East Africa Time)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t border-[#141413]/8 pt-2.5">
                    <MapPin className="w-4 h-4 text-[#C5A028] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#5E5D59] space-y-0.5">
                      <p className="font-semibold text-[#141413]">
                        {confirmedBooking.locationSnapshot.name}
                      </p>
                      <p>{confirmedBooking.locationSnapshot.address}</p>
                      <p>
                        {confirmedBooking.locationSnapshot.building},{' '}
                        {confirmedBooking.locationSnapshot.floor}
                        {confirmedBooking.locationSnapshot.room
                          ? ` · ${confirmedBooking.locationSnapshot.room}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <a
                    href={confirmedBooking.locationSnapshot.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono-num uppercase tracking-wider text-[#141413] hover:underline font-semibold pt-1"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Visitor Instructions & Contact */}
              <div className="bg-[#EAE9E4]/60 border border-[#141413]/10 p-4 space-y-2 text-xs text-[#5E5D59]">
                <p className="font-semibold text-[#141413] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#C5A028]" />
                  <span>Showroom Instructions for Your Visit:</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  {confirmedBooking.locationSnapshot.visitorInstructions}
                </p>
                <div className="pt-2 border-t border-[#141413]/8 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span>Registered Name: <strong className="text-[#141413]">{confirmedBooking.customerName}</strong></span>
                  <span>Contact Phone: <strong className="text-[#141413]">{confirmedBooking.customerPhone}</strong></span>
                  <span>Attendees: <strong className="text-[#141413]">{confirmedBooking.attendeeCount}</strong></span>
                </div>
              </div>

              {/* Action Buttons: WhatsApp Concierge + Copy + Close */}
              <div className="space-y-2.5 pt-2">
                <a
                  href={buildBookingWhatsAppUrl({
                    productName: confirmedBooking.productName,
                    bookingReference: confirmedBooking.bookingReference,
                    viewingDate: confirmedBooking.viewingDate,
                    viewingTimeSlot: confirmedBooking.viewingTimeSlot,
                    whatsappNumber: confirmedBooking.locationSnapshot.whatsapp,
                    locationName: confirmedBooking.locationSnapshot.name,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-[#1F6F43] text-white hover:bg-[#185835] font-mono-num uppercase tracking-wider text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Chat on WhatsApp to Confirm Appointment</span>
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleCopyReference}
                    className="py-3 px-4 border border-[#141413]/30 bg-white hover:bg-[#EAE9E4] text-[#141413] font-mono-num uppercase tracking-wider text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedRef ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Booking Details</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClose}
                    className="py-3 px-4 bg-[#141413] text-[#F4F3EF] hover:bg-[#2B2B28] font-mono-num uppercase tracking-wider text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Back to Showroom</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* BOOKING FORM                                                     */
            /* ================================================================ */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Snapshot Header */}
              <div className="border border-[#141413]/15 bg-white p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#EAE9E4] p-1.5 shrink-0 flex items-center justify-center">
                  <StudioImage
                    src={activeProduct.images[0]}
                    alt={activeProduct.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono-num text-[#6E6D68]">
                    <span className="uppercase text-[#141413] font-semibold">{activeProduct.brand}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeProduct.condition}</span>
                    <span aria-hidden="true">·</span>
                    <span>SKU: {activeProduct.sku}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#141413] truncate mt-0.5">
                    {activeProduct.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm sm:text-base font-bold font-mono-num text-[#141413]">
                      {settings.currencySymbol}
                      {activeProduct.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#2B8A3E] font-medium font-mono-num">
                      · Zero advance payment required
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#5E5D59] bg-[#EAE9E4]/60 p-2.5 border border-[#141413]/10">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
                  <span>Inspect in person</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
                  <span>Test battery & screen</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
                  <span>No advance payment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
                  <span>Buy only if satisfied</span>
                </div>
              </div>

              {/* Step 1: Date Selection (Africa/Nairobi Time) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A028]" />
                    <span>1. Select Viewing Date (Africa / Nairobi)</span>
                  </label>
                  <span className="text-[10px] font-mono-num text-[#6E6D68]">EAT Time Zone</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {dateOptions.slice(0, 7).map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        type="button"
                        key={d.dateStr}
                        disabled={d.blocked}
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`p-2 sm:p-2.5 text-center border transition-all cursor-pointer ${
                          d.blocked
                            ? 'opacity-35 bg-[#EAE9E4] border-[#141413]/10 cursor-not-allowed text-[#8E8D87]'
                            : isSelected
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413] shadow-sm'
                            : 'bg-white text-[#141413] border-[#141413]/20 hover:border-[#C5A028]'
                        }`}
                      >
                        <span className="text-[10px] font-mono-num uppercase tracking-wider block opacity-75">
                          {d.displayDay}
                        </span>
                        <span className="text-xs font-bold font-mono-num block mt-0.5">
                          {d.displayDate}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Time Slot Selection (Live capacity in EAT) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C5A028]" />
                    <span>2. Select Appointment Time Slot</span>
                  </label>
                  <span className="text-[10px] font-mono-num text-[#2B8A3E] font-medium">
                    ● Real-Time Showroom Availability
                  </span>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      No available slots remaining for this date or showroom is closed. Please select
                      another date above.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 text-xs font-mono-num font-medium border text-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#C5A028] text-[#141413] border-[#B38F22] font-bold shadow-xs'
                              : 'bg-white text-[#141413] border-[#141413]/20 hover:border-[#141413]'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Customer Contact Information */}
              <div className="space-y-3 pt-2 border-t border-[#141413]/10">
                <label className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-semibold block">
                  3. Your Contact Details (No Account Required)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Kamau Mwangi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white border border-[#141413]/25 focus:border-[#C5A028] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Kenyan Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0712 345 678 or +254 7XX XXX XXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white border border-[#141413]/25 focus:border-[#C5A028] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white border border-[#141413]/25 focus:border-[#C5A028] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Preferred Contact Method
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreferredContact('whatsapp')}
                        className={`h-10 text-[11px] font-mono-num flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                          preferredContact === 'whatsapp'
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                            : 'bg-white text-[#141413] border-[#141413]/20 hover:border-[#141413]'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#C5A028]" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferredContact('phone')}
                        className={`h-10 text-[11px] font-mono-num flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                          preferredContact === 'phone'
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                            : 'bg-white text-[#141413] border-[#141413]/20 hover:border-[#141413]'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Attendees
                    </label>
                    <select
                      value={attendeeCount}
                      onChange={(e) => setAttendeeCount(Number(e.target.value))}
                      className="w-full h-10 px-3 text-xs bg-white border border-[#141413]/25 focus:border-[#C5A028] focus:outline-none font-mono-num"
                    >
                      <option value={1}>1 Person (Just Me)</option>
                      <option value={2}>2 People (+ Colleague / Friend)</option>
                      <option value={3}>3 People (Team)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                    Specific Test or Question for Showroom Staff (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Please verify Adobe Premiere render performance or battery cycle count"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-[#141413]/25 focus:border-[#C5A028] focus:outline-none"
                  />
                </div>
              </div>

              {/* Step 4: Viewing Location Confirmation */}
              {effectiveLocation && (
                <div className="bg-[#EAE9E4]/60 border border-[#141413]/15 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C5A028] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                        Designated Viewing Point
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#141413]">
                        {effectiveLocation.name}
                      </h4>
                      <p className="text-xs text-[#5E5D59] mt-0.5">
                        {effectiveLocation.address} · {effectiveLocation.building}, Floor{' '}
                        {effectiveLocation.floor}
                        {effectiveLocation.room ? `, ${effectiveLocation.room}` : ''}
                      </p>
                      <p className="text-[11px] text-[#6E6D68] mt-1.5 leading-relaxed">
                        {effectiveLocation.visitorInstructions}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Checkbox */}
                  <label className="flex items-start gap-2.5 pt-2 border-t border-[#141413]/10 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmedAttendance}
                      onChange={(e) => setConfirmedAttendance(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-none accent-[#C5A028] border-[#141413]/30 cursor-pointer"
                    />
                    <span className="text-xs text-[#141413] font-medium">
                      I confirm that I can physically visit{' '}
                      <strong>{effectiveLocation.name}</strong> on the selected date and time to
                      inspect this laptop.
                    </span>
                  </label>
                </div>
              )}

              {/* Error Message */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || availableSlots.length === 0}
                  className="w-full py-3.5 px-6 bg-[#C5A028] hover:bg-[#B38F22] text-[#141413] font-mono-num uppercase tracking-[0.16em] text-xs font-bold border border-[#B38F22] transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#141413] border-t-transparent animate-spin rounded-full" />
                      <span>Checking Availability & Securing Slot...</span>
                    </div>
                  ) : (
                    <>
                      <span>Confirm & Book Physical Viewing</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-[#6E6D68]">
                  Zero advance payment · Inspect first, decide later · Real-time Nairobi schedule
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
