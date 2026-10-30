import nodemailer from 'nodemailer';
import {
  EmailNotificationLog,
  Order,
  ViewingAppointment,
  WarrantyRegistration,
} from './src/types/store';
import { addNotificationLog, getDatabase } from './serverDb';

// ============================================================================
// Email Transporter Factory
// ============================================================================

export function getEmailTransporter() {
  const db = getDatabase();
  const settings = db.settings;

  const host = process.env.SMTP_HOST || settings.smtpHost;
  const port = Number(process.env.SMTP_PORT || settings.smtpPort || 587);
  const user = process.env.SMTP_USER || settings.smtpUser;
  const pass = process.env.SMTP_PASS || settings.smtpPass;
  const secure = process.env.SMTP_SECURE === 'true' || settings.smtpSecure || port === 465;

  if (host && user && pass) {
    return {
      isConfigured: true,
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      }),
      fromAddress: user.includes('@') ? `"Tech Sokoni Showroom" <${user}>` : `"Tech Sokoni Showroom" <notifications@techsokoni.co.ke>`,
    };
  }

  // Fallback direct / simulated transporter
  return {
    isConfigured: false,
    transporter: null,
    fromAddress: '"Tech Sokoni Kenya" <alerts@techsokoni.co.ke>',
  };
}

export function getAdminNotificationRecipient(): string {
  const db = getDatabase();
  return (
    db.settings?.adminNotificationEmail?.trim() ||
    process.env.NOTIFICATION_EMAIL?.trim() ||
    'sirdusman@gmail.com'
  );
}

// ============================================================================
// Email Templates (Responsive HTML & Plain-Text)
// ============================================================================

function cleanKenyanPhoneForWa(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '254' + clean.slice(1);
  if (!clean.startsWith('254') && clean.length === 9) clean = '254' + clean;
  return clean;
}

function buildHtmlWrapper(title: string, subtitle: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F4F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #141413; }
    .container { max-width: 620px; margin: 24px auto; background-color: #FFFFFF; border: 1px solid #EAE9E4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(20,20,19,0.06); }
    .header { background-color: #141413; padding: 24px 28px; color: #F4F3EF; }
    .brand { font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #9E9D98; font-family: monospace; margin-bottom: 6px; }
    .title { font-size: 20px; font-weight: 700; margin: 0 0 4px 0; color: #F4F3EF; letter-spacing: -0.02em; }
    .subtitle { font-size: 12px; color: #1F6F43; font-weight: 600; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; }
    .body { padding: 28px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-family: monospace; font-weight: 600; text-transform: uppercase; border-radius: 2px; }
    .badge-order { background-color: #E8F5E9; color: #1F6F43; border: 1px solid #A5D6A7; }
    .badge-booking { background-color: #E3F2FD; color: #1565C0; border: 1px solid #90CAF9; }
    .badge-warranty { background-color: #FFF3E0; color: #E65100; border: 1px solid #FFE0B2; }
    .card { background-color: #F8F7F4; border: 1px solid #EAE9E4; padding: 18px; margin-bottom: 20px; }
    .grid-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .label { color: #6E6D68; font-size: 12px; font-family: monospace; text-transform: uppercase; }
    .value { font-weight: 600; color: #141413; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .items-table th { text-align: left; font-size: 10px; text-transform: uppercase; font-family: monospace; color: #6E6D68; padding: 8px 6px; border-bottom: 2px solid #141413; }
    .items-table td { padding: 10px 6px; border-bottom: 1px solid #EAE9E4; font-size: 13px; vertical-align: top; }
    .btn { display: inline-block; padding: 10px 18px; background-color: #141413; color: #F4F3EF !important; text-decoration: none; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-right: 8px; margin-top: 8px; }
    .btn-secondary { background-color: #1F6F43; }
    .btn-outline { background-color: #F4F3EF; color: #141413 !important; border: 1px solid #141413; }
    .footer { background-color: #F4F3EF; padding: 18px 28px; text-align: center; font-size: 11px; color: #6E6D68; font-family: monospace; border-top: 1px solid #EAE9E4; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Tech Sokoni Kenya — Showroom Dispatch Alert</div>
      <h1 class="title">${title}</h1>
      <div class="subtitle">${subtitle}</div>
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      Tech Sokoni Kenya • Kenyatta Pioneer Building, 5th Floor, Shop 514, Nairobi CBD<br>
      Orders Hotline &amp; WhatsApp: +254 792 620 789 • shop@techsokoni.com
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// 1. Order Notification Dispatch
// ============================================================================

export async function sendOrderNotificationEmail(order: Order): Promise<EmailNotificationLog> {
  const db = getDatabase();
  const recipient = getAdminNotificationRecipient();

  if (db.settings?.notifyOnNewOrder === false) {
    console.log('[Notification]: New order alerts disabled in settings, skipping.');
    return {
      id: `notif-${Date.now()}`,
      type: 'order',
      recipient,
      subject: `[Skipped] Order #${order.orderNumber}`,
      summary: 'Skipped by settings',
      htmlContent: '',
      textContent: '',
      status: 'simulated',
      referenceId: order.orderNumber,
      createdAt: new Date().toISOString(),
    };
  }

  const subject = `🛒 [Tech Sokoni] New Order #${order.orderNumber} - KSh ${order.total.toLocaleString()} from ${order.customerName}`;
  const waPhone = cleanKenyanPhoneForWa(order.customerPhone);
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hello ${order.customerName}, this is Tech Sokoni Kenya regarding your order #${order.orderNumber}. We have received your order and are preparing it for dispatch.`
  )}`;

  const itemsHtml = order.items
    .map((item) => {
      const vars = item.selectedVariations
        ? Object.entries(item.selectedVariations)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ')
        : '';
      return `<tr>
        <td>
          <strong>${item.productName}</strong>
          ${vars ? `<br><span style="font-size:11px; color:#6E6D68;">${vars}</span>` : ''}
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">KSh ${item.unitPrice.toLocaleString()}</td>
        <td style="text-align: right; font-weight:600;">KSh ${(item.unitPrice * item.quantity).toLocaleString()}</td>
      </tr>`;
    })
    .join('');

  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order">✓ New Customer Order</span>
      <span style="float: right; font-family: monospace; font-size: 12px; color: #6E6D68;">Order Ref: <strong>${order.orderNumber}</strong></span>
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Customer &amp; Delivery Details</div>
      <div class="grid-row"><span class="label">Customer Name:</span><span class="value">${order.customerName}</span></div>
      <div class="grid-row"><span class="label">Mobile Phone:</span><span class="value"><a href="tel:${order.customerPhone}" style="color:#1F6F43; text-decoration:none;">${order.customerPhone}</a></span></div>
      ${order.customerEmail ? `<div class="grid-row"><span class="label">Email Address:</span><span class="value"><a href="mailto:${order.customerEmail}" style="color:#141413;">${order.customerEmail}</a></span></div>` : ''}
      <div class="grid-row"><span class="label">Delivery Address:</span><span class="value">${order.shippingAddress}</span></div>
      <div class="grid-row"><span class="label">City / Destination:</span><span class="value">${order.city || 'Nairobi'}</span></div>
      <div class="grid-row"><span class="label">Payment Method:</span><span class="value">${order.paymentMethod}</span></div>
      ${order.mpesaCode ? `<div class="grid-row"><span class="label">M-Pesa Reference:</span><span class="value" style="color:#1F6F43; font-family:monospace;">${order.mpesaCode}</span></div>` : ''}
    </div>

    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 8px; font-weight: 600;">Ordered Equipment (${order.items.length} ${order.items.length === 1 ? 'item' : 'items'})</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Hardware Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <div style="border-top: 2px solid #141413; padding-top: 14px; margin-bottom: 24px;">
      <div class="grid-row" style="font-size: 14px;"><span class="label">Subtotal:</span><span>KSh ${order.subtotal.toLocaleString()}</span></div>
      <div class="grid-row" style="font-size: 14px;"><span class="label">Nationwide Express Delivery:</span><span style="color:#1F6F43; font-weight:600;">FREE</span></div>
      <div class="grid-row" style="font-size: 18px; font-weight: 700; margin-top: 8px;"><span style="font-family:monospace;">TOTAL PAYABLE:</span><span style="color:#141413;">KSh ${order.total.toLocaleString()}</span></div>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #EAE9E4;">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Showroom Dispatch Actions</div>
      <a href="tel:${order.customerPhone}" class="btn">Call Customer</a>
      <a href="${waLink}" target="_blank" class="btn btn-secondary">WhatsApp Customer</a>
    </div>
  `;

  const htmlContent = buildHtmlWrapper(
    `New Order Received #${order.orderNumber}`,
    `Total: KSh ${order.total.toLocaleString()} • ${order.customerName}`,
    bodyContent
  );

  const textContent = `TECH SOKONI KENYA - NEW ORDER RECEIVED
====================================================
Order Reference: ${order.orderNumber}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Email: ${order.customerEmail || 'N/A'}
Address: ${order.shippingAddress}, ${order.city}
Payment: ${order.paymentMethod} ${order.mpesaCode ? `(M-Pesa Ref: ${order.mpesaCode})` : ''}

ITEMS:
${order.items.map((i) => `- ${i.quantity}x ${i.productName}: KSh ${(i.unitPrice * i.quantity).toLocaleString()}`).join('\n')}

Subtotal: KSh ${order.subtotal.toLocaleString()}
Shipping: FREE
TOTAL: KSh ${order.total.toLocaleString()}

Customer Hotline / WhatsApp: +254 792 620 789
Showroom: Kenyatta Pioneer Building Shop 514, Nairobi CBD
====================================================`;

  return await dispatchAndRecordNotification({
    type: 'order',
    recipient,
    subject,
    summary: `Order #${order.orderNumber} for KSh ${order.total.toLocaleString()} from ${order.customerName} (${order.customerPhone})`,
    htmlContent,
    textContent,
    referenceId: order.orderNumber,
  });
}

// ============================================================================
// 2. Viewing Booking Notification Dispatch
// ============================================================================

export async function sendBookingNotificationEmail(appt: ViewingAppointment): Promise<EmailNotificationLog> {
  const db = getDatabase();
  const recipient = getAdminNotificationRecipient();

  if (db.settings?.notifyOnNewBooking === false) {
    console.log('[Notification]: Viewing alerts disabled in settings, skipping.');
    return {
      id: `notif-${Date.now()}`,
      type: 'booking',
      recipient,
      subject: `[Skipped] Booking #${appt.bookingReference}`,
      summary: 'Skipped by settings',
      htmlContent: '',
      textContent: '',
      status: 'simulated',
      referenceId: appt.bookingReference,
      createdAt: new Date().toISOString(),
    };
  }

  const subject = `📅 [Tech Sokoni] New Showroom Viewing #${appt.bookingReference} - ${appt.customerName} (${appt.productName})`;
  const waPhone = cleanKenyanPhoneForWa(appt.customerPhone);
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hello ${appt.customerName}, this is Tech Sokoni Showroom regarding your reserved viewing #${appt.bookingReference} for the ${appt.productName} on ${appt.viewingDate} at ${appt.viewingTimeSlot}.`
  )}`;

  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-booking">📅 Showroom Inspection Reserved</span>
      <span style="float: right; font-family: monospace; font-size: 12px; color: #6E6D68;">Booking Ref: <strong>${appt.bookingReference}</strong></span>
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Appointment Schedule</div>
      <div class="grid-row"><span class="label">Inspection Date:</span><span class="value" style="color:#1565C0;">${appt.viewingDate}</span></div>
      <div class="grid-row"><span class="label">Time Slot:</span><span class="value" style="color:#1565C0;">${appt.viewingTimeSlot}</span></div>
      <div class="grid-row"><span class="label">Showroom Location:</span><span class="value">${appt.locationSnapshot?.name || 'Kenyatta Pioneer Showroom (Shop 514)'}</span></div>
      <div class="grid-row"><span class="label">Hardware for Viewing:</span><span class="value" style="font-weight:700;">${appt.productName}</span></div>
      ${appt.productPrice ? `<div class="grid-row"><span class="label">Catalog Price:</span><span class="value">KSh ${appt.productPrice.toLocaleString()}</span></div>` : ''}
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Customer Contact Information</div>
      <div class="grid-row"><span class="label">Customer Name:</span><span class="value">${appt.customerName}</span></div>
      <div class="grid-row"><span class="label">Mobile Phone:</span><span class="value"><a href="tel:${appt.customerPhone}" style="color:#1F6F43; text-decoration:none;">${appt.customerPhone}</a></span></div>
      ${appt.customerEmail ? `<div class="grid-row"><span class="label">Email Address:</span><span class="value"><a href="mailto:${appt.customerEmail}" style="color:#141413;">${appt.customerEmail}</a></span></div>` : ''}
      ${appt.customerNotes ? `<div class="grid-row" style="margin-top:10px;"><span class="label">Customer Notes:</span><span class="value" style="font-weight:normal; font-style:italic;">"${appt.customerNotes}"</span></div>` : ''}
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #EAE9E4;">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Concierge Direct Actions</div>
      <a href="tel:${appt.customerPhone}" class="btn">Call Client</a>
      <a href="${waLink}" target="_blank" class="btn btn-secondary">WhatsApp Client</a>
    </div>
  `;

  const htmlContent = buildHtmlWrapper(
    `New Showroom Viewing #${appt.bookingReference}`,
    `${appt.viewingDate} at ${appt.viewingTimeSlot} • ${appt.productName}`,
    bodyContent
  );

  const textContent = `TECH SOKONI KENYA - SHOWROOM VIEWING RESERVATION
====================================================
Booking Reference: ${appt.bookingReference}
Hardware Model: ${appt.productName}
Date: ${appt.viewingDate}
Time Slot: ${appt.viewingTimeSlot}
Location: Kenyatta Pioneer Building, Shop 514, Nairobi CBD

CUSTOMER:
Name: ${appt.customerName}
Phone: ${appt.customerPhone}
Email: ${appt.customerEmail || 'N/A'}
Notes: ${appt.customerNotes || 'None'}
====================================================`;

  return await dispatchAndRecordNotification({
    type: 'booking',
    recipient,
    subject,
    summary: `Viewing #${appt.bookingReference} for ${appt.productName} on ${appt.viewingDate} at ${appt.viewingTimeSlot} by ${appt.customerName} (${appt.customerPhone})`,
    htmlContent,
    textContent,
    referenceId: appt.bookingReference,
  });
}

// ============================================================================
// 3. Warranty Registration Notification Dispatch
// ============================================================================

export async function sendWarrantyNotificationEmail(reg: WarrantyRegistration): Promise<EmailNotificationLog> {
  const db = getDatabase();
  const recipient = getAdminNotificationRecipient();

  if (db.settings?.notifyOnWarrantyReg === false) {
    return {
      id: `notif-${Date.now()}`,
      type: 'warranty',
      recipient,
      subject: `[Skipped] Warranty ${reg.serialNumber}`,
      summary: 'Skipped by settings',
      htmlContent: '',
      textContent: '',
      status: 'simulated',
      referenceId: reg.serialNumber,
      createdAt: new Date().toISOString(),
    };
  }

  const subject = `🛡️ [Tech Sokoni] New 6-Month Warranty Registration - Serial ${reg.serialNumber} (${reg.modelName})`;
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-warranty">🛡️ 6-Month Official Warranty Registered</span>
      <span style="float: right; font-family: monospace; font-size: 12px; color: #6E6D68;">Serial: <strong>${reg.serialNumber}</strong></span>
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Hardware &amp; Coverage Details</div>
      <div class="grid-row"><span class="label">Hardware Serial:</span><span class="value" style="font-family:monospace; color:#E65100;">${reg.serialNumber}</span></div>
      <div class="grid-row"><span class="label">Product / Model:</span><span class="value">${reg.modelName}</span></div>
      <div class="grid-row"><span class="label">Purchase Date:</span><span class="value">${reg.purchaseDate}</span></div>
      <div class="grid-row"><span class="label">Coverage Duration:</span><span class="value">6 Months (Official Direct Protection)</span></div>
      <div class="grid-row"><span class="label">Warranty Expiry Date:</span><span class="value" style="color:#1F6F43; font-weight:700;">${reg.warrantyExpiryDate}</span></div>
      ${reg.orderNumber ? `<div class="grid-row"><span class="label">Linked Order:</span><span class="value">#${reg.orderNumber}</span></div>` : ''}
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Registered Client</div>
      <div class="grid-row"><span class="label">Client Name:</span><span class="value">${reg.clientName || 'Showroom Client'}</span></div>
      <div class="grid-row"><span class="label">Client Phone:</span><span class="value"><a href="tel:${reg.clientPhone}" style="color:#1F6F43;">${reg.clientPhone}</a></span></div>
      ${reg.clientEmail ? `<div class="grid-row"><span class="label">Client Email:</span><span class="value"><a href="mailto:${reg.clientEmail}">${reg.clientEmail}</a></span></div>` : ''}
      ${reg.notes ? `<div class="grid-row" style="margin-top:10px;"><span class="label">Client Notes:</span><span class="value" style="font-weight:normal;">${reg.notes}</span></div>` : ''}
    </div>
  `;

  const htmlContent = buildHtmlWrapper(
    `New Warranty Registered - ${reg.serialNumber}`,
    `${reg.modelName} • Protected until ${reg.warrantyExpiryDate}`,
    bodyContent
  );

  const textContent = `TECH SOKONI KENYA - NEW WARRANTY REGISTRATION
====================================================
Serial: ${reg.serialNumber}
Model: ${reg.modelName}
Purchase Date: ${reg.purchaseDate}
Warranty Expiry Date: ${reg.warrantyExpiryDate} (6 Months Official)
Client: ${reg.clientName || 'N/A'} (${reg.clientPhone || 'N/A'}, ${reg.clientEmail || 'N/A'})
====================================================`;

  return await dispatchAndRecordNotification({
    type: 'warranty',
    recipient,
    subject,
    summary: `Serial ${reg.serialNumber} registered by ${reg.clientName || 'Client'} (${reg.clientPhone || 'N/A'}) for ${reg.modelName}`,
    htmlContent,
    textContent,
    referenceId: reg.serialNumber,
  });
}

// ============================================================================
// 4. Test Notification Dispatch
// ============================================================================

export async function sendTestNotificationEmail(overrideRecipient?: string): Promise<EmailNotificationLog> {
  const recipient = overrideRecipient?.trim() || getAdminNotificationRecipient();
  const timestamp = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

  const subject = `⚡ [Tech Sokoni] Notification Alert System Verified for ${recipient}`;
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order">✓ System Test Verified</span>
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Diagnostic Verification</div>
      <div class="grid-row"><span class="label">Recipient Email:</span><span class="value" style="color:#1F6F43; font-weight:700;">${recipient}</span></div>
      <div class="grid-row"><span class="label">Timestamp (EAT):</span><span class="value">${timestamp}</span></div>
      <div class="grid-row"><span class="label">Order Alerts:</span><span class="value" style="color:#1F6F43;">ACTIVE (Dispatches on checkout)</span></div>
      <div class="grid-row"><span class="label">Booking Alerts:</span><span class="value" style="color:#1F6F43;">ACTIVE (Dispatches on showroom viewing)</span></div>
      <div class="grid-row"><span class="label">Warranty Alerts:</span><span class="value" style="color:#1F6F43;">ACTIVE (Dispatches on serial registration)</span></div>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #4B4A45;">
      Your Tech Sokoni email alert center is operational. Whenever a customer places an order online, reserves a physical inspection appointment at Kenyatta Pioneer Building Shop 514, or registers a device serial number, you will receive full customer contact details, items, and quick action links directly here.
    </p>
  `;

  const htmlContent = buildHtmlWrapper(
    'Notification System Active & Connected',
    `Target: ${recipient} • Nairobi Showroom`,
    bodyContent
  );

  const textContent = `TECH SOKONI KENYA - EMAIL NOTIFICATION SYSTEM TEST
====================================================
Recipient: ${recipient}
Timestamp: ${timestamp}
Status: System Verified & Operational

Order, viewing booking, and warranty alerts are configured to notify you at ${recipient}.
====================================================`;

  return await dispatchAndRecordNotification({
    type: 'test',
    recipient,
    subject,
    summary: `Test notification successfully dispatched to ${recipient}`,
    htmlContent,
    textContent,
  });
}

// ============================================================================
// Core Dispatcher with Automatic Log & Error Recording
// ============================================================================

async function dispatchAndRecordNotification(payload: {
  type: 'order' | 'booking' | 'warranty' | 'test';
  recipient: string;
  subject: string;
  summary: string;
  htmlContent: string;
  textContent: string;
  referenceId?: string;
}): Promise<EmailNotificationLog> {
  const { isConfigured, transporter, fromAddress } = getEmailTransporter();
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  let status: 'sent' | 'simulated' | 'failed' = 'simulated';
  let errorMsg: string | undefined;

  if (isConfigured && transporter) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: payload.recipient,
        subject: payload.subject,
        html: payload.htmlContent,
        text: payload.textContent,
      });
      status = 'sent';
      console.log(`[Notification]: Successfully dispatched live SMTP email to ${payload.recipient} (${payload.subject})`);
    } catch (err: any) {
      status = 'failed';
      errorMsg = err?.message || 'SMTP delivery failed';
      console.warn(`[Notification]: SMTP delivery error to ${payload.recipient}:`, errorMsg);
    }
  } else {
    // If live SMTP credentials are not yet entered, record as 'simulated'
    // allowing the store owner to view the complete alert in the Admin Dashboard Outbox
    // and click "Open in Mail App (mailto)"
    status = 'simulated';
    console.log(`[Notification]: Logged notification for ${payload.recipient} (${payload.subject}). Add SMTP in Admin to enable external inbox relay.`);
  }

  const logEntry: EmailNotificationLog = {
    id,
    type: payload.type,
    recipient: payload.recipient,
    subject: payload.subject,
    summary: payload.summary,
    htmlContent: payload.htmlContent,
    textContent: payload.textContent,
    status,
    error: errorMsg,
    referenceId: payload.referenceId,
    createdAt: nowIso,
  };

  addNotificationLog(logEntry);
  return logEntry;
}
