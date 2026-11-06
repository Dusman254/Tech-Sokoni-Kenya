import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CATEGORIES,
  INITIAL_OFFERS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
} from './src/data/initialCatalog';
import {
  DEFAULT_BOOKING_CONFIG,
  DEFAULT_VIEWING_LOCATIONS,
  INITIAL_VIEWING_APPOINTMENTS,
  isValidKenyanPhone,
  normalizeKenyanPhone,
} from './src/data/viewingConfig';
import {
  CategoryInfo,
  ClientAccount,
  MpesaTransaction,
  Offer,
  Order,
  Product,
  SiteSettings,
  BookingConfig,
  ViewingAppointment,
  ViewingLocation,
  EmailNotificationLog,
  WarrantyRegistration,
} from './src/types/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TechSokoniDatabase {
  version: number;
  lastUpdated: string;
  products: Product[];
  orders: Order[];
  categories: CategoryInfo[];
  offers: Offer[];
  mpesaTransactions: MpesaTransaction[];
  clients: ClientAccount[];
  settings: SiteSettings;
  viewingAppointments: ViewingAppointment[];
  viewingLocations: ViewingLocation[];
  bookingConfig: BookingConfig;
  notifications: EmailNotificationLog[];
  warranties: WarrantyRegistration[];
}

const isVercel = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);
const DATA_DIR = isVercel ? '/tmp/tech_sokoni_data' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tech_sokoni_db.json');
const BACKUP_FILE = path.join(DATA_DIR, 'tech_sokoni_db_backup.json');

// In-memory active database instance (cached for zero-latency queries)
let dbMemory: TechSokoniDatabase | null = null;

function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function getInitialDatabase(): TechSokoniDatabase {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    categories: CATEGORIES,
    offers: INITIAL_OFFERS,
    mpesaTransactions: [],
    clients: [],
    settings: INITIAL_SETTINGS,
    viewingAppointments: INITIAL_VIEWING_APPOINTMENTS,
    viewingLocations: DEFAULT_VIEWING_LOCATIONS,
    bookingConfig: DEFAULT_BOOKING_CONFIG,
    notifications: [],
    warranties: [],
  };
}

/**
 * Initializes and loads the persistent database from disk.
 * If file does not exist, seeds it with initial showroom catalog and saves to disk.
 */
export function initServerDatabase(): TechSokoniDatabase {
  ensureDataDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as TechSokoniDatabase;
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.orders)) {
        parsed.products.forEach((p) => {
          if (!p.specs) {
            p.specs = {
              processor: '',
              ram: '',
              storage: '',
              screenSize: '',
              color: '',
              os: '',
              graphics: '',
              ports: '',
              battery: '',
              weight: '',
              warranty: '1 Year Official Warranty',
            };
          }
          if (!Array.isArray(p.reviews)) {
            p.reviews = [];
          }
          if (!Array.isArray(p.images)) {
            p.images = [];
          }
        });
        if (!Array.isArray(parsed.notifications)) {
          parsed.notifications = [];
        }
        if (!Array.isArray(parsed.warranties)) {
          parsed.warranties = [];
        }
        if (!parsed.settings) {
          parsed.settings = INITIAL_SETTINGS;
        } else {
          if (!parsed.settings.adminNotificationEmail) {
            parsed.settings.adminNotificationEmail = 'sirdusman@gmail.com';
          }
          if (parsed.settings.notifyOnNewOrder === undefined) parsed.settings.notifyOnNewOrder = true;
          if (parsed.settings.notifyOnNewBooking === undefined) parsed.settings.notifyOnNewBooking = true;
          if (parsed.settings.notifyOnWarrantyReg === undefined) parsed.settings.notifyOnWarrantyReg = true;
        }
        if (Array.isArray(parsed.clients)) {
          parsed.clients = parsed.clients.filter((c) => c.id !== 'client-brian-mwangi');
        }
        if (Array.isArray(parsed.viewingAppointments)) {
          parsed.viewingAppointments = parsed.viewingAppointments.filter(
            (v) => v.id !== 'viewing-tsv-2026-0001' && v.id !== 'viewing-tsv-2026-0002'
          );
        }
        dbMemory = parsed;
        persistDatabaseSync();
        console.log(
          `[Server Database]: Loaded and normalized ${dbMemory.products.length} products, ${dbMemory.orders.length} orders from ${DB_FILE}`
        );
        return dbMemory;
      }
    } catch (err: any) {
      console.error('[Server Database]: Error reading database file, attempting backup recovery:', err.message);
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const rawBackup = fs.readFileSync(BACKUP_FILE, 'utf-8');
          dbMemory = JSON.parse(rawBackup);
          console.log('[Server Database]: Restored from backup file successfully.');
          return dbMemory!;
        } catch {}
      }
    }
  }

  // Load bundled seed database if on Vercel
  if (isVercel) {
    try {
      const bundledPath = path.join(process.cwd(), 'data', 'tech_sokoni_db.json');
      if (fs.existsSync(bundledPath)) {
        const raw = fs.readFileSync(bundledPath, 'utf-8');
        const parsed = JSON.parse(raw) as TechSokoniDatabase;
        if (parsed && Array.isArray(parsed.products)) {
          dbMemory = parsed;
          persistDatabaseSync();
          return dbMemory;
        }
      }
    } catch {}
  }

  // Create initial database file
  dbMemory = getInitialDatabase();
  persistDatabaseSync();
  console.log(`[Server Database]: Initialized fresh database with ${dbMemory.products.length} products at ${DB_FILE}`);
  return dbMemory;
}

/**
 * Persists in-memory database to disk atomically using temporary file swap.
 */
export function persistDatabaseSync(): void {
  if (!dbMemory) return;
  try {
    ensureDataDirectory();

    dbMemory.lastUpdated = new Date().toISOString();
    const serialized = JSON.stringify(dbMemory, null, 2);
    const tempFile = path.join(DATA_DIR, `tech_sokoni_db_${Date.now()}_tmp.json`);

    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Maintain a secondary backup file
    fs.writeFileSync(BACKUP_FILE, serialized, 'utf-8');
  } catch (err: any) {
    console.warn('[Server Database]: Disk persist notice (memory active):', err?.message);
  }
}

export function getDatabase(): TechSokoniDatabase {
  if (!dbMemory) {
    return initServerDatabase();
  }
  return dbMemory;
}

/**
 * Returns public storefront data (hiding private customer orders and customer profiles)
 */
export function getPublicStorefrontData() {
  const db = getDatabase();
  return {
    version: db.version,
    lastUpdated: db.lastUpdated,
    products: db.products.filter((p) => !p.deletedAt),
    categories: db.categories,
    offers: db.offers,
    settings: db.settings,
    viewingLocations: db.viewingLocations.filter((l) => l.active),
    bookingConfig: db.bookingConfig,
  };
}

/**
 * Returns full administrative data (protected by admin authentication)
 */
export function getFullAdminData() {
  const db = getDatabase();
  const envSmtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || process.env.ZOHO_HOST;
  const envSmtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER || process.env.MAIL_USER || process.env.ZOHO_USER;
  const envSmtpPort = process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT;
  const envAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || process.env.ALERT_EMAIL;

  const mergedSettings = {
    ...db.settings,
    ...(envSmtpHost ? { smtpHost: envSmtpHost } : {}),
    ...(envSmtpUser ? { smtpUser: envSmtpUser } : {}),
    ...(envSmtpPort ? { smtpPort: Number(envSmtpPort) } : {}),
    ...(envAdminEmail ? { adminNotificationEmail: envAdminEmail } : {}),
  };

  return {
    ...db,
    settings: mergedSettings,
    allProducts: db.products,
    products: db.products.filter((p) => !p.deletedAt),
    deletedProducts: db.products.filter((p) => Boolean(p.deletedAt)),
  };
}

// ============================================================================
// CRUD Mutations with Permanent Disk Persistence
// ============================================================================

export function addProduct(productData: Partial<Product> & Omit<Product, 'id'>): Product {
  const db = getDatabase();
  const id = productData.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newProduct: Product = {
    ...productData,
    id,
    stock: Number(productData.stock) || 0,
    price: Number(productData.price) || 0,
    salePrice: productData.salePrice ? Number(productData.salePrice) : undefined,
    specs: productData.specs || {
      processor: '',
      ram: '',
      storage: '',
      screenSize: '',
      color: '',
      os: '',
      graphics: '',
      ports: '',
      battery: '',
      weight: '',
      warranty: '1 Year Official Warranty',
    },
    reviews: Array.isArray(productData.reviews) ? productData.reviews : [],
    images:
      Array.isArray(productData.images) && productData.images.length > 0
        ? productData.images
        : [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800',
          ],
  };

  db.products.unshift(newProduct);
  persistDatabaseSync();
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const db = getDatabase();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = db.products[index];
  const updated: Product = {
    ...current,
    ...updates,
    id: current.id, // Preserve ID
    stock: updates.stock !== undefined ? Number(updates.stock) : current.stock,
    price: updates.price !== undefined ? Number(updates.price) : current.price,
  };

  db.products[index] = updated;
  persistDatabaseSync();
  return updated;
}

export function deleteProduct(id: string, permanent = false): boolean {
  const db = getDatabase();
  if (permanent) {
    const prevLen = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length !== prevLen) {
      persistDatabaseSync();
      return true;
    }
    return false;
  }

  // Soft delete (move to 30-day Recycle Bin)
  const product = db.products.find((p) => p.id === id);
  if (!product) return false;
  product.deletedAt = new Date().toISOString();
  persistDatabaseSync();
  return true;
}

export function restoreProduct(id: string): Product | null {
  const db = getDatabase();
  const product = db.products.find((p) => p.id === id);
  if (!product) return null;
  delete product.deletedAt;
  persistDatabaseSync();
  return product;
}

export function addOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>): Order {
  const db = getDatabase();
  const nextNum = 1001 + db.orders.length;
  const nowIso = new Date().toISOString();

  const orderNumber = `TS-2026-${nextNum}`;
  const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newOrder: Order = {
    ...orderData,
    id,
    orderNumber,
    status: 'Processing',
    trackingNote:
      orderData.paymentMethod === 'M-Pesa Express'
        ? orderData.mpesaCode
          ? `Order logged with M-Pesa Ref ${orderData.mpesaCode}. Awaiting dispatch from Kenyatta Pioneer Bldg Shop 514.`
          : 'Order logged. Awaiting Lipa Na M-Pesa Till 9309020 confirmation for immediate dispatch.'
        : 'Order logged for Payment on Delivery. Package prepared for courier dispatch.',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.orders.unshift(newOrder);

  // Atomically decrement inventory for ordered items
  for (const item of newOrder.items) {
    const prod = db.products.find((p) => p.id === item.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
    }
  }

  // Record M-Pesa transaction if provided
  if (newOrder.mpesaCode || newOrder.paymentMethod === 'M-Pesa Express') {
    const mpesaTx: MpesaTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      customerEmail: newOrder.customerEmail || '',
      amount: newOrder.total,
      tillNumber: '9309020',
      mpesaCode: newOrder.mpesaCode || `PENDING-${newOrder.orderNumber}`,
      mpesaMessage: newOrder.mpesaMessage || `M-Pesa payment for ${newOrder.orderNumber}`,
      status: newOrder.mpesaStatus || 'Pending Verification',
      createdAt: nowIso,
    };
    db.mpesaTransactions.unshift(mpesaTx);
  }

  // Save or update client profile if client email/phone provided
  if (newOrder.customerEmail || newOrder.customerPhone) {
    const existingClient = db.clients.find(
      (c) =>
        (newOrder.customerEmail && c.email.toLowerCase() === newOrder.customerEmail.toLowerCase()) ||
        c.phone === newOrder.customerPhone
    );
    if (existingClient) {
      existingClient.defaultAddress = newOrder.shippingAddress || existingClient.defaultAddress;
      existingClient.city = newOrder.city || existingClient.city;
    } else {
      db.clients.unshift({
        id: `client-${Date.now()}`,
        name: newOrder.customerName,
        email: newOrder.customerEmail || `${newOrder.customerPhone.replace(/\D/g, '')}@techsokoni.co.ke`,
        phone: newOrder.customerPhone,
        defaultAddress: newOrder.shippingAddress,
        city: newOrder.city,
        createdAt: nowIso,
      });
    }
  }

  persistDatabaseSync();
  return newOrder;
}

export function updateOrderStatus(id: string, status: Order['status'], trackingNote?: string): Order | null {
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) return null;

  order.status = status;
  if (trackingNote) {
    order.trackingNote = trackingNote;
  }
  order.updatedAt = new Date().toISOString();

  persistDatabaseSync();
  return order;
}

export function trackOrder(query: string): Order | null {
  if (!query || typeof query !== 'string') return null;
  const db = getDatabase();
  const q = query.trim().toLowerCase();

  const found = db.orders.find(
    (o) =>
      o.orderNumber.toLowerCase() === q ||
      o.id.toLowerCase() === q ||
      o.customerPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
  );

  return found || null;
}

export function addViewingAppointment(data: Omit<ViewingAppointment, 'id' | 'bookingReference' | 'status' | 'auditTrail' | 'createdAt' | 'updatedAt'>): ViewingAppointment {
  const db = getDatabase();
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const bookingReference = `TSV-${year}-${rand}`;
  const now = new Date().toISOString();

  const initialStatus = db.bookingConfig.requireApproval ? 'Pending Confirmation' : 'Confirmed';

  const newApp: ViewingAppointment = {
    ...data,
    id: `viewing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    bookingReference,
    customerPhone: normalizeKenyanPhone(data.customerPhone),
    status: initialStatus,
    auditTrail: [
      {
        timestamp: now,
        action: 'Booking Created',
        newStatus: initialStatus,
        actor: data.customerName || 'customer',
        note: `Physical viewing booked for ${data.productName} on ${data.viewingDate} at ${data.viewingTimeSlot}.`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.viewingAppointments.unshift(newApp);
  persistDatabaseSync();
  return newApp;
}

export function updateViewingAppointment(
  id: string,
  updates: Partial<ViewingAppointment>,
  auditNote?: string,
  actor = 'admin'
): ViewingAppointment | null {
  const db = getDatabase();
  const app = db.viewingAppointments.find((a) => a.id === id || a.bookingReference === id);
  if (!app) return null;

  const now = new Date().toISOString();
  if (updates.status && updates.status !== app.status) {
    app.auditTrail = [
      {
        timestamp: now,
        action: `Status changed to ${updates.status}`,
        previousStatus: app.status,
        newStatus: updates.status,
        actor,
        note: auditNote || updates.cancellationReason,
      },
      ...(app.auditTrail || []),
    ];
  }

  Object.assign(app, updates);
  app.updatedAt = now;

  persistDatabaseSync();
  return app;
}

export function updateSiteSettings(updates: Partial<SiteSettings>): SiteSettings {
  const db = getDatabase();
  db.settings = { ...db.settings, ...updates };
  persistDatabaseSync();
  return db.settings;
}

export function updateBookingConfig(updates: Partial<BookingConfig>): BookingConfig {
  const db = getDatabase();
  db.bookingConfig = { ...db.bookingConfig, ...updates };
  persistDatabaseSync();
  return db.bookingConfig;
}

export function addViewingLocation(locData: Omit<ViewingLocation, 'id'>): ViewingLocation {
  const db = getDatabase();
  const newLoc: ViewingLocation = {
    ...locData,
    id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  db.viewingLocations.push(newLoc);
  persistDatabaseSync();
  return newLoc;
}

export function updateViewingLocation(id: string, updates: Partial<ViewingLocation>): ViewingLocation | null {
  const db = getDatabase();
  const loc = db.viewingLocations.find((l) => l.id === id);
  if (!loc) return null;
  Object.assign(loc, updates);
  persistDatabaseSync();
  return loc;
}

export function deleteViewingLocation(id: string): boolean {
  const db = getDatabase();
  const prevLen = db.viewingLocations.length;
  db.viewingLocations = db.viewingLocations.filter((l) => l.id !== id);
  if (db.viewingLocations.length !== prevLen) {
    persistDatabaseSync();
    return true;
  }
  return false;
}

export function addNotificationLog(notification: EmailNotificationLog): void {
  const db = getDatabase();
  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }
  db.notifications.unshift(notification);
  // Keep the most recent 100 notifications
  if (db.notifications.length > 100) {
    db.notifications.pop();
  }
  persistDatabaseSync();
}

export function getNotifications(): EmailNotificationLog[] {
  const db = getDatabase();
  return db.notifications || [];
}

export function addWarrantyRegistration(reg: WarrantyRegistration): WarrantyRegistration {
  const db = getDatabase();
  if (!Array.isArray(db.warranties)) {
    db.warranties = [];
  }
  const existingIdx = db.warranties.findIndex(
    (w) => w.serialNumber.toUpperCase() === reg.serialNumber.toUpperCase()
  );
  if (existingIdx >= 0) {
    db.warranties[existingIdx] = reg;
  } else {
    db.warranties.unshift(reg);
  }
  persistDatabaseSync();
  return reg;
}

export function getWarrantyRegistrations(): WarrantyRegistration[] {
  const db = getDatabase();
  return db.warranties || [];
}

export function updateClientPassword(email: string, newPasswordPlain: string): boolean {
  const db = getDatabase();
  const normalized = email.trim().toLowerCase();
  const client = db.clients.find((c) => c.email.toLowerCase() === normalized);
  if (client) {
    client.password = newPasswordPlain;
    persistDatabaseSync();
    return true;
  }
  // If client account doesn't exist yet in local array, create profile with new password
  db.clients.unshift({
    id: `client-${Date.now()}`,
    name: email.split('@')[0],
    email: normalized,
    phone: '',
    password: newPasswordPlain,
    defaultAddress: '',
    city: 'Nairobi',
    createdAt: new Date().toISOString(),
  });
  persistDatabaseSync();
  return true;
}

export function updateClientMfa(email: string, enabled: boolean): boolean {
  const db = getDatabase();
  const normalized = email.trim().toLowerCase();
  const client = db.clients.find((c) => c.email.toLowerCase() === normalized);
  if (client) {
    client.mfaEnabled = enabled;
    persistDatabaseSync();
    return true;
  }
  return false;
}


export function findClientByEmail(email: string): ClientAccount | undefined {
  const db = getDatabase();
  const normalized = (email || '').trim().toLowerCase();
  return db.clients.find((c) => c.email.toLowerCase() === normalized);
}

export function saveOrUpdateClient(clientData: Partial<ClientAccount> & { email: string }): ClientAccount {
  const db = getDatabase();
  const normalized = clientData.email.trim().toLowerCase();
  const existingIdx = db.clients.findIndex((c) => c.email.toLowerCase() === normalized);

  if (existingIdx >= 0) {
    db.clients[existingIdx] = {
      ...db.clients[existingIdx],
      ...clientData,
      email: normalized,
    };
    persistDatabaseSync();
    return db.clients[existingIdx];
  }

  const newClient: ClientAccount = {
    id: clientData.id || `client-${Date.now()}`,
    uid: clientData.uid,
    name: clientData.name || normalized.split('@')[0],
    email: normalized,
    phone: clientData.phone || '',
    password: clientData.password,
    defaultAddress: clientData.defaultAddress || '',
    city: clientData.city || 'Nairobi',
    authProvider: clientData.authProvider || 'password',
    photoURL: clientData.photoURL,
    mfaEnabled: clientData.mfaEnabled ?? false,
    createdAt: clientData.createdAt || new Date().toISOString(),
  };

  db.clients.unshift(newClient);
  persistDatabaseSync();
  return newClient;
}

export function verifyClientPassword(email: string, passwordPlain: string): ClientAccount | null {
  const client = findClientByEmail(email);
  if (!client) return null;
  // If client has password set, verify match
  if (client.password && client.password === passwordPlain) {
    return client;
  }
  return null;
}



