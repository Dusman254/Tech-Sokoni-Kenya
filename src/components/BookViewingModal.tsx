import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  Copy,
  MessageCircle,
  Phone,
  ArrowLeft,
  ExternalLink,
  Info,
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

interface BookViewingProps {
  product?: Product | null;
  onClose?: () => void;
  standalonePage?: boolean;
}

export const BookViewingModal: React.FC<BookViewingProps> = ({
  product: propProduct,
}) => {
  const {
    products,
    bookingConfig,
    bookViewingTargetProduct,
    createViewingAppointment,
    getEffectiveViewingLocation,
    getAvailableSlotsForDate,
    isDateBlocked,
    settings,
    navigate,
    showToast,
    route,
  } = useStore();

  const activeProduct: Product | null = useMemo(() => {
    if (propProduct) return propProduct;
    if (bookViewingTargetProduct) return bookViewingTargetProduct;
    if (route.page === 'book-viewing' && route.productId) {
      const match = products.find((p) => p.id === route.productId);
      if (match) return match;
    }
    const firstLaptop = products.find(
      (p) =>
        p.category === 'laptops' ||
        p.name.toLowerCase().includes('laptop') ||
        p.name.toLowerCase().includes('macbook') ||
        p.name.toLowerCase().includes('thinkpad')
    );
    return firstLaptop || products[0] || null;
  }, [propProduct, bookViewingTargetProduct, route, products]);

  const effectiveLocation: ViewingLocation | null = activeProduct
    ? getEffectiveViewingLocation(activeProduct)
    : null;

  // Form State (No attendee counts or specific test checkboxes)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'phone'>('whatsapp');
  const [customerNotes, setCustomerNotes] = useState('');
  const [confirmedAttendance, setConfirmedAttendance] = useState(false);

  // Date and Time selection in Africa/Nairobi
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeProduct || !effectiveLocation) {
      setFormError('No laptop selected for viewing.');
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setFormError('Please enter your full name.');
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
        setFormError('Please enter a valid email address or leave it blank.');
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
        attendeeCount: 1, // Standard default
        preferredContact,
        customerNotes: customerNotes.trim() || undefined,
        viewingDate: selectedDate,
        viewingTimeSlot: selectedSlot,
        locationId: effectiveLocation.id,
        locationSnapshot: effectiveLocation,
      });

      if (!res.ok || !res.appointment) {
        setFormError(res.error || 'Failed to reserve viewing appointment. Please choose another time slot.');
        setIsSubmitting(false);
        return;
      }

      setConfirmedBooking(res.appointment);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFormError(err?.message || 'An unexpected error occurred while booking. Please try again.');
      setIsSubmitting(false);
    }
  };

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

  if (!activeProduct) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="font-editorial text-2xl text-[#141413]">No laptop selected</h2>
        <p className="text-xs text-[#6E6D68] mt-2">Please select a laptop from our catalog to book a viewing.</p>
        <button
          onClick={() => navigate({ page: 'category', categoryId: 'laptops' })}
          className="mt-4 px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase"
        >
          View Laptops
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (activeProduct) {
              navigate({ page: 'product', productId: activeProduct.id });
            } else {
              navigate({ page: 'category', categoryId: 'laptops' });
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-mono-num uppercase tracking-wider text-[#6E6D68] hover:text-[#141413] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product</span>
        </button>

        <span className="text-[11px] font-mono-num text-[#8E8D87]">
          Nairobi Showroom Viewing
        </span>
      </div>

      {confirmedBooking ? (
        /* =================================================================== */
        /* CLEAN BOOKING CONFIRMATION SCREEN                                   */
        /* =================================================================== */
        <div className="bg-[#F4F3EF] border border-[#141413]/15 p-6 sm:p-10 space-y-6">
          <div className="border-b border-[#141413]/10 pb-6">
            <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#C5A028] font-bold block mb-1">
              Appointment Reserved
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] font-editorial">
              Viewing Reference: {confirmedBooking.bookingReference}
            </h1>
            <p className="text-xs text-[#5E5D59] mt-2">
              Your laptop viewing appointment is registered on our showroom schedule.
              Our technicians will have the unit prepared for you. No advance payment is required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Laptop Unit Card */}
            <div className="bg-white border border-[#141413]/10 p-5 space-y-3">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                Reserved Laptop
              </span>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-[#EAE9E4] p-2 shrink-0 flex items-center justify-center">
                  <StudioImage
                    src={confirmedBooking.productImage}
                    alt={confirmedBooking.productName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#141413]">
                    {confirmedBooking.productName}
                  </h3>
                  <p className="text-xs font-mono-num text-[#6E6D68] mt-0.5">
                    SKU: {confirmedBooking.productSku}
                  </p>
                  <p className="text-sm font-bold font-mono-num text-[#141413] mt-2">
                    {settings.currencySymbol}
                    {confirmedBooking.productPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Viewing Date & Time Card */}
            <div className="bg-white border border-[#141413]/10 p-5 space-y-3">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                Appointment Schedule
              </span>
              <div className="space-y-2 text-xs">
                <p className="flex items-center gap-2 text-[#141413] font-medium">
                  <Calendar className="w-4 h-4 text-[#C5A028]" />
                  <span>{formatViewingDateDisplay(confirmedBooking.viewingDate)}</span>
                </p>
                <p className="flex items-center gap-2 text-[#5E5D59] font-mono-num">
                  <Clock className="w-4 h-4 text-[#C5A028]" />
                  <span>{confirmedBooking.viewingTimeSlot} (East Africa Time)</span>
                </p>
                <p className="flex items-start gap-2 text-[#5E5D59] pt-1">
                  <MapPin className="w-4 h-4 text-[#C5A028] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#141413]">{confirmedBooking.locationSnapshot.name}</strong>
                    <br />
                    {confirmedBooking.locationSnapshot.building}, {confirmedBooking.locationSnapshot.floor}
                    {confirmedBooking.locationSnapshot.room ? ` · ${confirmedBooking.locationSnapshot.room}` : ''}
                    <br />
                    {confirmedBooking.locationSnapshot.address}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Showroom Directions */}
          <div className="bg-[#EAE9E4]/60 border border-[#141413]/10 p-4 text-xs text-[#5E5D59] space-y-1">
            <p className="font-semibold text-[#141413]">Showroom Visitor Instructions:</p>
            <p>{confirmedBooking.locationSnapshot.visitorInstructions}</p>
            {confirmedBooking.locationSnapshot.mapsUrl && (
              <p className="pt-1">
                <a
                  href={confirmedBooking.locationSnapshot.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#141413] font-semibold hover:underline"
                >
                  <span>Open Directions in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
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
              className="w-full sm:flex-1 py-3 px-5 bg-[#1F6F43] hover:bg-[#185835] text-white text-xs font-mono-num uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm on WhatsApp</span>
            </a>

            <button
              onClick={handleCopyReference}
              className="w-full sm:w-auto py-3 px-5 bg-white border border-[#141413]/20 hover:border-[#141413] text-[#141413] text-xs font-mono-num uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {copiedRef ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Details</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate({ page: 'category', categoryId: 'laptops' })}
              className="w-full sm:w-auto py-3 px-5 bg-[#141413] hover:bg-[#2B2B28] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider cursor-pointer transition-colors"
            >
              Browse Laptops
            </button>
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /* CLEAN BOOKING FORM (STANDALONE PAGE)                                */
        /* =================================================================== */
        <div className="space-y-8">
          <div>
            <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#C5A028] font-bold block mb-1">
              Physical Showroom Viewing
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-[#141413]">
              Book to View in Nairobi
            </h1>
            <p className="text-xs text-[#5E5D59] mt-2 max-w-2xl leading-relaxed">
              Inspect the laptop, verify specifications, test the keyboard and display in person at our
              Kenyatta Avenue showroom. Zero advance payment required — purchase only if you are completely satisfied.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Selected Laptop & Location Details (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Laptop Card */}
              <div className="bg-white border border-[#141413]/15 p-5 space-y-4">
                <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                  Selected Laptop
                </span>

                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 bg-[#EAE9E4] p-2 shrink-0 flex items-center justify-center">
                    <StudioImage
                      src={activeProduct.images[0]}
                      alt={activeProduct.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono-num text-[#8E8D87] uppercase">
                      {activeProduct.brand} · {activeProduct.condition}
                    </p>
                    <h3 className="text-sm font-semibold text-[#141413] leading-snug">
                      {activeProduct.name}
                    </h3>
                    <p className="text-xs font-mono-num text-[#6E6D68] mt-1">
                      SKU: {activeProduct.sku}
                    </p>
                    <p className="text-base font-bold font-mono-num text-[#141413] mt-2">
                      {settings.currencySymbol}
                      {activeProduct.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#141413]/10 pt-3 text-xs text-[#5E5D59]">
                  <p className="line-clamp-2">{activeProduct.shortSpec}</p>
                </div>
              </div>

              {/* Viewing Location Information */}
              {effectiveLocation && (
                <div className="bg-white border border-[#141413]/15 p-5 space-y-3">
                  <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                    Designated Viewing Point
                  </span>

                  <div>
                    <h4 className="text-sm font-semibold text-[#141413]">
                      {effectiveLocation.name}
                    </h4>
                    <p className="text-xs text-[#5E5D59] mt-1 leading-relaxed">
                      {effectiveLocation.building}, Floor {effectiveLocation.floor}
                      {effectiveLocation.room ? ` · ${effectiveLocation.room}` : ''}
                      <br />
                      {effectiveLocation.address}
                    </p>
                  </div>

                  <p className="text-xs text-[#6E6D68] pt-1">
                    {effectiveLocation.visitorInstructions}
                  </p>

                  {effectiveLocation.mapsUrl && (
                    <a
                      href={effectiveLocation.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#141413] font-semibold hover:underline pt-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#C5A028]" />
                      <span>Google Maps Location</span>
                      <ExternalLink className="w-3 h-3 text-[#6E6D68]" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Reservation Form (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#141413]/15 p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs leading-relaxed">
                    {formError}
                  </div>
                )}

                {/* 1. Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-bold border-b border-[#141413]/10 pb-2">
                    1. Your Contact Details
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Mwangi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-11 px-3.5 text-xs bg-[#F4F3EF] border border-[#141413]/20 focus:border-[#141413] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1">
                        Kenyan Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0712 345 678 or 0110 123 456"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs font-mono-num bg-[#F4F3EF] border border-[#141413]/20 focus:border-[#141413] focus:outline-none"
                      />
                      <span className="text-[10px] text-[#6E6D68] mt-1 block">
                        We send your appointment confirmation via SMS or WhatsApp
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="david@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs bg-[#F4F3EF] border border-[#141413]/20 focus:border-[#141413] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1.5">
                      Preferred Contact Channel:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`p-3 border flex items-center justify-center gap-2 cursor-pointer text-xs font-mono-num transition-colors ${
                          preferredContact === 'whatsapp'
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                            : 'bg-[#F4F3EF] text-[#141413] border-[#141413]/15'
                        }`}
                      >
                        <input
                          type="radio"
                          name="contactMethod"
                          value="whatsapp"
                          checked={preferredContact === 'whatsapp'}
                          onChange={() => setPreferredContact('whatsapp')}
                          className="sr-only"
                        />
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </label>

                      <label
                        className={`p-3 border flex items-center justify-center gap-2 cursor-pointer text-xs font-mono-num transition-colors ${
                          preferredContact === 'phone'
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                            : 'bg-[#F4F3EF] text-[#141413] border-[#141413]/15'
                        }`}
                      >
                        <input
                          type="radio"
                          name="contactMethod"
                          value="phone"
                          checked={preferredContact === 'phone'}
                          onChange={() => setPreferredContact('phone')}
                          className="sr-only"
                        />
                        <Phone className="w-3.5 h-3.5" />
                        <span>Phone Call</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Viewing Date Selection */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-bold border-b border-[#141413]/10 pb-2">
                    2. Select Viewing Date (East Africa Time)
                  </h3>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {dateOptions.slice(0, 14).map((d) => (
                      <button
                        key={d.dateStr}
                        type="button"
                        disabled={d.blocked}
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`p-2.5 text-center border text-xs cursor-pointer transition-colors ${
                          selectedDate === d.dateStr
                            ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                            : d.blocked
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                            : 'bg-[#F4F3EF] text-[#141413] border-[#141413]/15 hover:border-[#141413]'
                        }`}
                      >
                        <span className="block font-mono-num text-[10px] uppercase text-[#6E6D68]">
                          {d.displayDay}
                        </span>
                        <span className="block font-bold text-xs mt-0.5">
                          {d.displayDate}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Viewing Time Slot Selection */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-[#141413]/10 pb-2">
                    <h3 className="text-xs font-mono-num uppercase tracking-wider text-[#141413] font-bold">
                      3. Select Time Slot
                    </h3>
                    <span className="text-[10px] font-mono-num text-[#6E6D68]">
                      Viewing duration: 30 mins
                    </span>
                  </div>

                  {availableSlots.length === 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 p-3 border border-amber-200">
                      No available appointment slots for this date. Please pick another date above.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 text-xs font-mono-num border transition-colors cursor-pointer ${
                            selectedSlot === slot
                              ? 'bg-[#C5A028] text-[#141413] border-[#B38F22] font-bold shadow-xs'
                              : 'bg-[#F4F3EF] text-[#141413] border-[#141413]/15 hover:border-[#141413]'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Optional Question / Note */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-medium text-[#141413]">
                    Optional Question or Note
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Any questions or specific things you would like us to check?"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full p-3 text-xs bg-[#F4F3EF] border border-[#141413]/20 focus:border-[#141413] focus:outline-none"
                  />
                </div>

                {/* 5. Physical Visit Confirmation Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#141413] leading-relaxed">
                    <input
                      type="checkbox"
                      required
                      checked={confirmedAttendance}
                      onChange={(e) => setConfirmedAttendance(e.target.checked)}
                      className="mt-0.5 accent-[#C5A028] w-4 h-4 shrink-0"
                    />
                    <span>
                      I confirm that I will visit{' '}
                      <strong>{effectiveLocation?.name || 'the Tech Sokoni Showroom'}</strong> on{' '}
                      <strong>{selectedDate ? formatViewingDateDisplay(selectedDate) : 'the selected date'}</strong> at{' '}
                      <strong>{selectedSlot || 'selected time'}</strong>.
                    </span>
                  </label>
                </div>

                {/* Submit CTA */}
                <div className="pt-4 border-t border-[#141413]/10 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedSlot}
                    className="w-full py-4 px-6 bg-[#C5A028] hover:bg-[#B38F22] text-[#141413] text-xs font-mono-num uppercase tracking-widest font-bold border border-[#B38F22] shadow-sm transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isSubmitting ? 'Reserving Viewing Slot...' : 'Confirm Viewing Reservation'}
                  </button>

                  <p className="text-[11px] text-[#6E6D68] text-center">
                    Zero advance payment required · Inspect laptop before deciding
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
