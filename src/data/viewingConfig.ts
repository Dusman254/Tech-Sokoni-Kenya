import { BookingConfig, ViewingLocation } from '../types/store';

export const DEFAULT_VIEWING_LOCATIONS: ViewingLocation[] = [
  {
    id: 'loc-nbi-cbd',
    name: 'Tech Sokoni Flagship Showroom',
    address: 'Kenyatta Avenue, Nairobi CBD, Kenya',
    building: 'Kenyatta Pioneer Building (Next to I&M Building)',
    floor: '5th Floor',
    room: 'Shop 514',
    mapsUrl: 'https://maps.google.com/?q=Kenyatta+Pioneer+Building+Nairobi',
    phone: '+254 792 620 789',
    whatsapp: '+254 792 620 789',
    visitorInstructions:
      'Take the passenger lifts to Floor 5, turn right down the boutique gallery corridor to Shop 514. Inform our showroom concierge of your booking reference.',
    active: true,
  },
  {
    id: 'loc-westlands',
    name: 'Tech Sokoni Westlands Inspection Point',
    address: 'Waiyaki Way & Mpaka Road Junction, Westlands, Nairobi',
    building: 'The Mirage Tower 2',
    floor: '3rd Floor',
    room: 'Suite 308',
    mapsUrl: 'https://maps.google.com/?q=The+Mirage+Waiyaki+Way+Nairobi',
    phone: '+254 792 620 789',
    whatsapp: '+254 792 620 789',
    visitorInstructions:
      'Visitor parking available in basement B1. Security will guide you to Tower 2 elevators, 3rd floor executive lounge.',
    active: true,
  },
];

export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  enabled: true,
  appointmentDurationMinutes: 30,
  startHour: 9, // 9:00 AM
  endHour: 18, // 6:00 PM (last slot 5:30 PM)
  workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  maxAdvanceDays: 14,
  minNoticeHours: 2,
  maxConcurrentPerSlot: 2,
  blockedDates: [],
  blockedSlots: [],
  defaultLocationId: 'loc-nbi-cbd',
  requireApproval: false, // Confirmed on creation if slot is open
};

/**
 * Validates a Kenyan mobile telephone number.
 * Accepts formats:
 *  - 07XXXXXXXX or 01XXXXXXXX
 *  - 2547XXXXXXXX or 2541XXXXXXXX
 *  - +2547XXXXXXXX or +2541XXXXXXXX
 */
export function isValidKenyanPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  // 07xx or 01xx (10 digits)
  if (/^0[17]\d{8}$/.test(clean)) return true;
  // 2547xx or 2541xx (12 digits)
  if (/^254[17]\d{8}$/.test(clean)) return true;
  // +2547xx or +2541xx (13 chars)
  if (/^\+254[17]\d{8}$/.test(clean)) return true;
  return false;
}

/**
 * Normalizes a Kenyan phone number into standard international display format: +254 7XX XXX XXX
 */
export function normalizeKenyanPhone(phone: string): string {
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  if (/^0([17]\d{8})$/.test(clean)) {
    const match = clean.match(/^0([17]\d{2})(\d{3})(\d{3})$/);
    if (match) return `+254 ${match[1]} ${match[2]} ${match[3]}`;
    return `+254 ${clean.slice(1)}`;
  }
  if (/^254([17]\d{8})$/.test(clean)) {
    const match = clean.match(/^254([17]\d{2})(\d{3})(\d{3})$/);
    if (match) return `+254 ${match[1]} ${match[2]} ${match[3]}`;
    return `+${clean}`;
  }
  if (/^\+254([17]\d{8})$/.test(clean)) {
    const match = clean.match(/^\+254([17]\d{2})(\d{3})(\d{3})$/);
    if (match) return `+254 ${match[1]} ${match[2]} ${match[3]}`;
    return clean;
  }
  return phone.trim();
}

/**
 * Generates an East Africa Time (Africa/Nairobi) date string (YYYY-MM-DD) for an offset from today.
 */
export function getNairobiDateString(offsetDays = 0): string {
  const now = new Date();
  // Nairobi is UTC+3
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const nairobiTime = new Date(utc + 3600000 * 3);
  nairobiTime.setDate(nairobiTime.getDate() + offsetDays);

  const year = nairobiTime.getFullYear();
  const month = String(nairobiTime.getMonth() + 1).padStart(2, '0');
  const day = String(nairobiTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current Nairobi hour and minute as decimal for minimum notice checking.
 */
export function getCurrentNairobiTime(): { hour: number; minute: number; dateStr: string } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const nairobiTime = new Date(utc + 3600000 * 3);

  const year = nairobiTime.getFullYear();
  const month = String(nairobiTime.getMonth() + 1).padStart(2, '0');
  const day = String(nairobiTime.getDate()).padStart(2, '0');

  return {
    hour: nairobiTime.getHours(),
    minute: nairobiTime.getMinutes(),
    dateStr: `${year}-${month}-${day}`,
  };
}

/**
 * Generates available daily appointment time slots (e.g., 09:00 AM, 09:30 AM ... 05:30 PM).
 */
export function generateDayTimeSlots(
  startHour = 9,
  endHour = 18,
  durationMinutes = 30
): string[] {
  const slots: string[] = [];
  const totalMinutesStart = startHour * 60;
  const totalMinutesEnd = endHour * 60;

  for (let m = totalMinutesStart; m < totalMinutesEnd; m += durationMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = String(min).padStart(2, '0');
    slots.push(`${displayH}:${displayM} ${period}`);
  }
  return slots;
}

/**
 * Converts a slot string like "10:30 AM" into minutes from midnight for chronological comparison.
 */
export function parseSlotToMinutes(slotStr: string): number {
  const match = slotStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

/**
 * Formats a YYYY-MM-DD date into a warm, readable Nairobi appointment header: "Thursday, Oct 24, 2026"
 */
export function formatViewingDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Constructs the WhatsApp pre-filled booking message URL strictly compliant with specification:
 * “Hello Tech Sokoni, I have booked a viewing for [Laptop Model]. My booking reference is [Reference]. My preferred appointment is [Date] at [Time]. Please confirm my appointment.”
 */
export function buildBookingWhatsAppUrl(params: {
  productName: string;
  bookingReference: string;
  viewingDate: string;
  viewingTimeSlot: string;
  whatsappNumber?: string;
  locationName?: string;
}): string {
  const phone = (params.whatsappNumber || '+254792620789').replace(/\D/g, '');
  const formattedDate = formatViewingDateDisplay(params.viewingDate);
  const text = `Hello Tech Sokoni, I have booked a viewing for ${params.productName}. My booking reference is ${params.bookingReference}. My preferred appointment is ${formattedDate} at ${params.viewingTimeSlot}. Please confirm my appointment.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export const INITIAL_VIEWING_APPOINTMENTS: import('../types/store').ViewingAppointment[] = [
  {
    id: 'viewing-tsv-2026-0001',
    bookingReference: 'TSV-2026-0001',
    productId: 'prod-thinkpad-x1-carbon-gen11',
    productName: 'Lenovo ThinkPad X1 Carbon Gen 11',
    productBrand: 'Lenovo',
    productSku: 'LN-X1C11-1370P',
    productImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80',
    productPrice: 245000,
    productCondition: 'New',
    productShortSpec: 'Core i7-1370P · 32GB LPDDR5 · 1TB NVMe · 14" 2.8K OLED 400-nit · 1.12kg',
    customerName: 'Brian Mwangi',
    customerPhone: '+254 722 410 932',
    customerEmail: 'brian.mwangi@techfirm.co.ke',
    attendeeCount: 1,
    preferredContact: 'whatsapp',
    customerNotes: 'I want to physically test keyboard travel, trackpoint sensitivity, and verify the OLED display for color grading.',
    viewingDate: getNairobiDateString(1),
    viewingTimeSlot: '11:00 AM',
    locationId: 'loc-nbi-cbd',
    locationSnapshot: DEFAULT_VIEWING_LOCATIONS[0],
    status: 'Confirmed',
    internalNotes: 'Client verified on WhatsApp. Unit pre-staged in Pioneer Shop 514 inspection booth.',
    assignedStaff: 'Kevin Oduor (Showroom Lead)',
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        action: 'Booking Created',
        newStatus: 'Pending Confirmation',
        actor: 'customer',
        note: 'Customer submitted appointment online.',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        action: 'Appointment Confirmed',
        previousStatus: 'Pending Confirmation',
        newStatus: 'Confirmed',
        actor: 'Kevin Oduor',
        note: 'Slot confirmed and laptop pre-staged in Showroom booth.',
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'viewing-tsv-2026-0002',
    bookingReference: 'TSV-2026-0002',
    productId: 'prod-macbook-pro-16-m3-max',
    productName: 'Apple MacBook Pro 16" M3 Max',
    productBrand: 'Apple',
    productSku: 'AP-MBP16-M3MAX',
    productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    productPrice: 485000,
    productCondition: 'New',
    productShortSpec: 'M3 Max 16-Core CPU / 40-Core GPU · 64GB Unified · 1TB SSD · Space Black',
    customerName: 'Amina Hassan',
    customerPhone: '+254 711 890 234',
    customerEmail: 'amina.hassan@studio.or.ke',
    attendeeCount: 2,
    preferredContact: 'phone',
    customerNotes: 'Need to inspect Space Black finish, battery cycle count, and official Apple 1-Year warranty activation.',
    viewingDate: getNairobiDateString(2),
    viewingTimeSlot: '02:30 PM',
    locationId: 'loc-nbi-cbd',
    locationSnapshot: DEFAULT_VIEWING_LOCATIONS[0],
    status: 'Pending Confirmation',
    internalNotes: 'Customer requested phone call prior to visiting.',
    assignedStaff: 'Grace Wanjiku',
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        action: 'Booking Created',
        newStatus: 'Pending Confirmation',
        actor: 'customer',
        note: 'Customer submitted appointment online.',
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];
