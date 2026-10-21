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
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tech_sokoni_db.json');
const BACKUP_FILE = path.join(DATA_DIR, 'tech_sokoni_db_backup.json');

// In-memory active database instance (cached for zero-latency queries)
let dbMemory: TechSokoniDatabase | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
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
    clients: [
      {
        id: 'client-brian-mwangi',
        name: 'Brian Mwangi',
        email: 'brian.mwangi@techfirm.co.ke',
        phone: '+254 722 410 932',
        defaultAddress: 'Riverside Drive, Westlands',
        city: 'Nairobi',
        createdAt: '2026-03-01T08:00:00Z',
      },
    ],
    settings: INITIAL_SETTINGS,
    viewingAppointments: INITIAL_VIEWING_APPOINTMENTS,
    viewingLocations: DEFAULT_VIEWING_LOCATIONS,
    bookingConfig: DEFAULT_BOOKING_CONFIG,
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
  ensureDataDirectory();

  dbMemory.lastUpdated = new Date().toISOString();
  const serialized = JSON.stringify(dbMemory, null, 2);
  const tempFile = path.join(DATA_DIR, `tech_sokoni_db_${Date.now()}_tmp.json`);

  try {
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Maintain a secondary backup file
    fs.writeFileSync(BACKUP_FILE, serialized, 'utf-8');
  } catch (err: any) {
    console.error('[Server Database]: Failed to write database to disk:', err.message);
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {}
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
  return {
    ...db,
    allProducts: db.products,
    products: db.products.filter((p) => !p.deletedAt),
    deletedProducts: db.products.filter((p) => Boolean(p.deletedAt)),
  };
}

// ============================================================================
// CRUD Mutations with Permanent Disk Persistence
// ============================================================================

export function addProduct(productData: Omit<Product, 'id'>): Product {
  const db = getDatabase();
  const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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
