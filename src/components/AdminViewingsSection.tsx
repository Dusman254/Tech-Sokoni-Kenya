import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  Search,
  Filter,
  Download,
  Phone,
  MessageCircle,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
  FileText,
  RotateCcw,
  Sparkles,
  Users,
  Settings,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  ViewingAppointment,
  ViewingBookingStatus,
  ViewingLocation,
  BookingConfig,
} from '../types/store';
import {
  formatViewingDateDisplay,
  buildBookingWhatsAppUrl,
  getNairobiDateString,
  generateDayTimeSlots,
  normalizeKenyanPhone,
} from '../data/viewingConfig';
import { StudioImage } from './StudioImage';

export const AdminViewingsSection: React.FC = () => {
  const {
    viewingAppointments,
    viewingLocations,
    bookingConfig,
    products,
    updateViewingAppointmentStatus,
    rescheduleViewingAppointment,
    addViewingInternalNote,
    assignViewingStaff,
    assignViewingLocation,
    updateViewingLocation,
    addViewingLocation,
    deleteViewingLocation,
    updateBookingConfig,
    getAvailableSlotsForDate,
    showToast,
  } = useStore();

  // Sub-tabs in Viewings section
  const [subTab, setSubTab] = useState<'appointments' | 'schedule' | 'locations' | 'config'>('appointments');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Selected appointment for detail drawer / modal
  const [selectedAppointment, setSelectedAppointment] = useState<ViewingAppointment | null>(null);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  // Cancel state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Internal note draft
  const [internalNoteDraft, setInternalNoteDraft] = useState('');

  // Staff assignment draft
  const [staffDraft, setStaffDraft] = useState('');

  // Location edit / create modal
  const [editingLocation, setEditingLocation] = useState<ViewingLocation | null>(null);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState<Omit<ViewingLocation, 'id'>>({
    name: '',
    address: '',
    building: '',
    floor: '',
    room: '',
    mapsUrl: '',
    phone: '+254 792 620 789',
    whatsapp: '+254 792 620 789',
    visitorInstructions: '',
    active: true,
  });

  // Daily Schedule view date selector
  const [scheduleDate, setScheduleDate] = useState<string>(() => getNairobiDateString(0));

  // Blocked date draft
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // Blocked slot draft
  const [newBlockedSlotDate, setNewBlockedSlotDate] = useState('');
  const [newBlockedSlotTime, setNewBlockedSlotTime] = useState('');
  const [newBlockedSlotReason, setNewBlockedSlotReason] = useState('');

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = viewingAppointments.length;
    const pending = viewingAppointments.filter((a) => a.status === 'Pending Confirmation').length;
    const confirmed = viewingAppointments.filter((a) => a.status === 'Confirmed').length;
    const rescheduleReq = viewingAppointments.filter((a) => a.status === 'Reschedule Requested').length;
    const completed = viewingAppointments.filter((a) => a.status === 'Completed').length;
    const cancelled = viewingAppointments.filter((a) => a.status === 'Cancelled').length;
    const noShow = viewingAppointments.filter((a) => a.status === 'No-show').length;

    return { total, pending, confirmed, rescheduleReq, completed, cancelled, noShow };
  }, [viewingAppointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return viewingAppointments.filter((a) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = a.bookingReference.toLowerCase().includes(q);
        const matchName = a.customerName.toLowerCase().includes(q);
        const matchPhone = a.customerPhone.toLowerCase().includes(q);
        const matchProduct = a.productName.toLowerCase().includes(q);
        const matchSku = a.productSku.toLowerCase().includes(q);
        if (!matchRef && !matchName && !matchPhone && !matchProduct && !matchSku) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && a.status !== statusFilter) {
        return false;
      }

      // Location
      if (locationFilter !== 'all' && a.locationId !== locationFilter) {
        return false;
      }

      // Date
      if (dateFilter && a.viewingDate !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [viewingAppointments, searchQuery, statusFilter, locationFilter, dateFilter]);

  // Available slots for rescheduling
  const rescheduleAvailableSlots = useMemo(() => {
    if (!rescheduleDate || !selectedAppointment) return [];
    return getAvailableSlotsForDate(
      rescheduleDate,
      selectedAppointment.locationId,
      selectedAppointment.id
    );
  }, [rescheduleDate, selectedAppointment, getAvailableSlotsForDate]);

  // Open detail modal and prep draft state
  const handleOpenDetail = (app: ViewingAppointment) => {
    setSelectedAppointment(app);
    setInternalNoteDraft(app.internalNotes || '');
    setStaffDraft(app.assignedStaff || '');
    setIsRescheduling(false);
    setIsCancelling(false);
    setRescheduleDate(app.viewingDate);
    setRescheduleSlot(app.viewingTimeSlot);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (viewingAppointments.length === 0) {
      showToast('No booking records to export');
      return;
    }

    const headers = [
      'Booking Reference',
      'Status',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Attendees',
      'Preferred Contact',
      'Viewing Date',
      'Time Slot (EAT)',
      'Viewing Location',
      'Laptop Name',
      'Laptop SKU',
      'Price (KES)',
      'Condition',
      'Assigned Staff',
      'Customer Notes',
      'Internal Notes',
      'Created At',
    ];

    const rows = viewingAppointments.map((a) => [
      `"${a.bookingReference}"`,
      `"${a.status}"`,
      `"${a.customerName.replace(/"/g, '""')}"`,
      `"${a.customerPhone}"`,
      `"${a.customerEmail || ''}"`,
      a.attendeeCount || 1,
      `"${a.preferredContact}"`,
      `"${a.viewingDate}"`,
      `"${a.viewingTimeSlot}"`,
      `"${(a.locationSnapshot?.name || a.locationId).replace(/"/g, '""')}"`,
      `"${a.productName.replace(/"/g, '""')}"`,
      `"${a.productSku}"`,
      a.productPrice,
      `"${a.productCondition}"`,
      `"${a.assignedStaff || ''}"`,
      `"${(a.customerNotes || '').replace(/"/g, '""')}"`,
      `"${(a.internalNotes || '').replace(/"/g, '""')}"`,
      `"${a.createdAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tech_sokoni_viewings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported viewing bookings to CSV');
  };

  // Save location form
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name.trim() || !locationForm.address.trim()) {
      showToast('Location name and address are required');
      return;
    }

    if (editingLocation) {
      updateViewingLocation(editingLocation.id, locationForm);
      setEditingLocation(null);
    } else {
      addViewingLocation(locationForm);
      setIsCreatingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Navigation */}
      <div className="bg-[#141413] text-[#F4F3EF] p-5 sm:p-6 border border-[#F4F3EF]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#C5A028]" />
            <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#C5A028] font-semibold">
              In-Person Showroom Concierge
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-editorial mt-1">
            Laptop Viewing Appointments
          </h2>
          <p className="text-xs text-[#A09F99] mt-0.5">
            Physical laptop testing, client inspections & showroom reservation control
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#2B2B28] p-1 border border-[#F4F3EF]/10">
          <button
            type="button"
            onClick={() => setSubTab('appointments')}
            className={`px-3 py-1.5 text-xs font-mono-num uppercase tracking-wider transition-colors cursor-pointer ${
              subTab === 'appointments'
                ? 'bg-[#F4F3EF] text-[#141413] font-semibold'
                : 'text-[#A09F99] hover:text-[#F4F3EF]'
            }`}
          >
            Appointments ({viewingAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('schedule')}
            className={`px-3 py-1.5 text-xs font-mono-num uppercase tracking-wider transition-colors cursor-pointer ${
              subTab === 'schedule'
                ? 'bg-[#F4F3EF] text-[#141413] font-semibold'
                : 'text-[#A09F99] hover:text-[#F4F3EF]'
            }`}
          >
            Daily Schedule
          </button>
          <button
            type="button"
            onClick={() => setSubTab('locations')}
            className={`px-3 py-1.5 text-xs font-mono-num uppercase tracking-wider transition-colors cursor-pointer ${
              subTab === 'locations'
                ? 'bg-[#F4F3EF] text-[#141413] font-semibold'
                : 'text-[#A09F99] hover:text-[#F4F3EF]'
            }`}
          >
            Viewing Locations ({viewingLocations.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('config')}
            className={`px-3 py-1.5 text-xs font-mono-num uppercase tracking-wider transition-colors cursor-pointer ${
              subTab === 'config'
                ? 'bg-[#F4F3EF] text-[#141413] font-semibold'
                : 'text-[#A09F99] hover:text-[#F4F3EF]'
            }`}
          >
            Booking Rules & Hours
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        <div className="bg-white p-3 border border-[#141413]/10">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block truncate">
            Total Bookings
          </span>
          <span className="text-xl font-bold font-mono-num text-[#141413]">
            {metrics.total}
          </span>
        </div>

        <div className="bg-amber-50 p-3 border border-amber-200">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-amber-700 block truncate">
            Pending Approval
          </span>
          <span className="text-xl font-bold font-mono-num text-amber-900">
            {metrics.pending}
          </span>
        </div>

        <div className="bg-emerald-50 p-3 border border-emerald-200">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-emerald-700 block truncate">
            Confirmed Slots
          </span>
          <span className="text-xl font-bold font-mono-num text-emerald-900">
            {metrics.confirmed}
          </span>
        </div>

        <div className="bg-blue-50 p-3 border border-blue-200">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-blue-700 block truncate">
            Reschedule Req.
          </span>
          <span className="text-xl font-bold font-mono-num text-blue-900">
            {metrics.rescheduleReq}
          </span>
        </div>

        <div className="bg-gray-50 p-3 border border-gray-200">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-gray-700 block truncate">
            Completed Visits
          </span>
          <span className="text-xl font-bold font-mono-num text-gray-900">
            {metrics.completed}
          </span>
        </div>

        <div className="bg-rose-50 p-3 border border-rose-200">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-rose-700 block truncate">
            Cancelled
          </span>
          <span className="text-xl font-bold font-mono-num text-rose-900">
            {metrics.cancelled}
          </span>
        </div>

        <div className="bg-orange-50 p-3 border border-orange-200">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-orange-700 block truncate">
            No-Shows
          </span>
          <span className="text-xl font-bold font-mono-num text-orange-900">
            {metrics.noShow}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: APPOINTMENTS LIST                                         */}
      {/* ==================================================================== */}
      {subTab === 'appointments' && (
        <div className="space-y-4">
          {/* Controls: Search, Filters & CSV Export */}
          <div className="bg-white p-4 border border-[#141413]/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#6E6D68] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reference, customer, phone, or laptop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 text-xs bg-[#F4F3EF] border border-[#141413]/15 focus:border-[#C5A028] focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-[#F4F3EF] border border-[#141413]/15 focus:border-[#C5A028] focus:outline-none font-mono-num"
              >
                <option value="all">All Statuses</option>
                <option value="Pending Confirmation">Pending Confirmation</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Reschedule Requested">Reschedule Requested</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No-show">No-show</option>
              </select>

              {/* Location Filter */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-[#F4F3EF] border border-[#141413]/15 focus:border-[#C5A028] focus:outline-none font-mono-num"
              >
                <option value="all">All Locations</option>
                {viewingLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              {/* Specific Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-[#F4F3EF] border border-[#141413]/15 focus:border-[#C5A028] focus:outline-none font-mono-num"
              />

              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-xs text-[#6E6D68] hover:text-[#141413] underline font-mono-num"
                >
                  Clear Date
                </button>
              )}
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="py-2.5 px-4 bg-[#141413] text-[#F4F3EF] hover:bg-[#2B2B28] text-xs font-mono-num uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Appointments Table / Cards */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white p-8 text-center border border-[#141413]/10 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-[#6E6D68]" />
              <p className="text-sm font-semibold text-[#141413]">No viewing appointments found</p>
              <p className="text-xs text-[#6E6D68]">
                {searchQuery || statusFilter !== 'all' || locationFilter !== 'all' || dateFilter
                  ? 'Try adjusting your search filters.'
                  : 'Appointments booked by customers will show up here.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#141413]/10 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[940px]">
                <thead>
                  <tr className="bg-[#EAE9E4]/60 border-b border-[#141413]/10 text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                    <th className="p-3 whitespace-nowrap">Reference / Status</th>
                    <th className="p-3 min-w-[160px]">Customer Contact</th>
                    <th className="p-3 min-w-[210px]">Reserved Laptop</th>
                    <th className="p-3 whitespace-nowrap">Date & Slot (EAT)</th>
                    <th className="p-3 min-w-[150px]">Viewing Point</th>
                    <th className="p-3 whitespace-nowrap">Staff</th>
                    <th className="p-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141413]/8 text-xs">
                  {filteredAppointments.map((app) => {
                    const statusClass =
                      app.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : app.status === 'Pending Confirmation'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : app.status === 'Reschedule Requested'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : app.status === 'Completed'
                        ? 'bg-gray-100 text-gray-800 border-gray-300'
                        : app.status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-orange-100 text-orange-800 border-orange-300';

                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-[#F4F3EF]/60 transition-colors cursor-pointer"
                        onClick={() => handleOpenDetail(app)}
                      >
                        {/* Reference & Status */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-mono-num font-bold text-[#141413] block">
                            {app.bookingReference}
                          </span>
                          <span
                            className={`inline-flex items-center mt-1 px-2 py-0.5 text-[10px] font-mono-num border whitespace-nowrap ${statusClass}`}
                          >
                            {app.status}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="p-3 min-w-[160px]">
                          <strong className="text-[#141413] block truncate max-w-[180px]">{app.customerName}</strong>
                          <span className="text-[11px] font-mono-num text-[#5E5D59] block whitespace-nowrap">
                            {app.customerPhone}
                          </span>
                          <span className="text-[10px] text-[#6E6D68] block whitespace-nowrap">
                            Via {app.preferredContact} · {app.attendeeCount} attendee
                          </span>
                        </td>

                        {/* Laptop Product */}
                        <td className="p-3 min-w-[210px] max-w-[260px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-[#EAE9E4] p-1 shrink-0 flex items-center justify-center">
                              <StudioImage
                                src={app.productImage}
                                alt={app.productName}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold text-[#141413] block truncate" title={app.productName}>
                                {app.productName}
                              </span>
                              <span className="text-[10px] font-mono-num text-[#6E6D68] block whitespace-nowrap">
                                SKU: {app.productSku}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Date & Slot */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-[#141413] block">
                            {formatViewingDateDisplay(app.viewingDate)}
                          </span>
                          <span className="text-[11px] font-mono-num text-[#5E5D59] block">
                            {app.viewingTimeSlot} (EAT)
                          </span>
                        </td>

                        {/* Location */}
                        <td className="p-3 min-w-[150px] max-w-[200px]">
                          <span className="text-xs font-medium text-[#141413] block truncate" title={app.locationSnapshot?.name || app.locationId}>
                            {app.locationSnapshot?.name || app.locationId}
                          </span>
                          <span className="text-[10px] text-[#6E6D68] block truncate" title={app.locationSnapshot?.building}>
                            {app.locationSnapshot?.building}
                          </span>
                        </td>

                        {/* Staff */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="text-xs text-[#5E5D59]">
                            {app.assignedStaff || 'Unassigned'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Button */}
                            <a
                              href={buildBookingWhatsAppUrl({
                                productName: app.productName,
                                bookingReference: app.bookingReference,
                                viewingDate: app.viewingDate,
                                viewingTimeSlot: app.viewingTimeSlot,
                                whatsappNumber: app.customerPhone,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat with customer on WhatsApp"
                              className="w-7 h-7 flex items-center justify-center bg-[#1F6F43] text-white hover:bg-[#185835] transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {/* View / Manage Drawer */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(app)}
                              className="px-2.5 py-1 bg-[#141413] text-[#F4F3EF] hover:bg-[#2B2B28] text-[10px] font-mono-num uppercase tracking-wider cursor-pointer whitespace-nowrap"
                            >
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: DAILY SCHEDULE VIEW                                       */}
      {/* ==================================================================== */}
      {subTab === 'schedule' && (
        <div className="bg-white p-5 border border-[#141413]/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#141413]/10">
            <div>
              <h3 className="text-sm font-semibold text-[#141413] font-mono-num uppercase tracking-wider">
                Showroom Schedule for {formatViewingDateDisplay(scheduleDate)}
              </h3>
              <p className="text-xs text-[#6E6D68]">
                Real-time inspection station reservations in Africa/Nairobi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScheduleDate(getNairobiDateString(0))}
                className={`px-3 py-1.5 text-xs font-mono-num border transition-colors ${
                  scheduleDate === getNairobiDateString(0)
                    ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                    : 'bg-[#F4F3EF] text-[#141413] border-[#141413]/15'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setScheduleDate(getNairobiDateString(1))}
                className={`px-3 py-1.5 text-xs font-mono-num border transition-colors ${
                  scheduleDate === getNairobiDateString(1)
                    ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                    : 'bg-[#F4F3EF] text-[#141413] border-[#141413]/15'
                }`}
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="h-9 px-2 text-xs bg-[#F4F3EF] border border-[#141413]/20 font-mono-num"
              />
            </div>
          </div>

          {/* Time Slots Grid */}
          <div className="space-y-3">
            {generateDayTimeSlots(
              bookingConfig.startHour,
              bookingConfig.endHour,
              bookingConfig.appointmentDurationMinutes
            ).map((slot) => {
              const slotBookings = viewingAppointments.filter(
                (a) =>
                  a.viewingDate === scheduleDate &&
                  a.viewingTimeSlot === slot &&
                  a.status !== 'Cancelled' &&
                  a.status !== 'No-show'
              );

              const isFull = slotBookings.length >= bookingConfig.maxConcurrentPerSlot;

              return (
                <div
                  key={slot}
                  className={`p-3 border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isFull
                      ? 'bg-amber-50/50 border-amber-200'
                      : slotBookings.length > 0
                      ? 'bg-blue-50/30 border-blue-200'
                      : 'bg-[#F4F3EF]/40 border-[#141413]/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-[260px] shrink-0 whitespace-nowrap">
                    <Clock className="w-4 h-4 text-[#C5A028] shrink-0" />
                    <span className="font-mono-num text-xs font-bold text-[#141413]">
                      {slot}
                    </span>
                    <span
                      className={`text-[10px] font-mono-num px-1.5 py-0.5 border shrink-0 ${
                        isFull
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : slotBookings.length > 0
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {slotBookings.length} / {bookingConfig.maxConcurrentPerSlot} Slots
                    </span>
                  </div>

                  {/* Booked laptops in this slot */}
                  <div className="flex-1 flex flex-wrap gap-2">
                    {slotBookings.length === 0 ? (
                      <span className="text-xs text-[#8E8D87] italic">Open slot</span>
                    ) : (
                      slotBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => handleOpenDetail(b)}
                          className="bg-white border border-[#141413]/15 p-2 flex items-center gap-2 cursor-pointer hover:border-[#141413] transition-colors"
                        >
                          <div className="w-6 h-6 bg-[#EAE9E4] p-0.5 shrink-0">
                            <StudioImage
                              src={b.productImage}
                              alt={b.productName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="text-[11px] leading-tight">
                            <span className="font-semibold text-[#141413] block truncate max-w-[150px]">
                              {b.customerName}
                            </span>
                            <span className="text-[10px] font-mono-num text-[#6E6D68]">
                              {b.productName} ({b.status})
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 3: VIEWING LOCATIONS CRUD                                    */}
      {/* ==================================================================== */}
      {subTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 border border-[#141413]/10">
            <div>
              <h3 className="text-sm font-semibold text-[#141413] font-mono-num uppercase tracking-wider">
                Configured Viewing Points & Partner Shops
              </h3>
              <p className="text-xs text-[#6E6D68]">
                Display verified addresses to customers before they submit viewing requests
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCreatingLocation(true);
                setEditingLocation(null);
                setLocationForm({
                  name: '',
                  address: '',
                  building: '',
                  floor: '',
                  room: '',
                  mapsUrl: '',
                  phone: '+254 792 620 789',
                  whatsapp: '+254 792 620 789',
                  visitorInstructions: '',
                  active: true,
                });
              }}
              className="py-2 px-3 bg-[#141413] text-[#F4F3EF] hover:bg-[#2B2B28] text-xs font-mono-num uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Location</span>
            </button>
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {viewingLocations.map((loc) => {
              const isDefault = loc.id === bookingConfig.defaultLocationId;
              return (
                <div
                  key={loc.id}
                  className={`p-4 bg-white border space-y-3 ${
                    isDefault ? 'border-[#C5A028] shadow-xs' : 'border-[#141413]/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#141413]">{loc.name}</h4>
                        {isDefault && (
                          <span className="px-1.5 py-0.5 bg-[#C5A028] text-[#141413] text-[9px] font-mono-num font-bold uppercase">
                            Default
                          </span>
                        )}
                        {!loc.active && (
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[9px] font-mono-num uppercase">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5E5D59] mt-0.5">{loc.address}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLocation(loc);
                          setLocationForm(loc);
                          setIsCreatingLocation(false);
                        }}
                        className="w-7 h-7 flex items-center justify-center border border-[#141413]/15 hover:border-[#141413] text-[#141413]"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {viewingLocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete location "${loc.name}"?`)) {
                              deleteViewingLocation(loc.id);
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center border border-red-200 hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-[#6E6D68] space-y-1 border-t border-[#141413]/8 pt-2">
                    <p>
                      Building: <strong className="text-[#141413]">{loc.building}</strong> · Floor:{' '}
                      <strong className="text-[#141413]">{loc.floor}</strong>
                      {loc.room ? ` · Room: ${loc.room}` : ''}
                    </p>
                    <p>
                      Phone: <span className="font-mono-num">{loc.phone}</span> · WhatsApp:{' '}
                      <span className="font-mono-num">{loc.whatsapp}</span>
                    </p>
                    <p className="line-clamp-2 italic text-[11px]">{loc.visitorInstructions}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#141413]/8 text-[11px] font-mono-num">
                    <a
                      href={loc.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#141413] hover:underline flex items-center gap-1"
                    >
                      <span>Google Maps URL</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => updateBookingConfig({ defaultLocationId: loc.id })}
                        className="text-[#C5A028] hover:underline cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add / Edit Location Modal Form */}
          {(isCreatingLocation || editingLocation) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-lg bg-white border border-[#141413]/20 shadow-xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#141413]/10">
                  <h3 className="text-sm font-bold font-mono-num uppercase tracking-wider text-[#141413]">
                    {editingLocation ? 'Edit Viewing Location' : 'Add New Viewing Location'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLocation(null);
                      setIsCreatingLocation(false);
                    }}
                    className="text-[#6E6D68] hover:text-[#141413]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveLocation} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Location Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tech Sokoni Westlands Inspection Point"
                      value={locationForm.name}
                      onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                      className="w-full h-9 px-3 border border-[#141413]/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Physical Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Waiyaki Way & Mpaka Road Junction, Nairobi"
                      value={locationForm.address}
                      onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                      className="w-full h-9 px-3 border border-[#141413]/20 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                        Building
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mirage Tower 2"
                        value={locationForm.building}
                        onChange={(e) =>
                          setLocationForm({ ...locationForm, building: e.target.value })
                        }
                        className="w-full h-9 px-3 border border-[#141413]/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                        Floor
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3rd Floor"
                        value={locationForm.floor}
                        onChange={(e) =>
                          setLocationForm({ ...locationForm, floor: e.target.value })
                        }
                        className="w-full h-9 px-3 border border-[#141413]/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                        Room / Suite
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Suite 308"
                        value={locationForm.room}
                        onChange={(e) =>
                          setLocationForm({ ...locationForm, room: e.target.value })
                        }
                        className="w-full h-9 px-3 border border-[#141413]/20 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={locationForm.phone}
                        onChange={(e) =>
                          setLocationForm({ ...locationForm, phone: e.target.value })
                        }
                        className="w-full h-9 px-3 border border-[#141413]/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={locationForm.whatsapp}
                        onChange={(e) =>
                          setLocationForm({ ...locationForm, whatsapp: e.target.value })
                        }
                        className="w-full h-9 px-3 border border-[#141413]/20 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Google Maps Directions URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=..."
                      value={locationForm.mapsUrl}
                      onChange={(e) =>
                        setLocationForm({ ...locationForm, mapsUrl: e.target.value })
                      }
                      className="w-full h-9 px-3 border border-[#141413]/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                      Visitor Instructions for Customers
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Directions on arrival, parking info, concierge desk instructions..."
                      value={locationForm.visitorInstructions}
                      onChange={(e) =>
                        setLocationForm({ ...locationForm, visitorInstructions: e.target.value })
                      }
                      className="w-full p-2 border border-[#141413]/20 text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={locationForm.active}
                      onChange={(e) =>
                        setLocationForm({ ...locationForm, active: e.target.checked })
                      }
                      className="accent-[#C5A028]"
                    />
                    <span className="text-xs text-[#141413]">Active Viewing Point</span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#141413]/10">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLocation(null);
                        setIsCreatingLocation(false);
                      }}
                      className="py-2 px-3 border border-[#141413]/20 text-[#141413] text-xs font-mono-num uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase font-semibold hover:bg-[#2B2B28]"
                    >
                      Save Location
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 4: BOOKING RULES & HOURS CONFIGURATION                        */}
      {/* ==================================================================== */}
      {subTab === 'config' && (
        <div className="bg-white p-5 sm:p-6 border border-[#141413]/10 space-y-6">
          <div className="pb-3 border-b border-[#141413]/10">
            <h3 className="text-sm font-semibold text-[#141413] font-mono-num uppercase tracking-wider">
              Viewing Schedule Parameters & Timezone Rules (Africa / Nairobi)
            </h3>
            <p className="text-xs text-[#6E6D68]">
              Controls real-time slot generation, daily capacity, notice windows, and holiday closures
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* System Status Toggle */}
            <div className="p-4 bg-[#F4F3EF] border border-[#141413]/10 space-y-2">
              <span className="font-mono-num uppercase font-bold text-[#141413] block">
                Booking Feature Status
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingConfig.enabled}
                  onChange={(e) => updateBookingConfig({ enabled: e.target.checked })}
                  className="accent-[#C5A028]"
                />
                <span>Enable In-Person Viewing Reservations</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={bookingConfig.requireApproval}
                  onChange={(e) => updateBookingConfig({ requireApproval: e.target.checked })}
                  className="accent-[#C5A028]"
                />
                <span>Require Manual Approval (Pending Confirmation)</span>
              </label>
            </div>

            {/* Daily Hours & Durations */}
            <div className="p-4 bg-[#F4F3EF] border border-[#141413]/10 space-y-3">
              <span className="font-mono-num uppercase font-bold text-[#141413] block">
                Daily Hours & Slot Duration
              </span>

              <div>
                <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                  Start Hour (EAT)
                </label>
                <select
                  value={bookingConfig.startHour}
                  onChange={(e) => updateBookingConfig({ startHour: Number(e.target.value) })}
                  className="w-full h-9 px-2 bg-white border border-[#141413]/20 font-mono-num"
                >
                  <option value={8}>8:00 AM</option>
                  <option value={9}>9:00 AM</option>
                  <option value={10}>10:00 AM</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                  End Hour (EAT)
                </label>
                <select
                  value={bookingConfig.endHour}
                  onChange={(e) => updateBookingConfig({ endHour: Number(e.target.value) })}
                  className="w-full h-9 px-2 bg-white border border-[#141413]/20 font-mono-num"
                >
                  <option value={17}>5:00 PM</option>
                  <option value={18}>6:00 PM</option>
                  <option value={19}>7:00 PM</option>
                  <option value={20}>8:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                  Slot Duration
                </label>
                <select
                  value={bookingConfig.appointmentDurationMinutes}
                  onChange={(e) =>
                    updateBookingConfig({ appointmentDurationMinutes: Number(e.target.value) })
                  }
                  className="w-full h-9 px-2 bg-white border border-[#141413]/20 font-mono-num"
                >
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            {/* Capacities & Advance Limits */}
            <div className="p-4 bg-[#F4F3EF] border border-[#141413]/10 space-y-3">
              <span className="font-mono-num uppercase font-bold text-[#141413] block">
                Capacity & Advance Notice
              </span>

              <div>
                <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                  Max Viewings Per Slot (Concurrent Capacity)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bookingConfig.maxConcurrentPerSlot}
                  onChange={(e) =>
                    updateBookingConfig({ maxConcurrentPerSlot: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 bg-white border border-[#141413]/20 font-mono-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                  Minimum Notice (Hours Before Slot)
                </label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={bookingConfig.minNoticeHours}
                  onChange={(e) =>
                    updateBookingConfig({ minNoticeHours: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 bg-white border border-[#141413]/20 font-mono-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                  Max Advance Days (Booking Horizon)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={bookingConfig.maxAdvanceDays}
                  onChange={(e) =>
                    updateBookingConfig({ maxAdvanceDays: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 bg-white border border-[#141413]/20 font-mono-num"
                />
              </div>
            </div>
          </div>

          {/* Blocked Dates (Closures & Holidays) */}
          <div className="p-4 bg-[#F4F3EF] border border-[#141413]/10 space-y-3">
            <span className="font-mono-num uppercase font-bold text-[#141413] block">
              Blocked Holiday Dates & Exceptional Closures
            </span>

            <div className="flex items-center gap-2 max-w-md">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="h-9 px-2 bg-white border border-[#141413]/20 text-xs font-mono-num"
              />
              <button
                type="button"
                onClick={() => {
                  if (newBlockedDate && !bookingConfig.blockedDates.includes(newBlockedDate)) {
                    updateBookingConfig({
                      blockedDates: [...bookingConfig.blockedDates, newBlockedDate],
                    });
                    setNewBlockedDate('');
                  }
                }}
                className="py-2 px-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase"
              >
                + Block Date
              </button>
            </div>

            {bookingConfig.blockedDates.length === 0 ? (
              <p className="text-xs text-[#6E6D68] italic">No holiday closures currently configured.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {bookingConfig.blockedDates.map((dateStr) => (
                  <span
                    key={dateStr}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 text-red-900 text-xs font-mono-num"
                  >
                    <span>{formatViewingDateDisplay(dateStr)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateBookingConfig({
                          blockedDates: bookingConfig.blockedDates.filter((d) => d !== dateStr),
                        })
                      }
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* APPOINTMENT DETAIL / ACTIONS DRAWER MODAL                            */}
      {/* ==================================================================== */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-[#141413]/20 shadow-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#141413]/10">
              <div>
                <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                  Viewing Reference
                </span>
                <h3 className="text-xl font-bold font-mono-num text-[#141413]">
                  {selectedAppointment.bookingReference}
                </h3>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-mono-num font-semibold border bg-[#F4F3EF]">
                  Status: {selectedAppointment.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="w-8 h-8 flex items-center justify-center text-[#6E6D68] hover:text-[#141413]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Action Buttons */}
            <div className="p-3 bg-[#F4F3EF] border border-[#141413]/10 space-y-2">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] block">
                Appointment Workflow Actions
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-mono-num">
                {selectedAppointment.status !== 'Confirmed' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateViewingAppointmentStatus(selectedAppointment.id, 'Confirmed', 'Approved by Showroom Admin');
                      setSelectedAppointment({ ...selectedAppointment, status: 'Confirmed' });
                    }}
                    className="py-1.5 px-3 bg-[#1F6F43] text-white hover:bg-[#185835] font-semibold"
                  >
                    ✓ Confirm Slot
                  </button>
                )}

                {selectedAppointment.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateViewingAppointmentStatus(
                        selectedAppointment.id,
                        'Completed',
                        'Client visited showroom and completed laptop viewing'
                      );
                      setSelectedAppointment({ ...selectedAppointment, status: 'Completed' });
                    }}
                    className="py-1.5 px-3 bg-[#141413] text-[#F4F3EF] hover:bg-[#2B2B28] font-semibold"
                  >
                    Mark Completed
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsRescheduling(!isRescheduling)}
                  className="py-1.5 px-3 border border-[#141413]/30 bg-white hover:bg-[#EAE9E4] text-[#141413]"
                >
                  Reschedule...
                </button>

                {selectedAppointment.status !== 'No-show' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateViewingAppointmentStatus(selectedAppointment.id, 'No-show', 'Client did not arrive');
                      setSelectedAppointment({ ...selectedAppointment, status: 'No-show' });
                    }}
                    className="py-1.5 px-3 border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-900"
                  >
                    Mark No-show
                  </button>
                )}

                {selectedAppointment.status !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => setIsCancelling(!isCancelling)}
                    className="py-1.5 px-3 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900"
                  >
                    Cancel Booking...
                  </button>
                )}
              </div>

              {/* Reschedule Panel */}
              {isRescheduling && (
                <div className="p-3 bg-white border border-blue-200 mt-2 space-y-2 text-xs">
                  <span className="font-bold text-blue-900 block font-mono-num">
                    Pick New Date & Slot:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="h-8 px-2 border border-[#141413]/20 font-mono-num"
                    />
                    <select
                      value={rescheduleSlot}
                      onChange={(e) => setRescheduleSlot(e.target.value)}
                      className="h-8 px-2 border border-[#141413]/20 font-mono-num"
                    >
                      {rescheduleAvailableSlots.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={!rescheduleDate || !rescheduleSlot}
                    onClick={() => {
                      rescheduleViewingAppointment(
                        selectedAppointment.id,
                        rescheduleDate,
                        rescheduleSlot,
                        'admin',
                        'Rescheduled by showroom staff'
                      );
                      setSelectedAppointment({
                        ...selectedAppointment,
                        viewingDate: rescheduleDate,
                        viewingTimeSlot: rescheduleSlot,
                        status: 'Confirmed',
                      });
                      setIsRescheduling(false);
                    }}
                    className="py-1.5 px-3 bg-blue-700 text-white font-mono-num font-semibold text-xs"
                  >
                    Confirm Rescheduled Time
                  </button>
                </div>
              )}

              {/* Cancel Panel */}
              {isCancelling && (
                <div className="p-3 bg-white border border-rose-200 mt-2 space-y-2 text-xs">
                  <span className="font-bold text-rose-900 block font-mono-num">
                    Cancellation Reason:
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Unit damaged or customer requested cancellation via phone"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full h-8 px-2 border border-[#141413]/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateViewingAppointmentStatus(
                        selectedAppointment.id,
                        'Cancelled',
                        cancelReason || 'Cancelled by admin'
                      );
                      setSelectedAppointment({
                        ...selectedAppointment,
                        status: 'Cancelled',
                        cancellationReason: cancelReason,
                      });
                      setIsCancelling(false);
                    }}
                    className="py-1.5 px-3 bg-rose-700 text-white font-mono-num font-semibold text-xs"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              )}
            </div>

            {/* Customer Details & Contact Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border border-[#141413]/15 p-3 space-y-2">
                <span className="font-mono-num uppercase tracking-wider text-[10px] text-[#6E6D68] block">
                  Customer Profile
                </span>
                <p>
                  Name: <strong className="text-[#141413]">{selectedAppointment.customerName}</strong>
                </p>
                <p>
                  Phone: <strong className="font-mono-num text-[#141413]">{selectedAppointment.customerPhone}</strong>
                </p>
                {selectedAppointment.customerEmail && (
                  <p>Email: {selectedAppointment.customerEmail}</p>
                )}
                <p>Attendees: {selectedAppointment.attendeeCount}</p>
                <p>Contact Preference: {selectedAppointment.preferredContact}</p>

                {/* Direct Action Links */}
                <div className="pt-2 border-t border-[#141413]/8 flex gap-2">
                  <a
                    href={buildBookingWhatsAppUrl({
                      productName: selectedAppointment.productName,
                      bookingReference: selectedAppointment.bookingReference,
                      viewingDate: selectedAppointment.viewingDate,
                      viewingTimeSlot: selectedAppointment.viewingTimeSlot,
                      whatsappNumber: selectedAppointment.customerPhone,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 bg-[#1F6F43] text-white text-center text-xs font-mono-num uppercase flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${selectedAppointment.customerPhone.replace(/\s+/g, '')}`}
                    className="flex-1 py-1.5 px-2 bg-[#141413] text-[#F4F3EF] text-center text-xs font-mono-num uppercase flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              {/* Laptop & Location Snapshot */}
              <div className="border border-[#141413]/15 p-3 space-y-2">
                <span className="font-mono-num uppercase tracking-wider text-[10px] text-[#6E6D68] block">
                  Laptop & Viewing Location
                </span>
                <p className="font-semibold text-[#141413]">{selectedAppointment.productName}</p>
                <p className="text-[11px] font-mono-num text-[#6E6D68]">
                  SKU: {selectedAppointment.productSku} · {selectedAppointment.productCondition}
                </p>
                <p className="border-t border-[#141413]/8 pt-1 text-[11px]">
                  <strong>Location:</strong> {selectedAppointment.locationSnapshot?.name}
                </p>
                <p className="text-[11px] text-[#6E6D68]">
                  {selectedAppointment.locationSnapshot?.building}, Floor{' '}
                  {selectedAppointment.locationSnapshot?.floor}
                </p>
              </div>
            </div>

            {/* Customer Question/Note */}
            {selectedAppointment.customerNotes && (
              <div className="bg-amber-50/60 border border-amber-200 p-3 text-xs space-y-1">
                <span className="font-mono-num uppercase tracking-wider text-[10px] text-amber-900 font-bold block">
                  Customer Request / Notes:
                </span>
                <p className="text-amber-950 italic">"{selectedAppointment.customerNotes}"</p>
              </div>
            )}

            {/* Staff Assignment & Internal Notes */}
            <div className="space-y-3 pt-2 border-t border-[#141413]/10 text-xs">
              <div className="flex items-center gap-2">
                <label className="w-28 font-mono-num text-[#5E5D59]">Assigned Staff:</label>
                <input
                  type="text"
                  placeholder="e.g. Kevin Oduor"
                  value={staffDraft}
                  onChange={(e) => setStaffDraft(e.target.value)}
                  className="flex-1 h-8 px-2 border border-[#141413]/20"
                />
                <button
                  type="button"
                  onClick={() => assignViewingStaff(selectedAppointment.id, staffDraft)}
                  className="py-1 px-3 bg-[#141413] text-[#F4F3EF] font-mono-num text-xs uppercase"
                >
                  Assign
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono-num text-[#5E5D59] mb-1">
                  Internal Administrative Notes (Not visible to customer):
                </label>
                <textarea
                  rows={2}
                  value={internalNoteDraft}
                  onChange={(e) => setInternalNoteDraft(e.target.value)}
                  placeholder="e.g. Laptop checked out of Pioneer vault 2 and pre-staged on bench 3..."
                  className="w-full p-2 border border-[#141413]/20 text-xs"
                />
                <button
                  type="button"
                  onClick={() => addViewingInternalNote(selectedAppointment.id, internalNoteDraft)}
                  className="mt-1 py-1 px-3 bg-[#141413] text-[#F4F3EF] font-mono-num text-xs uppercase"
                >
                  Save Internal Note
                </button>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div className="space-y-2 pt-2 border-t border-[#141413]/10">
              <span className="font-mono-num uppercase tracking-wider text-[11px] font-bold text-[#141413] block">
                Appointment Audit Trail
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto bg-[#F4F3EF] p-2.5 border border-[#141413]/10 text-[11px]">
                {selectedAppointment.auditTrail?.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 border-b border-[#141413]/5 pb-1">
                    <span className="font-mono-num text-[#6E6D68] shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('en-KE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="flex-1">
                      <strong className="text-[#141413]">{log.action}</strong>
                      <span className="text-[#6E6D68]"> by {log.actor}</span>
                      {log.note && <p className="italic text-[#5E5D59]">{log.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
