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

export function formatSmtpError(rawError?: string): string {
  if (!rawError) return 'SMTP dispatch failed. Please verify host, port, and authentication credentials.';
  const lower = rawError.toLowerCase();
  if (lower.includes('wrong version number') || lower.includes('eproto')) {
    return 'SSL/TLS Protocol Mismatch: Port 587 uses STARTTLS (SSL must be disabled). For direct SSL, use Port 465 (SSL enabled).';
  }
  if (lower.includes('535') || lower.includes('auth') || lower.includes('credential') || lower.includes('invalid login')) {
    return 'Authentication Failed: The mail server (Zoho/Gmail) rejected your login. If Two-Factor Authentication is active, you must generate and use an Application-Specific Password (e.g. at accounts.zoho.com > Security > App Passwords or myaccount.google.com/security), rather than your personal login password. Also ensure Outgoing SMTP is turned ON in Zoho Mail settings.';
  }
  if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('timed out')) {
    return 'Connection Timed Out: The mail server did not respond within 8 seconds. Verify the hostname (smtp.zoho.com or smtp.zoho.eu) and that port 465/587 is accessible.';
  }
  if (lower.includes('enotfound') || lower.includes('getaddrinfo')) {
    return 'Hostname Unreachable: The SMTP server address is invalid or cannot be reached via DNS.';
  }
  if (lower.includes('econnrefused')) {
    return 'Connection Refused: The mail server rejected connection on the specified port.';
  }
  return rawError;
}

function cleanEnvValue(value?: string): string {
  if (!value) return '';
  return value.trim().replace(/^["'](.*)["']$/, '$1').trim();
}

function createTransporterInstance(config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 4500,
    greetingTimeout: 4500,
    socketTimeout: 6000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export function getEmailTransporter() {
  const db = getDatabase();
  const settings = db.settings;

  // Support standard Vercel / Cloud Run / hosting environment variables
  const host = cleanEnvValue(
    process.env.SMTP_HOST ||
      process.env.EMAIL_HOST ||
      process.env.MAIL_HOST ||
      process.env.ZOHO_HOST ||
      settings.smtpHost
  );

  const rawPort = cleanEnvValue(
    String(
      process.env.SMTP_PORT ||
        process.env.EMAIL_PORT ||
        process.env.MAIL_PORT ||
        settings.smtpPort ||
        465
    )
  );

  const port = Number(rawPort) || 465;

  const user = cleanEnvValue(
    process.env.SMTP_USER ||
      process.env.SMTP_USERNAME ||
      process.env.EMAIL_USER ||
      process.env.MAIL_USER ||
      process.env.ZOHO_USER ||
      settings.smtpUser
  );

  const pass = cleanEnvValue(
    process.env.SMTP_PASS ||
      process.env.SMTP_PASSWORD ||
      process.env.EMAIL_PASS ||
      process.env.EMAIL_PASSWORD ||
      process.env.MAIL_PASS ||
      process.env.MAIL_PASSWORD ||
      process.env.ZOHO_PASSWORD ||
      settings.smtpPass
  );

  // Auto-correct port/secure mismatches:
  // Port 465 is always SSL (secure: true)
  // Port 587 / 25 is always STARTTLS (secure: false)
  let secure: boolean = Boolean(settings.smtpSecure ?? (port === 465));
  if (port === 465) {
    secure = true;
  } else if (port === 587 || port === 25) {
    secure = false;
  } else if (process.env.SMTP_SECURE !== undefined) {
    secure = process.env.SMTP_SECURE === 'true';
  } else if (process.env.EMAIL_SECURE !== undefined) {
    secure = process.env.EMAIL_SECURE === 'true';
  }

  const customFrom = cleanEnvValue(process.env.SMTP_FROM || process.env.EMAIL_FROM);
  const fromAddress =
    customFrom ||
    (user.includes('@')
      ? `"Tech Sokoni Showroom" <${user}>`
      : `"Tech Sokoni Showroom" <notifications@techsokoni.co.ke>`);

  if (host && user && pass) {
    return {
      isConfigured: true,
      smtpConfig: { host, port, secure, user, pass },
      transporter: createTransporterInstance({ host, port, secure, user, pass }),
      fromAddress,
    };
  }

  // Fallback direct / simulated transporter
  return {
    isConfigured: false,
    smtpConfig: null,
    transporter: null,
    fromAddress: '"Tech Sokoni Kenya" <alerts@techsokoni.co.ke>',
  };
}

export async function testSmtpConnection(config: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure?: boolean;
}): Promise<{ ok: boolean; message?: string; error?: string; rawError?: string }> {
  try {
    const host = (config.smtpHost || '').trim();
    const port = Number(config.smtpPort) || 465;
    const user = (config.smtpUser || '').trim();
    const pass = (config.smtpPass || '').trim();

    if (!host || !user || !pass) {
      return {
        ok: false,
        error: 'Please enter SMTP Host, User Email, and App Password.',
      };
    }

    let secure = config.smtpSecure;
    if (port === 465) {
      secure = true;
    } else if (port === 587 || port === 25) {
      secure = false;
    }

    const testTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false },
    });

    await Promise.race([
      testTransporter.verify(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out after 8 seconds')), 8500)
      ),
    ]);

    return {
      ok: true,
      message: `Successfully connected and authenticated with ${host}:${port} as ${user}!`,
    };
  } catch (err: any) {
    const raw = err?.message || 'SMTP connection failed';
    return {
      ok: false,
      error: formatSmtpError(raw),
      rawError: raw,
    };
  }
}

export function getAdminNotificationRecipient(): string {
  const db = getDatabase();
  return (
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.NOTIFICATION_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.ALERT_EMAIL?.trim() ||
    db.settings?.adminNotificationEmail?.trim() ||
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
      <div class="brand" style="display:flex; align-items:center; gap:10px;">
        <span style="display:inline-block; width:20px; height:20px; background:#F4F3EF; color:#141413; text-align:center; line-height:20px; font-weight:800; font-size:12px; border-radius:3px;">T</span>
        <span>Tech Sokoni Kenya — Showroom Dispatch Alert</span>
      </div>
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

async function sendMailWithRetry(
  smtpConfig: { host: string; port: number; secure: boolean; user: string; pass: string },
  mailOptions: { from: string; to: string; subject: string; html: string; text: string }
): Promise<void> {
  const primaryTransporter = createTransporterInstance(smtpConfig);
  try {
    await Promise.race([
      primaryTransporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout: Server took longer than 5.5 seconds to respond')), 5500)
      ),
    ]);
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    const isNetworkOrTimeout =
      msg.includes('timeout') ||
      msg.includes('etimedout') ||
      msg.includes('econnrefused') ||
      msg.includes('socket');

    // If port 465 timed out or refused, automatically attempt port 587 STARTTLS (and vice-versa)
    if (isNetworkOrTimeout && (smtpConfig.port === 465 || smtpConfig.port === 587)) {
      const altPort = smtpConfig.port === 465 ? 587 : 465;
      const altSecure = altPort === 465;
      console.warn(
        `[Notification]: Port ${smtpConfig.port} failed (${err?.message}). Retrying via port ${altPort}...`
      );
      const fallbackTransporter = createTransporterInstance({
        ...smtpConfig,
        port: altPort,
        secure: altSecure,
      });
      await Promise.race([
        fallbackTransporter.sendMail(mailOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fallback SMTP timeout')), 4500)
        ),
      ]);
      return;
    }
    throw err;
  }
}

async function dispatchAndRecordNotification(payload: {
  type: 'order' | 'booking' | 'warranty' | 'test';
  recipient: string;
  subject: string;
  summary: string;
  htmlContent: string;
  textContent: string;
  referenceId?: string;
}): Promise<EmailNotificationLog> {
  const { isConfigured, smtpConfig, transporter, fromAddress } = getEmailTransporter();
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  let status: 'sent' | 'simulated' | 'failed' = 'simulated';
  let errorMsg: string | undefined;

  if (isConfigured && transporter && smtpConfig) {
    try {
      await sendMailWithRetry(smtpConfig, {
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
      errorMsg = formatSmtpError(err?.message || 'SMTP delivery failed');
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

export async function sendMpesaConfirmationNotificationEmail(
  order: Order,
  mpesaCode: string,
  mpesaMessage: string
): Promise<EmailNotificationLog> {
  const recipient = getAdminNotificationRecipient();
  const subject = `💳 [Tech Sokoni] M-Pesa Payment Code ${mpesaCode || 'SMS'} Received for Order #${order.orderNumber}`;
  const waPhone = cleanKenyanPhoneForWa(order.customerPhone);
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hello ${order.customerName}, thank you for sending your M-Pesa confirmation (${mpesaCode}) for order #${order.orderNumber}. We are verifying and dispatching shortly.`
  )}`;

  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order">💳 M-Pesa Confirmation Submitted</span>
      <span style="float: right; font-family: monospace; font-size: 12px; color: #6E6D68;">Order Ref: <strong>${order.orderNumber}</strong></span>
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">M-Pesa Settlement Details (Till 9309020)</div>
      <div class="grid-row"><span class="label">M-Pesa Code:</span><span class="value" style="color:#1F6F43; font-family:monospace; font-size:15px;">${mpesaCode || 'See SMS Message'}</span></div>
      <div class="grid-row"><span class="label">Order Amount:</span><span class="value">KSh ${order.total.toLocaleString()}</span></div>
      <div class="grid-row"><span class="label">Customer:</span><span class="value">${order.customerName} (${order.customerPhone})</span></div>
      ${mpesaMessage ? `<div style="margin-top:12px; padding:10px; background:#FFFFFF; border:1px solid #EAE9E4; font-family:monospace; font-size:12px;">${mpesaMessage}</div>` : ''}
    </div>

    <div style="margin-top: 20px;">
      <a href="tel:${order.customerPhone}" class="btn">Call Customer</a>
      <a href="${waLink}" target="_blank" class="btn btn-secondary">WhatsApp Customer</a>
    </div>
  `;

  const htmlContent = buildHtmlWrapper(
    `M-Pesa Code Submitted — #${order.orderNumber}`,
    `Code: ${mpesaCode || 'SMS'} • KSh ${order.total.toLocaleString()}`,
    bodyContent
  );

  const textContent = `TECH SOKONI KENYA - M-PESA CONFIRMATION RECEIVED
====================================================
Order: ${order.orderNumber}
Customer: ${order.customerName} (${order.customerPhone})
Amount: KSh ${order.total.toLocaleString()}
M-Pesa Code: ${mpesaCode || 'N/A'}
Message: ${mpesaMessage || 'N/A'}
====================================================`;

  return await dispatchAndRecordNotification({
    type: 'order',
    recipient,
    subject,
    summary: `M-Pesa payment (${mpesaCode || 'SMS'}) submitted for Order #${order.orderNumber} (${order.customerName})`,
    htmlContent,
    textContent,
    referenceId: `${order.orderNumber}-MPESA`,
  });
}

// ============================================================================
// 5. 6-Digit Password Reset Code Email Dispatch
// ============================================================================

export async function sendPasswordResetCodeEmail(
  recipient: string,
  code: string,
  clientName?: string
): Promise<EmailNotificationLog> {
  const subject = `🔐 [Tech Sokoni] Your 6-Digit Password Reset Verification Code: ${code}`;
  const greeting = clientName ? `Hello ${clientName},` : 'Hello,';

  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order" style="background-color:#FFF3E0; color:#E65100; border-color:#FFE0B2;">
        🔐 Password Reset Authorization
      </span>
    </div>

    <p style="font-size: 14px; color: #141413; line-height: 1.5; margin-bottom: 16px;">
      ${greeting} We received a request to reset the password for your Tech Sokoni account (<strong>${recipient}</strong>).
    </p>

    <div style="background-color: #141413; color: #F4F3EF; text-align: center; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <div style="font-size: 11px; font-family: monospace; letter-spacing: 0.2em; text-transform: uppercase; color: #9E9D98; margin-bottom: 8px;">
        Your 6-Digit Verification Code
      </div>
      <div style="font-family: monospace; font-size: 38px; font-weight: 700; letter-spacing: 0.35em; color: #F4F3EF;">
        ${code}
      </div>
      <div style="font-size: 11px; color: #C5A028; margin-top: 8px; font-family: monospace;">
        ⏱ Valid for 10 minutes • Do not share this code
      </div>
    </div>

    <div class="card" style="font-size: 12px; line-height: 1.6; color: #5E5D59;">
      <strong style="color: #141413; display: block; margin-bottom: 4px;">Next Steps:</strong>
      1. Return to the Tech Sokoni verification screen in your browser.<br>
      2. Enter the 6-digit code: <code style="font-family: monospace; font-weight: bold; color: #141413;">${code}</code>.<br>
      3. Enter and confirm your new secure password.<br><br>
      <span style="color: #6E6D68; font-size: 11px;">If you did not request a password reset, no action is needed. Your existing password remains secure.</span>
    </div>
  `;

  const htmlContent = buildHtmlWrapper(
    'Password Reset Verification',
    `Authorization Code for ${recipient}`,
    bodyContent
  );

  const textContent = `TECH SOKONI KENYA - PASSWORD RESET VERIFICATION
====================================================
${greeting}
We received a request to reset your Tech Sokoni account password.

YOUR 6-DIGIT VERIFICATION CODE:
${code}

(Valid for 10 minutes)

Enter this 6-digit code in the Tech Sokoni portal to verify your identity and choose a new password.

If you did not request this, you can safely ignore this email.
====================================================`;

  return await dispatchAndRecordNotification({
    type: 'test',
    recipient,
    subject,
    summary: `Password reset verification code [${code}] dispatched to ${recipient}`,
    htmlContent,
    textContent,
    referenceId: `RESET-${code}`,
  });
}

// ============================================================================
// 6. Two-Step Verification (MFA) Code Email Dispatch
// ============================================================================

export async function sendTwoFactorCodeEmail(
  recipient: string,
  code: string,
  context: 'client_login' | 'admin_login' | 'enable_mfa',
  clientName?: string
): Promise<EmailNotificationLog> {
  const contextTitle =
    context === 'admin_login'
      ? 'Tech Sokoni Showroom Admin Access'
      : context === 'enable_mfa'
      ? 'Enable Two-Step Verification'
      : 'Tech Sokoni Client Sign-In';

  const subject = `🛡️ [Tech Sokoni] Two-Step Verification Code: ${code}`;
  const greeting = clientName ? `Hello ${clientName},` : 'Hello,';

  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-booking" style="background-color:#E8F5E9; color:#1F6F43; border-color:#A5D6A7;">
        🛡️ Two-Step Verification (2FA / MFA)
      </span>
    </div>

    <p style="font-size: 14px; color: #141413; line-height: 1.5; margin-bottom: 16px;">
      ${greeting} A login or security verification was requested for <strong>${recipient}</strong> on <strong>${contextTitle}</strong>.
    </p>

    <div style="background-color: #141413; color: #F4F3EF; text-align: center; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <div style="font-size: 11px; font-family: monospace; letter-spacing: 0.2em; text-transform: uppercase; color: #9E9D98; margin-bottom: 8px;">
        Security Verification Code
      </div>
      <div style="font-family: monospace; font-size: 38px; font-weight: 700; letter-spacing: 0.35em; color: #F4F3EF;">
        ${code}
      </div>
      <div style="font-size: 11px; color: #1F6F43; margin-top: 8px; font-family: monospace;">
        ⏱ Valid for 10 minutes • Single-use
      </div>
    </div>

    <div class="card" style="font-size: 12px; line-height: 1.6; color: #5E5D59;">
      Enter this code on your device to complete your sign-in. Never share this code with anyone. Tech Sokoni staff will never ask for your verification code.
    </div>
  `;

  const htmlContent = buildHtmlWrapper(
    'Two-Step Verification Code',
    `${contextTitle} • ${recipient}`,
    bodyContent
  );

  const textContent = `TECH SOKONI KENYA - TWO-STEP VERIFICATION CODE
====================================================
${greeting}
Verification code for ${contextTitle}:

YOUR 6-DIGIT CODE:
${code}

(Valid for 10 minutes)

Enter this code in your browser to complete authentication.
====================================================`;

  return await dispatchAndRecordNotification({
    type: 'test',
    recipient,
    subject,
    summary: `Two-step verification code [${code}] dispatched to ${recipient} for ${context}`,
    htmlContent,
    textContent,
    referenceId: `MFA-${code}`,
  });
}

// ============================================================================
// 7. Password Changed Confirmation Email
// ============================================================================

export async function sendPasswordChangedConfirmationEmail(
  recipient: string,
  clientName?: string
): Promise<EmailNotificationLog> {
  const subject = `✅ [Tech Sokoni] Your Account Password Was Successfully Updated`;
  const greeting = clientName ? `Hello ${clientName},` : 'Hello,';
  const timestamp = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order">✓ Password Updated</span>
    </div>

    <p style="font-size: 14px; color: #141413; line-height: 1.5; margin-bottom: 16px;">
      ${greeting} Your Tech Sokoni account password for <strong>${recipient}</strong> was successfully changed on <strong>${timestamp} (EAT)</strong>.
    </p>

    <div class="card" style="font-size: 12px; line-height: 1.6; color: #5E5D59;">
      You can now sign in using your new password. If you did not make this change, please contact our showroom concierge immediately at <a href="tel:+254792620789" style="color:#1F6F43;">+254 792 620 789</a> or <a href="mailto:shop@techsokoni.com" style="color:#141413;">shop@techsokoni.com</a>.
    </div>
  `;

  const htmlContent = buildHtmlWrapper(
    'Password Updated Successfully',
    `Account: ${recipient}`,
    bodyContent
  );

  const textContent = `TECH SOKONI KENYA - PASSWORD UPDATED
====================================================
${greeting}
Your account password for ${recipient} was successfully updated on ${timestamp} (EAT).

If you made this change, no further action is required.
If you did not authorize this, contact us immediately at +254 792 620 789.
====================================================`;

  return await dispatchAndRecordNotification({
    type: 'test',
    recipient,
    subject,
    summary: `Password change confirmation email dispatched to ${recipient}`,
    htmlContent,
    textContent,
  });
}

