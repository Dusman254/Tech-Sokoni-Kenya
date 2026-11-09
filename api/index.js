// server.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { GoogleGenAI, Type } from "@google/genai";

// serverDb.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/data/initialCatalog.ts
var STUDIO_IMAGES = {
  laptopPro: "/src/assets/images/product_laptop_pro_1790801590092.jpg",
  smartphoneUltra: "/src/assets/images/product_smartphone_ultra_1790801601802.jpg",
  desktopWorkstation: "/src/assets/images/product_desktop_workstation_1790801612830.jpg",
  monitorStudio: "/src/assets/images/product_monitor_studio_1790801622847.jpg",
  headphonesAnc: "/src/assets/images/product_headphones_anc_1790801633558.jpg",
  printerLaser: "/src/assets/images/product_printer_laser_1790801643724.jpg",
  tabletPro: "/src/assets/images/product_tablet_pro_1790801656180.jpg",
  networkingRouter: "/src/assets/images/product_networking_router_1790801665360.jpg"
};
var CATEGORIES = [
  {
    id: "laptops",
    name: "Laptops",
    shortLabel: "Laptops",
    tagline: "Work. Create. Perform.",
    editorialHeadline: "Portable power for business, studio and everyday computing.",
    description: "MacBook Pro, HP EliteBook, Dell XPS, Lenovo ThinkPad, and professional notebooks stocked at our Nairobi CBD showroom.",
    image: STUDIO_IMAGES.laptopPro,
    startingPrice: 45e3
  },
  {
    id: "phones",
    name: "Phones",
    shortLabel: "Phones",
    tagline: "Stay connected.",
    editorialHeadline: "Flagship smartphones with official warranty.",
    description: "iPhone, Samsung Galaxy Ultra, and Google Pixel devices with genuine local & manufacturer coverage.",
    image: STUDIO_IMAGES.smartphoneUltra,
    startingPrice: 35e3
  },
  {
    id: "desktops",
    name: "Desktops",
    shortLabel: "Desktops",
    tagline: "Built for productivity.",
    editorialHeadline: "Desktops, All-in-Ones, and studio workstations.",
    description: "High-sustained performance towers, compact mini PCs, and enterprise desktop systems.",
    image: STUDIO_IMAGES.desktopWorkstation,
    startingPrice: 55e3
  },
  {
    id: "monitors",
    name: "Monitors",
    shortLabel: "Monitors",
    tagline: "See every detail.",
    editorialHeadline: "4K, 5K & 6K studio and office displays.",
    description: "Color-accurate IPS Black, OLED, and Ultrawide displays for creators, engineers, and corporate desks.",
    image: STUDIO_IMAGES.monitorStudio,
    startingPrice: 28e3
  },
  {
    id: "printers",
    name: "Printers",
    shortLabel: "Printers",
    tagline: "Print with confidence.",
    editorialHeadline: "LaserJet, EcoTank & commercial multifunction printers.",
    description: "High-yield office printers, wireless scanners, and genuine toner supplies.",
    image: STUDIO_IMAGES.printerLaser,
    startingPrice: 24e3
  },
  {
    id: "tablets",
    name: "Tablets",
    shortLabel: "Tablets",
    tagline: "Sketch. Note. Present.",
    editorialHeadline: "iPad Pro, Galaxy Tab & portable creative slates.",
    description: "Ultra-thin OLED and Liquid Retina tablets engineered for design, field operations, and executive mobility.",
    image: STUDIO_IMAGES.tabletPro,
    startingPrice: 42e3
  },
  {
    id: "accessories",
    name: "Accessories",
    shortLabel: "Accessories",
    tagline: "Complete your setup.",
    editorialHeadline: "Studio audio, mechanical keyboards, docks & power.",
    description: "ANC headphones, Thunderbolt 4 docks, ergonomic mice, and genuine adapters.",
    image: STUDIO_IMAGES.headphonesAnc,
    startingPrice: 3500
  },
  {
    id: "networking",
    name: "Networking",
    shortLabel: "Networking",
    tagline: "Multi-gigabit Wi-Fi 7 mesh.",
    editorialHeadline: "Enterprise routers, switches, and access points.",
    description: "High-throughput Wi-Fi 7 mesh systems, MikroTik, Ubiquiti UniFi, and office networking hardware.",
    image: STUDIO_IMAGES.networkingRouter,
    startingPrice: 8500
  },
  {
    id: "storage",
    name: "Storage",
    shortLabel: "Storage",
    tagline: "High-speed NVMe & NAS.",
    editorialHeadline: "Portable NVMe SSDs, enterprise drives & backup.",
    description: "Rugged Thunderbolt external SSDs, internal M.2 NVMe modules, and multi-bay NAS storage.",
    image: STUDIO_IMAGES.desktopWorkstation,
    startingPrice: 9500
  },
  {
    id: "gaming",
    name: "Gaming",
    shortLabel: "Gaming",
    tagline: "High-refresh performance.",
    editorialHeadline: "Consoles, RTX gaming rigs & pro peripherals.",
    description: "PlayStation 5, high-refresh gaming laptops, and custom-cooled graphics systems.",
    image: STUDIO_IMAGES.laptopPro,
    startingPrice: 65e3
  }
];
var INITIAL_PRODUCTS = [
  {
    id: "prod-macbook-pro-16-m3",
    sku: "TS-MBP-16-M3P",
    name: 'Apple MacBook Pro 16" (M3 Pro, 18GB, 512GB)',
    brand: "Apple",
    category: "laptops",
    price: 345e3,
    salePrice: 335e3,
    stock: 5,
    condition: "New",
    shortSpec: 'Apple M3 Pro \xB7 18GB Unified \xB7 512GB SSD \xB7 16.2" Liquid Retina XDR \xB7 Space Black',
    shortDescription: "Pro performance powerhouse with 12-core CPU, 18-core GPU, up to 22 hours battery life, and studio-grade audio.",
    description: "Engineered for developers, audio engineers, and creative directors. Features Liquid Retina XDR display with 1,600 nits peak HDR brightness, three Thunderbolt 4 ports, MagSafe 3, HDMI, and SDXC card reader. 100% genuine Apple serial verified with 6-Month Local & Manufacturer Warranty.",
    images: [STUDIO_IMAGES.laptopPro],
    specs: {
      processor: "Apple M3 Pro (12-Core CPU, 18-Core GPU)",
      ram: "18GB Unified Memory",
      storage: "512GB High-Speed PCIe SSD",
      screenSize: "16.2-inch Liquid Retina XDR (3456 x 2234)",
      color: "Space Black",
      os: "macOS Sonoma",
      battery: "100Wh Lithium-Polymer (up to 22h)",
      weight: "2.14 kg",
      warranty: "6 Months Official Tech Sokoni Warranty"
    },
    variations: [
      {
        id: "var-storage",
        name: "Storage",
        options: [
          { id: "opt-512gb", label: "512GB SSD", priceDelta: 0, inStock: true },
          { id: "opt-1tb", label: "1TB SSD", priceDelta: 35e3, inStock: true }
        ]
      },
      {
        id: "var-ram",
        name: "Unified RAM",
        options: [
          { id: "opt-18gb", label: "18GB Unified", priceDelta: 0, inStock: true },
          { id: "opt-36gb", label: "36GB Unified", priceDelta: 5e4, inStock: true }
        ]
      }
    ],
    featured: true,
    isNewArrival: true,
    inShowroomRail: true,
    rating: 5,
    reviewCount: 14,
    reviews: [],
    deliveryInfo: "Same-day 2-hour courier across Nairobi or in-person viewing at Kenyatta Pioneer Shop 514.",
    allowSampleViewing: true
  },
  {
    id: "prod-dell-xps-15-9530",
    sku: "TS-XPS-15-9530",
    name: "Dell XPS 15 9530 (Core i7-13700H, 32GB, 1TB, RTX 4060)",
    brand: "Dell",
    category: "laptops",
    price: 215e3,
    stock: 3,
    condition: "Refurbished",
    shortSpec: 'Core i7-13700H \xB7 32GB DDR5 \xB7 1TB NVMe \xB7 15.6" 3.5K OLED Touch \xB7 RTX 4060 8GB',
    shortDescription: "CNC machined aluminum executive workstation with stunning InfinityEdge 3.5K OLED touchscreen and discrete NVIDIA GeForce graphics.",
    description: "Premium creator workstation with 14-core Intel Core i7, 32GB DDR5 dual-channel memory, and calibrated OLED panel with 100% DCI-P3 color gamut. Fully diagnostic-tested with 100% battery health and clean cosmetic chassis. 6 Months Tech Sokoni Local Warranty.",
    images: [STUDIO_IMAGES.laptopPro],
    specs: {
      processor: "Intel Core i7-13700H (14 Cores, 20 Threads, up to 5.0GHz)",
      ram: "32GB DDR5 4800MHz",
      storage: "1TB PCIe 4.0 NVMe SSD",
      screenSize: "15.6-inch 3.5K (3456 x 2160) OLED Touch",
      graphics: "NVIDIA GeForce RTX 4060 8GB GDDR6",
      color: "Platinum Silver exterior / Black carbon fiber palmrest",
      os: "Windows 11 Pro",
      battery: "86Wh (Excellent Health)",
      weight: "1.92 kg",
      warranty: "6 Months Tech Sokoni Showroom Warranty"
    },
    featured: true,
    isNewArrival: false,
    inShowroomRail: true,
    rating: 4.9,
    reviewCount: 9,
    reviews: [],
    deliveryInfo: "In-person inspection encouraged at Kenyatta Avenue showroom before payment.",
    allowSampleViewing: true
  },
  {
    id: "prod-hp-elitebook-840-g10",
    sku: "TS-HP-840-G10",
    name: "HP EliteBook 840 G10 (Core i7-1365U, 16GB, 512GB)",
    brand: "HP",
    category: "laptops",
    price: 148e3,
    salePrice: 142e3,
    stock: 8,
    condition: "New",
    shortSpec: 'Core i7-1365U vPro \xB7 16GB DDR5 \xB7 512GB Gen4 SSD \xB7 14" WUXGA Anti-Glare \xB7 Silver',
    shortDescription: "Enterprise executive standard with HP Wolf Security, ultra-light magnesium chassis, 5MP IR webcam, and Bang & Olufsen audio.",
    description: "Built for heavy commercial and corporate workflows. Features HP Sure Start self-healing BIOS, backlit spill-resistant keyboard, Wi-Fi 6E, and all-day battery life. Brand new sealed unit with 6 Months Local Kenya Warranty.",
    images: [STUDIO_IMAGES.laptopPro],
    specs: {
      processor: "Intel Core i7-1365U (10 Cores, 12 Threads, vPro Enterprise)",
      ram: "16GB DDR5 5200MHz",
      storage: "512GB PCIe Gen4 NVMe TLC SSD",
      screenSize: "14.0-inch WUXGA (1920 x 1200) IPS 400 nits",
      color: "Pike Silver Aluminum",
      os: "Windows 11 Pro Licensed",
      battery: "51Wh Long Life (Fast charge 50% in 30 mins)",
      weight: "1.36 kg",
      warranty: "6 Months HP Kenya & Tech Sokoni Warranty"
    },
    featured: false,
    isNewArrival: true,
    inShowroomRail: true,
    rating: 4.8,
    reviewCount: 11,
    reviews: [],
    deliveryInfo: "Available for in-person testing at Kenyatta Pioneer Shop 514 or Same-Day Delivery.",
    allowSampleViewing: true
  },
  {
    id: "prod-lenovo-thinkpad-x1-carbon-gen11",
    sku: "TS-LEN-X1C-G11",
    name: "Lenovo ThinkPad X1 Carbon Gen 11 (Core i7, 16GB, 512GB)",
    brand: "Lenovo",
    category: "laptops",
    price: 175e3,
    stock: 4,
    condition: "Refurbished",
    shortSpec: 'Core i7-1355U \xB7 16GB LPDDR5 \xB7 512GB NVMe \xB7 14" 2.8K OLED \xB7 Deep Black',
    shortDescription: "Ultra-durable carbon-fiber flagship with legendary ThinkPad keyboard, 2.8K OLED display, and MIL-STD 810H military certification.",
    description: "The gold standard in portable corporate computing. Certified against 12 military-grade requirements and more than 200 quality checks. Includes fingerprint reader, Windows Hello facial recognition, and dual Thunderbolt 4 ports. 6 Months Showroom Warranty.",
    images: [STUDIO_IMAGES.laptopPro],
    specs: {
      processor: "Intel Core i7-1355U (10 Cores, 12 Threads)",
      ram: "16GB Soldered LPDDR5 6400MHz",
      storage: "512GB M.2 2280 PCIe 4.0 SSD",
      screenSize: "14.0-inch 2.8K (2880 x 1800) OLED 400 nits 100% DCI-P3",
      color: "Deep Black Carbon Fiber weave",
      os: "Windows 11 Pro",
      battery: "57Wh (Rapid Charge)",
      weight: "1.12 kg",
      warranty: "6 Months Tech Sokoni Warranty"
    },
    featured: false,
    isNewArrival: false,
    inShowroomRail: true,
    rating: 5,
    reviewCount: 8,
    reviews: [],
    deliveryInfo: "Test keyboard, display, and battery health at our Kenyatta Avenue showroom.",
    allowSampleViewing: true
  }
];
var INITIAL_OFFERS = [];
var INITIAL_ORDERS = [];
var INITIAL_SETTINGS = {
  heroHeadline: "Technology that moves you.",
  heroSupportingText: "Discover laptops, phones, desktops, printers and accessories selected for work, creativity, gaming and everyday life.",
  tickerMessages: [
    "TECH SOKONI KENYA \u2014 KENYATTA PIONEER BUILDING, 5TH FLOOR, SHOP 514",
    "ORDERS & WHATSAPP HOTLINE: +254 792 620 789",
    "INSPECT PACKAGE UPON ARRIVAL BEFORE PAYING VIA CASH OR M-PESA",
    "LIPA NA M-PESA BUY GOODS TILL NO: 9309020",
    "100% FREE NATIONWIDE SHIPPING & 2-HOUR NAIROBI EXPRESS DELIVERY"
  ],
  currencySymbol: "KSh ",
  freeShippingThreshold: 0,
  supportPhone: "+254 792 620 789",
  supportEmail: "shop@techsokoni.com",
  showroomAddress: "Kenyatta Pioneer Building, 5th Floor, Shop 514, Kenyatta Avenue (Next to I&M Building), Nairobi CBD, Kenya",
  adminNotificationEmail: "sirdusman@gmail.com",
  notifyOnNewOrder: true,
  notifyOnNewBooking: true,
  notifyOnWarrantyReg: true
};

// src/data/viewingConfig.ts
var DEFAULT_VIEWING_LOCATIONS = [
  {
    id: "loc-nbi-cbd",
    name: "Tech Sokoni Flagship Showroom",
    address: "Kenyatta Avenue, Nairobi CBD, Kenya",
    building: "Kenyatta Pioneer Building (Next to I&M Building)",
    floor: "5th Floor",
    room: "Shop 514",
    mapsUrl: "https://maps.google.com/?q=Kenyatta+Pioneer+Building+Nairobi",
    phone: "+254 792 620 789",
    whatsapp: "+254 792 620 789",
    visitorInstructions: "Take the passenger lifts to Floor 5, turn right down the boutique gallery corridor to Shop 514. Inform our showroom concierge of your booking reference.",
    active: true
  },
  {
    id: "loc-westlands",
    name: "Tech Sokoni Westlands Inspection Point",
    address: "Waiyaki Way & Mpaka Road Junction, Westlands, Nairobi",
    building: "The Mirage Tower 2",
    floor: "3rd Floor",
    room: "Suite 308",
    mapsUrl: "https://maps.google.com/?q=The+Mirage+Waiyaki+Way+Nairobi",
    phone: "+254 792 620 789",
    whatsapp: "+254 792 620 789",
    visitorInstructions: "Visitor parking available in basement B1. Security will guide you to Tower 2 elevators, 3rd floor executive lounge.",
    active: true
  }
];
var DEFAULT_BOOKING_CONFIG = {
  enabled: true,
  appointmentDurationMinutes: 30,
  startHour: 9,
  // 9:00 AM
  endHour: 18,
  // 6:00 PM (last slot 5:30 PM)
  workingDays: [1, 2, 3, 4, 5, 6],
  // Mon-Sat
  maxAdvanceDays: 14,
  minNoticeHours: 2,
  maxConcurrentPerSlot: 2,
  blockedDates: [],
  blockedSlots: [],
  defaultLocationId: "loc-nbi-cbd",
  requireApproval: false
  // Confirmed on creation if slot is open
};
function normalizeKenyanPhone(phone) {
  const clean = phone.replace(/[\s\-\(\)]/g, "");
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
var INITIAL_VIEWING_APPOINTMENTS = [];

// serverDb.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isVercel = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
);
var DATA_DIR = isVercel ? "/tmp/tech_sokoni_data" : path.join(__dirname, "data");
var DB_FILE = path.join(DATA_DIR, "tech_sokoni_db.json");
var BACKUP_FILE = path.join(DATA_DIR, "tech_sokoni_db_backup.json");
var dbMemory = null;
function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
  }
}
function getInitialDatabase() {
  return {
    version: 1,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
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
    warranties: []
  };
}
function initServerDatabase() {
  ensureDataDirectory();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.orders)) {
        parsed.products.forEach((p) => {
          if (!p.specs) {
            p.specs = {
              processor: "",
              ram: "",
              storage: "",
              screenSize: "",
              color: "",
              os: "",
              graphics: "",
              ports: "",
              battery: "",
              weight: "",
              warranty: "1 Year Official Warranty"
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
            parsed.settings.adminNotificationEmail = "sirdusman@gmail.com";
          }
          if (parsed.settings.notifyOnNewOrder === void 0) parsed.settings.notifyOnNewOrder = true;
          if (parsed.settings.notifyOnNewBooking === void 0) parsed.settings.notifyOnNewBooking = true;
          if (parsed.settings.notifyOnWarrantyReg === void 0) parsed.settings.notifyOnWarrantyReg = true;
        }
        if (Array.isArray(parsed.orders)) {
          parsed.orders = parsed.orders.filter(
            (o) => o.orderNumber !== "TS-2026-1001" && o.orderNumber !== "TS-2026-1002" && o.orderNumber !== "TS-2026-1003" && o.id !== "ord-1793374569543-ytvn" && o.id !== "ord-1792510778081-1dzp" && o.id !== "ord-1792490900805-7vcf"
          );
        }
        if (Array.isArray(parsed.mpesaTransactions)) {
          parsed.mpesaTransactions = parsed.mpesaTransactions.filter(
            (tx) => tx.orderNumber !== "TS-2026-1003" && tx.id !== "tx-1793374569543-7cwc"
          );
        }
        if (Array.isArray(parsed.clients)) {
          parsed.clients = parsed.clients.filter(
            (c) => c.id !== "client-brian-mwangi" && c.email !== "wanjiku@example.com" && c.email !== "alice.otieno@techsokoni.co.ke" && c.email !== "grace.wanjiku@test.co.ke"
          );
        }
        if (Array.isArray(parsed.viewingAppointments)) {
          parsed.viewingAppointments = parsed.viewingAppointments.filter(
            (v) => v.bookingReference !== "TSV-2026-3338" && v.bookingReference !== "TSV-2026-7785" && v.id !== "viewing-1793374552630-twhd" && v.id !== "viewing-1792490919221-1yae" && v.id !== "viewing-tsv-2026-0001" && v.id !== "viewing-tsv-2026-0002"
          );
        }
        dbMemory = parsed;
        persistDatabaseSync();
        console.log(
          `[Server Database]: Loaded and normalized ${dbMemory.products.length} products, ${dbMemory.orders.length} orders from ${DB_FILE}`
        );
        return dbMemory;
      }
    } catch (err) {
      console.error("[Server Database]: Error reading database file, attempting backup recovery:", err.message);
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const rawBackup = fs.readFileSync(BACKUP_FILE, "utf-8");
          dbMemory = JSON.parse(rawBackup);
          console.log("[Server Database]: Restored from backup file successfully.");
          return dbMemory;
        } catch {
        }
      }
    }
  }
  if (isVercel) {
    try {
      const bundledPath = path.join(process.cwd(), "data", "tech_sokoni_db.json");
      if (fs.existsSync(bundledPath)) {
        const raw = fs.readFileSync(bundledPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products)) {
          dbMemory = parsed;
          persistDatabaseSync();
          return dbMemory;
        }
      }
    } catch {
    }
  }
  dbMemory = getInitialDatabase();
  persistDatabaseSync();
  console.log(`[Server Database]: Initialized fresh database with ${dbMemory.products.length} products at ${DB_FILE}`);
  return dbMemory;
}
function persistDatabaseSync() {
  if (!dbMemory) return;
  try {
    ensureDataDirectory();
    dbMemory.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    const serialized = JSON.stringify(dbMemory, null, 2);
    const tempFile = path.join(DATA_DIR, `tech_sokoni_db_${Date.now()}_tmp.json`);
    fs.writeFileSync(tempFile, serialized, "utf-8");
    fs.renameSync(tempFile, DB_FILE);
    fs.writeFileSync(BACKUP_FILE, serialized, "utf-8");
  } catch (err) {
    console.warn("[Server Database]: Disk persist notice (memory active):", err?.message);
  }
}
function getDatabase() {
  if (!dbMemory) {
    return initServerDatabase();
  }
  return dbMemory;
}
function getPublicStorefrontData() {
  const db = getDatabase();
  return {
    version: db.version,
    lastUpdated: db.lastUpdated,
    products: db.products.filter((p) => !p.deletedAt),
    categories: db.categories,
    offers: db.offers,
    settings: db.settings,
    viewingLocations: db.viewingLocations.filter((l) => l.active),
    bookingConfig: db.bookingConfig
  };
}
function getFullAdminData() {
  const db = getDatabase();
  const envSmtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || process.env.ZOHO_HOST;
  const envSmtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER || process.env.MAIL_USER || process.env.ZOHO_USER;
  const envSmtpPort = process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT;
  const envAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || process.env.ALERT_EMAIL;
  const mergedSettings = {
    ...db.settings,
    ...envSmtpHost ? { smtpHost: envSmtpHost } : {},
    ...envSmtpUser ? { smtpUser: envSmtpUser } : {},
    ...envSmtpPort ? { smtpPort: Number(envSmtpPort) } : {},
    ...envAdminEmail ? { adminNotificationEmail: envAdminEmail } : {}
  };
  return {
    ...db,
    settings: mergedSettings,
    allProducts: db.products,
    products: db.products.filter((p) => !p.deletedAt),
    deletedProducts: db.products.filter((p) => Boolean(p.deletedAt))
  };
}
function addProduct(productData) {
  const db = getDatabase();
  const id = productData.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newProduct = {
    ...productData,
    id,
    stock: Number(productData.stock) || 0,
    price: Number(productData.price) || 0,
    salePrice: productData.salePrice ? Number(productData.salePrice) : void 0,
    specs: productData.specs || {
      processor: "",
      ram: "",
      storage: "",
      screenSize: "",
      color: "",
      os: "",
      graphics: "",
      ports: "",
      battery: "",
      weight: "",
      warranty: "1 Year Official Warranty"
    },
    reviews: Array.isArray(productData.reviews) ? productData.reviews : [],
    images: Array.isArray(productData.images) && productData.images.length > 0 ? productData.images : [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800"
    ]
  };
  db.products.unshift(newProduct);
  persistDatabaseSync();
  return newProduct;
}
function updateProduct(id, updates) {
  const db = getDatabase();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const current = db.products[index];
  const updated = {
    ...current,
    ...updates,
    id: current.id,
    // Preserve ID
    stock: updates.stock !== void 0 ? Number(updates.stock) : current.stock,
    price: updates.price !== void 0 ? Number(updates.price) : current.price
  };
  db.products[index] = updated;
  persistDatabaseSync();
  return updated;
}
function deleteProduct(id, permanent = false) {
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
  const product = db.products.find((p) => p.id === id);
  if (!product) return false;
  product.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistDatabaseSync();
  return true;
}
function restoreProduct(id) {
  const db = getDatabase();
  const product = db.products.find((p) => p.id === id);
  if (!product) return null;
  delete product.deletedAt;
  persistDatabaseSync();
  return product;
}
function addOrder(orderData) {
  const db = getDatabase();
  const nextNum = 1001 + db.orders.length;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const orderNumber = `TS-2026-${nextNum}`;
  const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newOrder = {
    ...orderData,
    id,
    orderNumber,
    status: "Processing",
    trackingNote: orderData.paymentMethod === "M-Pesa Express" ? orderData.mpesaCode ? `Order logged with M-Pesa Ref ${orderData.mpesaCode}. Awaiting dispatch from Kenyatta Pioneer Bldg Shop 514.` : "Order logged. Awaiting Lipa Na M-Pesa Till 9309020 confirmation for immediate dispatch." : "Order logged for Payment on Delivery. Package prepared for courier dispatch.",
    createdAt: nowIso,
    updatedAt: nowIso
  };
  db.orders.unshift(newOrder);
  for (const item of newOrder.items) {
    const prod = db.products.find((p) => p.id === item.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
    }
  }
  if (newOrder.mpesaCode || newOrder.paymentMethod === "M-Pesa Express") {
    const mpesaTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      customerEmail: newOrder.customerEmail || "",
      amount: newOrder.total,
      tillNumber: "9309020",
      mpesaCode: newOrder.mpesaCode || `PENDING-${newOrder.orderNumber}`,
      mpesaMessage: newOrder.mpesaMessage || `M-Pesa payment for ${newOrder.orderNumber}`,
      status: newOrder.mpesaStatus || "Pending Verification",
      createdAt: nowIso
    };
    db.mpesaTransactions.unshift(mpesaTx);
  }
  if (newOrder.customerEmail || newOrder.customerPhone) {
    const existingClient = db.clients.find(
      (c) => newOrder.customerEmail && c.email.toLowerCase() === newOrder.customerEmail.toLowerCase() || c.phone === newOrder.customerPhone
    );
    if (existingClient) {
      existingClient.defaultAddress = newOrder.shippingAddress || existingClient.defaultAddress;
      existingClient.city = newOrder.city || existingClient.city;
    } else {
      db.clients.unshift({
        id: `client-${Date.now()}`,
        name: newOrder.customerName,
        email: newOrder.customerEmail || `${newOrder.customerPhone.replace(/\D/g, "")}@techsokoni.co.ke`,
        phone: newOrder.customerPhone,
        defaultAddress: newOrder.shippingAddress,
        city: newOrder.city,
        createdAt: nowIso
      });
    }
  }
  persistDatabaseSync();
  return newOrder;
}
function updateOrderStatus(id, status, trackingNote) {
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) return null;
  order.status = status;
  if (trackingNote) {
    order.trackingNote = trackingNote;
  }
  order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistDatabaseSync();
  return order;
}
function trackOrder(query) {
  if (!query || typeof query !== "string") return null;
  const db = getDatabase();
  const q = query.trim().toLowerCase();
  const found = db.orders.find(
    (o) => o.orderNumber.toLowerCase() === q || o.id.toLowerCase() === q || o.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
  );
  return found || null;
}
function deleteOrder(id) {
  const db = getDatabase();
  const initialLen = db.orders.length;
  db.orders = db.orders.filter((o) => o.id !== id && o.orderNumber !== id);
  if (db.orders.length !== initialLen) {
    db.mpesaTransactions = db.mpesaTransactions.filter(
      (tx) => tx.orderId !== id && tx.orderNumber !== id
    );
    persistDatabaseSync();
    return true;
  }
  return false;
}
function clearAllOrders() {
  const db = getDatabase();
  db.orders = [];
  db.mpesaTransactions = [];
  persistDatabaseSync();
}
function deleteViewingAppointment(id) {
  const db = getDatabase();
  const initialLen = db.viewingAppointments.length;
  db.viewingAppointments = db.viewingAppointments.filter(
    (a) => a.id !== id && a.bookingReference !== id
  );
  if (db.viewingAppointments.length !== initialLen) {
    persistDatabaseSync();
    return true;
  }
  return false;
}
function clearAllViewingAppointments() {
  const db = getDatabase();
  db.viewingAppointments = [];
  persistDatabaseSync();
}
function clearMockData() {
  const db = getDatabase();
  const ordersCleared = db.orders.length;
  const appointmentsCleared = db.viewingAppointments.length;
  const transactionsCleared = db.mpesaTransactions.length;
  db.orders = [];
  db.viewingAppointments = [];
  db.mpesaTransactions = [];
  db.clients = db.clients.filter(
    (c) => c.email === "sirdusman@gmail.com" || !c.email.endsWith("@example.com") && !c.email.endsWith("@test.co.ke")
  );
  db.notifications = db.notifications.filter(
    (n) => n.referenceId !== "TS-2026-1003" && n.referenceId !== "TSV-2026-3338" && !n.subject.includes("TS-2026-1003") && !n.subject.includes("TSV-2026-3338")
  );
  persistDatabaseSync();
  return { ordersCleared, appointmentsCleared, transactionsCleared };
}
function addViewingAppointment(data) {
  const db = getDatabase();
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const rand = Math.floor(1e3 + Math.random() * 9e3);
  const bookingReference = `TSV-${year}-${rand}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const initialStatus = db.bookingConfig.requireApproval ? "Pending Confirmation" : "Confirmed";
  const newApp = {
    ...data,
    id: `viewing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    bookingReference,
    customerPhone: normalizeKenyanPhone(data.customerPhone),
    status: initialStatus,
    auditTrail: [
      {
        timestamp: now,
        action: "Booking Created",
        newStatus: initialStatus,
        actor: data.customerName || "customer",
        note: `Physical viewing booked for ${data.productName} on ${data.viewingDate} at ${data.viewingTimeSlot}.`
      }
    ],
    createdAt: now,
    updatedAt: now
  };
  db.viewingAppointments.unshift(newApp);
  persistDatabaseSync();
  return newApp;
}
function updateViewingAppointment(id, updates, auditNote, actor = "admin") {
  const db = getDatabase();
  const app2 = db.viewingAppointments.find((a) => a.id === id || a.bookingReference === id);
  if (!app2) return null;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (updates.status && updates.status !== app2.status) {
    app2.auditTrail = [
      {
        timestamp: now,
        action: `Status changed to ${updates.status}`,
        previousStatus: app2.status,
        newStatus: updates.status,
        actor,
        note: auditNote || updates.cancellationReason
      },
      ...app2.auditTrail || []
    ];
  }
  Object.assign(app2, updates);
  app2.updatedAt = now;
  persistDatabaseSync();
  return app2;
}
function updateSiteSettings(updates) {
  const db = getDatabase();
  db.settings = { ...db.settings, ...updates };
  persistDatabaseSync();
  return db.settings;
}
function updateBookingConfig(updates) {
  const db = getDatabase();
  db.bookingConfig = { ...db.bookingConfig, ...updates };
  persistDatabaseSync();
  return db.bookingConfig;
}
function addViewingLocation(locData) {
  const db = getDatabase();
  const newLoc = {
    ...locData,
    id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  };
  db.viewingLocations.push(newLoc);
  persistDatabaseSync();
  return newLoc;
}
function updateViewingLocation(id, updates) {
  const db = getDatabase();
  const loc = db.viewingLocations.find((l) => l.id === id);
  if (!loc) return null;
  Object.assign(loc, updates);
  persistDatabaseSync();
  return loc;
}
function deleteViewingLocation(id) {
  const db = getDatabase();
  const prevLen = db.viewingLocations.length;
  db.viewingLocations = db.viewingLocations.filter((l) => l.id !== id);
  if (db.viewingLocations.length !== prevLen) {
    persistDatabaseSync();
    return true;
  }
  return false;
}
function addNotificationLog(notification) {
  const db = getDatabase();
  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }
  db.notifications.unshift(notification);
  if (db.notifications.length > 100) {
    db.notifications.pop();
  }
  persistDatabaseSync();
}
function getNotifications() {
  const db = getDatabase();
  return db.notifications || [];
}
function addWarrantyRegistration(reg) {
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
function getWarrantyRegistrations() {
  const db = getDatabase();
  return db.warranties || [];
}
function updateClientPassword(email, newPasswordPlain) {
  const db = getDatabase();
  const normalized = email.trim().toLowerCase();
  const client = db.clients.find((c) => c.email.toLowerCase() === normalized);
  if (client) {
    client.password = newPasswordPlain;
    persistDatabaseSync();
    return true;
  }
  db.clients.unshift({
    id: `client-${Date.now()}`,
    name: email.split("@")[0],
    email: normalized,
    phone: "",
    password: newPasswordPlain,
    defaultAddress: "",
    city: "Nairobi",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  persistDatabaseSync();
  return true;
}
function updateClientMfa(email, enabled) {
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
function findClientByEmail(email) {
  const db = getDatabase();
  const normalized = (email || "").trim().toLowerCase();
  return db.clients.find((c) => c.email.toLowerCase() === normalized);
}
function saveOrUpdateClient(clientData) {
  const db = getDatabase();
  const normalized = clientData.email.trim().toLowerCase();
  const existingIdx = db.clients.findIndex((c) => c.email.toLowerCase() === normalized);
  if (existingIdx >= 0) {
    db.clients[existingIdx] = {
      ...db.clients[existingIdx],
      ...clientData,
      email: normalized
    };
    persistDatabaseSync();
    return db.clients[existingIdx];
  }
  const newClient = {
    id: clientData.id || `client-${Date.now()}`,
    uid: clientData.uid,
    name: clientData.name || normalized.split("@")[0],
    email: normalized,
    phone: clientData.phone || "",
    password: clientData.password,
    defaultAddress: clientData.defaultAddress || "",
    city: clientData.city || "Nairobi",
    authProvider: clientData.authProvider || "password",
    photoURL: clientData.photoURL,
    mfaEnabled: clientData.mfaEnabled ?? false,
    createdAt: clientData.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  db.clients.unshift(newClient);
  persistDatabaseSync();
  return newClient;
}

// serverNotificationService.ts
import nodemailer from "nodemailer";
function formatSmtpError(rawError) {
  if (!rawError) return "SMTP dispatch failed. Please verify host, port, and authentication credentials.";
  const lower = rawError.toLowerCase();
  if (lower.includes("wrong version number") || lower.includes("eproto")) {
    return "SSL/TLS Protocol Mismatch: Port 587 uses STARTTLS (SSL must be disabled). For direct SSL, use Port 465 (SSL enabled).";
  }
  if (lower.includes("535") || lower.includes("auth") || lower.includes("credential") || lower.includes("invalid login")) {
    return "Authentication Failed: The mail server (Zoho/Gmail) rejected your login. If Two-Factor Authentication is active, you must generate and use an Application-Specific Password (e.g. at accounts.zoho.com > Security > App Passwords or myaccount.google.com/security), rather than your personal login password. Also ensure Outgoing SMTP is turned ON in Zoho Mail settings.";
  }
  if (lower.includes("timeout") || lower.includes("etimedout") || lower.includes("timed out")) {
    return "Connection Timed Out: The mail server did not respond within 8 seconds. Verify the hostname (smtp.zoho.com or smtp.zoho.eu) and that port 465/587 is accessible.";
  }
  if (lower.includes("enotfound") || lower.includes("getaddrinfo")) {
    return "Hostname Unreachable: The SMTP server address is invalid or cannot be reached via DNS.";
  }
  if (lower.includes("econnrefused")) {
    return "Connection Refused: The mail server rejected connection on the specified port.";
  }
  return rawError;
}
function getEmailTransporter() {
  const db = getDatabase();
  const settings = db.settings;
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || process.env.ZOHO_HOST || settings.smtpHost;
  const rawPort = process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || settings.smtpPort || 465;
  const port = Number(rawPort) || 465;
  const user = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER || process.env.MAIL_USER || process.env.ZOHO_USER || settings.smtpUser;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.MAIL_PASS || process.env.MAIL_PASSWORD || process.env.ZOHO_PASSWORD || settings.smtpPass;
  let secure = settings.smtpSecure;
  if (port === 465) {
    secure = true;
  } else if (port === 587 || port === 25) {
    secure = false;
  } else if (process.env.SMTP_SECURE !== void 0) {
    secure = process.env.SMTP_SECURE === "true";
  } else if (process.env.EMAIL_SECURE !== void 0) {
    secure = process.env.EMAIL_SECURE === "true";
  }
  if (host && user && pass) {
    return {
      isConfigured: true,
      transporter: nodemailer.createTransport({
        host: host.trim(),
        port,
        secure,
        auth: {
          user: user.trim(),
          pass: pass.trim()
        },
        connectionTimeout: 8e3,
        greetingTimeout: 8e3,
        socketTimeout: 1e4,
        tls: {
          rejectUnauthorized: false
        }
      }),
      fromAddress: user.includes("@") ? `"Tech Sokoni Showroom" <${user.trim()}>` : `"Tech Sokoni Showroom" <notifications@techsokoni.co.ke>`
    };
  }
  return {
    isConfigured: false,
    transporter: null,
    fromAddress: '"Tech Sokoni Kenya" <alerts@techsokoni.co.ke>'
  };
}
async function testSmtpConnection(config) {
  try {
    const host = (config.smtpHost || "").trim();
    const port = Number(config.smtpPort) || 465;
    const user = (config.smtpUser || "").trim();
    const pass = (config.smtpPass || "").trim();
    if (!host || !user || !pass) {
      return {
        ok: false,
        error: "Please enter SMTP Host, User Email, and App Password."
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
      connectionTimeout: 8e3,
      greetingTimeout: 8e3,
      socketTimeout: 1e4,
      tls: { rejectUnauthorized: false }
    });
    await Promise.race([
      testTransporter.verify(),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Connection timed out after 8 seconds")), 8500)
      )
    ]);
    return {
      ok: true,
      message: `Successfully connected and authenticated with ${host}:${port} as ${user}!`
    };
  } catch (err) {
    const raw = err?.message || "SMTP connection failed";
    return {
      ok: false,
      error: formatSmtpError(raw),
      rawError: raw
    };
  }
}
function getAdminNotificationRecipient() {
  const db = getDatabase();
  return process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || process.env.NOTIFICATION_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim() || process.env.ALERT_EMAIL?.trim() || db.settings?.adminNotificationEmail?.trim() || "sirdusman@gmail.com";
}
function cleanKenyanPhoneForWa(phone) {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) clean = "254" + clean.slice(1);
  if (!clean.startsWith("254") && clean.length === 9) clean = "254" + clean;
  return clean;
}
function buildHtmlWrapper(title, subtitle, bodyContent) {
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
      <div class="brand">Tech Sokoni Kenya \u2014 Showroom Dispatch Alert</div>
      <h1 class="title">${title}</h1>
      <div class="subtitle">${subtitle}</div>
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      Tech Sokoni Kenya \u2022 Kenyatta Pioneer Building, 5th Floor, Shop 514, Nairobi CBD<br>
      Orders Hotline &amp; WhatsApp: +254 792 620 789 \u2022 shop@techsokoni.com
    </div>
  </div>
</body>
</html>`;
}
async function sendOrderNotificationEmail(order) {
  const db = getDatabase();
  const recipient = getAdminNotificationRecipient();
  if (db.settings?.notifyOnNewOrder === false) {
    console.log("[Notification]: New order alerts disabled in settings, skipping.");
    return {
      id: `notif-${Date.now()}`,
      type: "order",
      recipient,
      subject: `[Skipped] Order #${order.orderNumber}`,
      summary: "Skipped by settings",
      htmlContent: "",
      textContent: "",
      status: "simulated",
      referenceId: order.orderNumber,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const subject = `\u{1F6D2} [Tech Sokoni] New Order #${order.orderNumber} - KSh ${order.total.toLocaleString()} from ${order.customerName}`;
  const waPhone = cleanKenyanPhoneForWa(order.customerPhone);
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hello ${order.customerName}, this is Tech Sokoni Kenya regarding your order #${order.orderNumber}. We have received your order and are preparing it for dispatch.`
  )}`;
  const itemsHtml = order.items.map((item) => {
    const vars = item.selectedVariations ? Object.entries(item.selectedVariations).map(([k, v]) => `${k}: ${v}`).join(" | ") : "";
    return `<tr>
        <td>
          <strong>${item.productName}</strong>
          ${vars ? `<br><span style="font-size:11px; color:#6E6D68;">${vars}</span>` : ""}
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">KSh ${item.unitPrice.toLocaleString()}</td>
        <td style="text-align: right; font-weight:600;">KSh ${(item.unitPrice * item.quantity).toLocaleString()}</td>
      </tr>`;
  }).join("");
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order">\u2713 New Customer Order</span>
      <span style="float: right; font-family: monospace; font-size: 12px; color: #6E6D68;">Order Ref: <strong>${order.orderNumber}</strong></span>
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Customer &amp; Delivery Details</div>
      <div class="grid-row"><span class="label">Customer Name:</span><span class="value">${order.customerName}</span></div>
      <div class="grid-row"><span class="label">Mobile Phone:</span><span class="value"><a href="tel:${order.customerPhone}" style="color:#1F6F43; text-decoration:none;">${order.customerPhone}</a></span></div>
      ${order.customerEmail ? `<div class="grid-row"><span class="label">Email Address:</span><span class="value"><a href="mailto:${order.customerEmail}" style="color:#141413;">${order.customerEmail}</a></span></div>` : ""}
      <div class="grid-row"><span class="label">Delivery Address:</span><span class="value">${order.shippingAddress}</span></div>
      <div class="grid-row"><span class="label">City / Destination:</span><span class="value">${order.city || "Nairobi"}</span></div>
      <div class="grid-row"><span class="label">Payment Method:</span><span class="value">${order.paymentMethod}</span></div>
      ${order.mpesaCode ? `<div class="grid-row"><span class="label">M-Pesa Reference:</span><span class="value" style="color:#1F6F43; font-family:monospace;">${order.mpesaCode}</span></div>` : ""}
    </div>

    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 8px; font-weight: 600;">Ordered Equipment (${order.items.length} ${order.items.length === 1 ? "item" : "items"})</div>
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
    `Total: KSh ${order.total.toLocaleString()} \u2022 ${order.customerName}`,
    bodyContent
  );
  const textContent = `TECH SOKONI KENYA - NEW ORDER RECEIVED
====================================================
Order Reference: ${order.orderNumber}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Email: ${order.customerEmail || "N/A"}
Address: ${order.shippingAddress}, ${order.city}
Payment: ${order.paymentMethod} ${order.mpesaCode ? `(M-Pesa Ref: ${order.mpesaCode})` : ""}

ITEMS:
${order.items.map((i) => `- ${i.quantity}x ${i.productName}: KSh ${(i.unitPrice * i.quantity).toLocaleString()}`).join("\n")}

Subtotal: KSh ${order.subtotal.toLocaleString()}
Shipping: FREE
TOTAL: KSh ${order.total.toLocaleString()}

Customer Hotline / WhatsApp: +254 792 620 789
Showroom: Kenyatta Pioneer Building Shop 514, Nairobi CBD
====================================================`;
  return await dispatchAndRecordNotification({
    type: "order",
    recipient,
    subject,
    summary: `Order #${order.orderNumber} for KSh ${order.total.toLocaleString()} from ${order.customerName} (${order.customerPhone})`,
    htmlContent,
    textContent,
    referenceId: order.orderNumber
  });
}
async function sendBookingNotificationEmail(appt) {
  const db = getDatabase();
  const recipient = getAdminNotificationRecipient();
  if (db.settings?.notifyOnNewBooking === false) {
    console.log("[Notification]: Viewing alerts disabled in settings, skipping.");
    return {
      id: `notif-${Date.now()}`,
      type: "booking",
      recipient,
      subject: `[Skipped] Booking #${appt.bookingReference}`,
      summary: "Skipped by settings",
      htmlContent: "",
      textContent: "",
      status: "simulated",
      referenceId: appt.bookingReference,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const subject = `\u{1F4C5} [Tech Sokoni] New Showroom Viewing #${appt.bookingReference} - ${appt.customerName} (${appt.productName})`;
  const waPhone = cleanKenyanPhoneForWa(appt.customerPhone);
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hello ${appt.customerName}, this is Tech Sokoni Showroom regarding your reserved viewing #${appt.bookingReference} for the ${appt.productName} on ${appt.viewingDate} at ${appt.viewingTimeSlot}.`
  )}`;
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-booking">\u{1F4C5} Showroom Inspection Reserved</span>
      <span style="float: right; font-family: monospace; font-size: 12px; color: #6E6D68;">Booking Ref: <strong>${appt.bookingReference}</strong></span>
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Appointment Schedule</div>
      <div class="grid-row"><span class="label">Inspection Date:</span><span class="value" style="color:#1565C0;">${appt.viewingDate}</span></div>
      <div class="grid-row"><span class="label">Time Slot:</span><span class="value" style="color:#1565C0;">${appt.viewingTimeSlot}</span></div>
      <div class="grid-row"><span class="label">Showroom Location:</span><span class="value">${appt.locationSnapshot?.name || "Kenyatta Pioneer Showroom (Shop 514)"}</span></div>
      <div class="grid-row"><span class="label">Hardware for Viewing:</span><span class="value" style="font-weight:700;">${appt.productName}</span></div>
      ${appt.productPrice ? `<div class="grid-row"><span class="label">Catalog Price:</span><span class="value">KSh ${appt.productPrice.toLocaleString()}</span></div>` : ""}
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Customer Contact Information</div>
      <div class="grid-row"><span class="label">Customer Name:</span><span class="value">${appt.customerName}</span></div>
      <div class="grid-row"><span class="label">Mobile Phone:</span><span class="value"><a href="tel:${appt.customerPhone}" style="color:#1F6F43; text-decoration:none;">${appt.customerPhone}</a></span></div>
      ${appt.customerEmail ? `<div class="grid-row"><span class="label">Email Address:</span><span class="value"><a href="mailto:${appt.customerEmail}" style="color:#141413;">${appt.customerEmail}</a></span></div>` : ""}
      ${appt.customerNotes ? `<div class="grid-row" style="margin-top:10px;"><span class="label">Customer Notes:</span><span class="value" style="font-weight:normal; font-style:italic;">"${appt.customerNotes}"</span></div>` : ""}
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #EAE9E4;">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Concierge Direct Actions</div>
      <a href="tel:${appt.customerPhone}" class="btn">Call Client</a>
      <a href="${waLink}" target="_blank" class="btn btn-secondary">WhatsApp Client</a>
    </div>
  `;
  const htmlContent = buildHtmlWrapper(
    `New Showroom Viewing #${appt.bookingReference}`,
    `${appt.viewingDate} at ${appt.viewingTimeSlot} \u2022 ${appt.productName}`,
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
Email: ${appt.customerEmail || "N/A"}
Notes: ${appt.customerNotes || "None"}
====================================================`;
  return await dispatchAndRecordNotification({
    type: "booking",
    recipient,
    subject,
    summary: `Viewing #${appt.bookingReference} for ${appt.productName} on ${appt.viewingDate} at ${appt.viewingTimeSlot} by ${appt.customerName} (${appt.customerPhone})`,
    htmlContent,
    textContent,
    referenceId: appt.bookingReference
  });
}
async function sendWarrantyNotificationEmail(reg) {
  const db = getDatabase();
  const recipient = getAdminNotificationRecipient();
  if (db.settings?.notifyOnWarrantyReg === false) {
    return {
      id: `notif-${Date.now()}`,
      type: "warranty",
      recipient,
      subject: `[Skipped] Warranty ${reg.serialNumber}`,
      summary: "Skipped by settings",
      htmlContent: "",
      textContent: "",
      status: "simulated",
      referenceId: reg.serialNumber,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const subject = `\u{1F6E1}\uFE0F [Tech Sokoni] New 6-Month Warranty Registration - Serial ${reg.serialNumber} (${reg.modelName})`;
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-warranty">\u{1F6E1}\uFE0F 6-Month Official Warranty Registered</span>
      <span style="float: right; font-family: monospace; font-size: 12px; color: #6E6D68;">Serial: <strong>${reg.serialNumber}</strong></span>
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Hardware &amp; Coverage Details</div>
      <div class="grid-row"><span class="label">Hardware Serial:</span><span class="value" style="font-family:monospace; color:#E65100;">${reg.serialNumber}</span></div>
      <div class="grid-row"><span class="label">Product / Model:</span><span class="value">${reg.modelName}</span></div>
      <div class="grid-row"><span class="label">Purchase Date:</span><span class="value">${reg.purchaseDate}</span></div>
      <div class="grid-row"><span class="label">Coverage Duration:</span><span class="value">6 Months (Official Direct Protection)</span></div>
      <div class="grid-row"><span class="label">Warranty Expiry Date:</span><span class="value" style="color:#1F6F43; font-weight:700;">${reg.warrantyExpiryDate}</span></div>
      ${reg.orderNumber ? `<div class="grid-row"><span class="label">Linked Order:</span><span class="value">#${reg.orderNumber}</span></div>` : ""}
    </div>

    <div class="card">
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #6E6D68; margin-bottom: 12px; font-weight: 600;">Registered Client</div>
      <div class="grid-row"><span class="label">Client Name:</span><span class="value">${reg.clientName || "Showroom Client"}</span></div>
      <div class="grid-row"><span class="label">Client Phone:</span><span class="value"><a href="tel:${reg.clientPhone}" style="color:#1F6F43;">${reg.clientPhone}</a></span></div>
      ${reg.clientEmail ? `<div class="grid-row"><span class="label">Client Email:</span><span class="value"><a href="mailto:${reg.clientEmail}">${reg.clientEmail}</a></span></div>` : ""}
      ${reg.notes ? `<div class="grid-row" style="margin-top:10px;"><span class="label">Client Notes:</span><span class="value" style="font-weight:normal;">${reg.notes}</span></div>` : ""}
    </div>
  `;
  const htmlContent = buildHtmlWrapper(
    `New Warranty Registered - ${reg.serialNumber}`,
    `${reg.modelName} \u2022 Protected until ${reg.warrantyExpiryDate}`,
    bodyContent
  );
  const textContent = `TECH SOKONI KENYA - NEW WARRANTY REGISTRATION
====================================================
Serial: ${reg.serialNumber}
Model: ${reg.modelName}
Purchase Date: ${reg.purchaseDate}
Warranty Expiry Date: ${reg.warrantyExpiryDate} (6 Months Official)
Client: ${reg.clientName || "N/A"} (${reg.clientPhone || "N/A"}, ${reg.clientEmail || "N/A"})
====================================================`;
  return await dispatchAndRecordNotification({
    type: "warranty",
    recipient,
    subject,
    summary: `Serial ${reg.serialNumber} registered by ${reg.clientName || "Client"} (${reg.clientPhone || "N/A"}) for ${reg.modelName}`,
    htmlContent,
    textContent,
    referenceId: reg.serialNumber
  });
}
async function sendTestNotificationEmail(overrideRecipient) {
  const recipient = overrideRecipient?.trim() || getAdminNotificationRecipient();
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
  const subject = `\u26A1 [Tech Sokoni] Notification Alert System Verified for ${recipient}`;
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order">\u2713 System Test Verified</span>
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
    "Notification System Active & Connected",
    `Target: ${recipient} \u2022 Nairobi Showroom`,
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
    type: "test",
    recipient,
    subject,
    summary: `Test notification successfully dispatched to ${recipient}`,
    htmlContent,
    textContent
  });
}
async function dispatchAndRecordNotification(payload) {
  const { isConfigured, transporter, fromAddress } = getEmailTransporter();
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  let status = "simulated";
  let errorMsg;
  if (isConfigured && transporter) {
    try {
      await Promise.race([
        transporter.sendMail({
          from: fromAddress,
          to: payload.recipient,
          subject: payload.subject,
          html: payload.htmlContent,
          text: payload.textContent
        }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("SMTP timeout: Server took longer than 8 seconds to respond")), 8500)
        )
      ]);
      status = "sent";
      console.log(`[Notification]: Successfully dispatched live SMTP email to ${payload.recipient} (${payload.subject})`);
    } catch (err) {
      status = "failed";
      errorMsg = formatSmtpError(err?.message || "SMTP delivery failed");
      console.warn(`[Notification]: SMTP delivery error to ${payload.recipient}:`, errorMsg);
    }
  } else {
    status = "simulated";
    console.log(`[Notification]: Logged notification for ${payload.recipient} (${payload.subject}). Add SMTP in Admin to enable external inbox relay.`);
  }
  const logEntry = {
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
    createdAt: nowIso
  };
  addNotificationLog(logEntry);
  return logEntry;
}
async function sendPasswordResetCodeEmail(recipient, code, clientName) {
  const subject = `\u{1F510} [Tech Sokoni] Your 6-Digit Password Reset Verification Code: ${code}`;
  const greeting = clientName ? `Hello ${clientName},` : "Hello,";
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order" style="background-color:#FFF3E0; color:#E65100; border-color:#FFE0B2;">
        \u{1F510} Password Reset Authorization
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
        \u23F1 Valid for 10 minutes \u2022 Do not share this code
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
    "Password Reset Verification",
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
    type: "test",
    recipient,
    subject,
    summary: `Password reset verification code [${code}] dispatched to ${recipient}`,
    htmlContent,
    textContent,
    referenceId: `RESET-${code}`
  });
}
async function sendTwoFactorCodeEmail(recipient, code, context, clientName) {
  const contextTitle = context === "admin_login" ? "Tech Sokoni Showroom Admin Access" : context === "enable_mfa" ? "Enable Two-Step Verification" : "Tech Sokoni Client Sign-In";
  const subject = `\u{1F6E1}\uFE0F [Tech Sokoni] Two-Step Verification Code: ${code}`;
  const greeting = clientName ? `Hello ${clientName},` : "Hello,";
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-booking" style="background-color:#E8F5E9; color:#1F6F43; border-color:#A5D6A7;">
        \u{1F6E1}\uFE0F Two-Step Verification (2FA / MFA)
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
        \u23F1 Valid for 10 minutes \u2022 Single-use
      </div>
    </div>

    <div class="card" style="font-size: 12px; line-height: 1.6; color: #5E5D59;">
      Enter this code on your device to complete your sign-in. Never share this code with anyone. Tech Sokoni staff will never ask for your verification code.
    </div>
  `;
  const htmlContent = buildHtmlWrapper(
    "Two-Step Verification Code",
    `${contextTitle} \u2022 ${recipient}`,
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
    type: "test",
    recipient,
    subject,
    summary: `Two-step verification code [${code}] dispatched to ${recipient} for ${context}`,
    htmlContent,
    textContent,
    referenceId: `MFA-${code}`
  });
}
async function sendPasswordChangedConfirmationEmail(recipient, clientName) {
  const subject = `\u2705 [Tech Sokoni] Your Account Password Was Successfully Updated`;
  const greeting = clientName ? `Hello ${clientName},` : "Hello,";
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-order">\u2713 Password Updated</span>
    </div>

    <p style="font-size: 14px; color: #141413; line-height: 1.5; margin-bottom: 16px;">
      ${greeting} Your Tech Sokoni account password for <strong>${recipient}</strong> was successfully changed on <strong>${timestamp} (EAT)</strong>.
    </p>

    <div class="card" style="font-size: 12px; line-height: 1.6; color: #5E5D59;">
      You can now sign in using your new password. If you did not make this change, please contact our showroom concierge immediately at <a href="tel:+254792620789" style="color:#1F6F43;">+254 792 620 789</a> or <a href="mailto:shop@techsokoni.com" style="color:#141413;">shop@techsokoni.com</a>.
    </div>
  `;
  const htmlContent = buildHtmlWrapper(
    "Password Updated Successfully",
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
    type: "test",
    recipient,
    subject,
    summary: `Password change confirmation email dispatched to ${recipient}`,
    htmlContent,
    textContent
  });
}

// server.ts
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.LAMBDA_TASK_ROOT) {
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
  } catch {
  }
}
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var rateLimitStore = /* @__PURE__ */ new Map();
function createRateLimiter(options) {
  return (req, res, next) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();
    const record = rateLimitStore.get(ip);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return next();
    }
    if (record.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1e3);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        error: "Too many requests. Please wait before trying again.",
        retryAfterSeconds
      });
    }
    record.count++;
    next();
  };
}
var staleRateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1e3);
if (staleRateLimitCleanup.unref) {
  staleRateLimitCleanup.unref();
}
var AI_DAILY_CALL_LIMIT = 80;
var aiCallsToday = 0;
var aiUsageDay = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function checkAndIncrementAiBudget() {
  const currentDay = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (currentDay !== aiUsageDay) {
    aiUsageDay = currentDay;
    aiCallsToday = 0;
  }
  if (aiCallsToday >= AI_DAILY_CALL_LIMIT) {
    return false;
  }
  aiCallsToday++;
  return true;
}
var serverTelemetryErrors = [];
var MAX_SERVER_ERROR_LOGS = 50;
var app = express();
app.use((req, _res, next) => {
  const forwardedUrl = req.headers["x-forwarded-url"] || req.headers["x-matched-path"];
  if (forwardedUrl && forwardedUrl.startsWith("/api")) {
    req.url = forwardedUrl;
  } else if ((process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME) && req.url && !req.url.startsWith("/api") && !req.url.startsWith("/uploads") && !req.url.startsWith("/assets") && !req.url.startsWith("/@")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
app.use(express.json({ limit: "25mb" }));
var uploadsDir = path2.resolve(process.cwd(), "uploads");
try {
  if (!fs2.existsSync(uploadsDir)) {
    fs2.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
}
app.use("/uploads", express.static(uploadsDir));
initServerDatabase();
function requireAdmin(req, res, next) {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey === "1940") {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized: Admin authentication required." });
}
app.post("/api/upload-image", (req, res) => {
  try {
    const image = req.body?.image || req.body?.imageData;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image data is required" });
    }
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = "jpg";
    let buffer;
    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("gif")) ext = "gif";
      else ext = "jpg";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(image, "base64");
    }
    const filename = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path2.join(uploadsDir, filename);
    fs2.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${filename}`;
    return res.status(201).json({ ok: true, url: publicUrl, filename });
  } catch (err) {
    console.error("Error saving uploaded image:", err?.message || err);
    return res.status(500).json({ error: "Failed to process image upload" });
  }
});
app.get("/api/firebase-config", (_req, res) => {
  try {
    const configPath = path2.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs2.existsSync(configPath)) {
      const raw = fs2.readFileSync(configPath, "utf-8");
      return res.json(JSON.parse(raw));
    }
  } catch {
  }
  res.json({});
});
app.post("/api/firebase-config", requireAdmin, (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || !newConfig.projectId || !newConfig.apiKey) {
      return res.status(400).json({ error: "Valid projectId and apiKey are required" });
    }
    const configPath = path2.resolve(process.cwd(), "firebase-applet-config.json");
    fs2.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf-8");
    return res.json({ ok: true, config: newConfig });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to update config" });
  }
});
app.get("/api/db/sync", (req, res) => {
  const isAdmin = req.headers["x-admin-key"] === "1940";
  if (isAdmin) {
    return res.json(getFullAdminData());
  }
  return res.json(getPublicStorefrontData());
});
app.get("/api/products", (_req, res) => {
  const data = getPublicStorefrontData();
  res.json(data.products);
});
app.post("/api/products", requireAdmin, (req, res) => {
  try {
    const product = addProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to add product" });
  }
});
app.put("/api/products/:id", requireAdmin, (req, res) => {
  try {
    const updated = updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to update product" });
  }
});
app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const permanent = req.query.permanent === "true";
  const success = deleteProduct(req.params.id, permanent);
  if (!success) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true, message: permanent ? "Permanently deleted" : "Moved to recycle bin" });
});
app.post("/api/products/:id/restore", requireAdmin, (req, res) => {
  const restored = restoreProduct(req.params.id);
  if (!restored) return res.status(404).json({ error: "Product not found in recycle bin" });
  res.json(restored);
});
app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, customerPhone, shippingAddress, items } = req.body || {};
    if (!customerName || !customerPhone || !shippingAddress || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Please provide full delivery and customer contact details." });
    }
    const order = addOrder(req.body);
    sendOrderNotificationEmail(order).catch((err) => {
      console.error("[Notification]: Error dispatching order notification:", err?.message || err);
    });
    res.status(201).json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Failed to record order" });
  }
});
app.get("/api/orders", requireAdmin, (_req, res) => {
  const db = getFullAdminData();
  res.json(db.orders);
});
app.put("/api/orders/:id", requireAdmin, (req, res) => {
  const { status, trackingNote } = req.body || {};
  const updated = updateOrderStatus(req.params.id, status, trackingNote);
  if (!updated) return res.status(404).json({ error: "Order not found" });
  res.json(updated);
});
app.delete("/api/orders/:id", requireAdmin, (req, res) => {
  const success = deleteOrder(req.params.id);
  if (!success) return res.status(404).json({ error: "Order not found" });
  res.json({ ok: true, id: req.params.id });
});
app.delete("/api/orders", requireAdmin, (_req, res) => {
  clearAllOrders();
  res.json({ ok: true, message: "All orders cleared" });
});
app.get("/api/orders/track", (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Order reference or phone number is required." });
  const order = trackOrder(query);
  if (!order) return res.status(404).json({ error: "No order found matching the provided reference or phone number." });
  res.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    shippingAddress: order.shippingAddress,
    city: order.city,
    trackingNote: order.trackingNote,
    paymentMethod: order.paymentMethod,
    mpesaStatus: order.mpesaStatus,
    total: order.total,
    items: order.items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      image: i.image
    }))
  });
});
app.get("/api/viewings", requireAdmin, (_req, res) => {
  const db = getFullAdminData();
  res.json(db.viewingAppointments);
});
app.post("/api/viewings", async (req, res) => {
  try {
    const appt = addViewingAppointment(req.body);
    sendBookingNotificationEmail(appt).catch((err) => {
      console.error("[Notification]: Error dispatching booking notification:", err?.message || err);
    });
    res.status(201).json({ ok: true, appointment: appt });
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to record appointment" });
  }
});
app.post("/api/warranties", async (req, res) => {
  try {
    const { serialNumber, modelName, purchaseDate } = req.body || {};
    if (!serialNumber || !modelName || !purchaseDate) {
      return res.status(400).json({ error: "Serial number, model, and purchase date are required." });
    }
    const reg = addWarrantyRegistration(req.body);
    sendWarrantyNotificationEmail(reg).catch((err) => {
      console.error("[Notification]: Error dispatching warranty notification:", err?.message || err);
    });
    res.status(201).json({ ok: true, registration: reg });
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to register warranty" });
  }
});
app.get("/api/warranties", requireAdmin, (_req, res) => {
  res.json(getWarrantyRegistrations());
});
app.get("/api/notifications", requireAdmin, (_req, res) => {
  const history = getNotifications();
  const transporter = getEmailTransporter();
  const recipient = getAdminNotificationRecipient();
  res.json({
    recipient,
    isSmtpConfigured: transporter.isConfigured,
    notifications: history
  });
});
app.post("/api/notifications/verify-smtp", requireAdmin, async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = req.body || {};
    const result = await testSmtpConnection({
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser,
      smtpPass,
      smtpSecure: Boolean(smtpSecure)
    });
    return res.json(result);
  } catch (err) {
    return res.json({
      ok: false,
      error: formatSmtpError(err?.message),
      rawError: err?.message
    });
  }
});
app.post("/api/notifications/test", requireAdmin, async (req, res) => {
  try {
    const targetEmail = req.body?.recipient || getAdminNotificationRecipient();
    const result = await sendTestNotificationEmail(targetEmail);
    if (result.status === "failed") {
      return res.json({
        ok: false,
        error: result.error || "Failed to dispatch via live SMTP",
        rawError: result.error,
        notification: result
      });
    }
    res.json({
      ok: true,
      notification: result,
      isSimulated: result.status === "simulated"
    });
  } catch (err) {
    res.status(500).json({ error: formatSmtpError(err?.message || "Failed to send test notification") });
  }
});
app.post("/api/notifications/config", requireAdmin, (req, res) => {
  try {
    const { adminNotificationEmail, notifyOnNewOrder, notifyOnNewBooking, notifyOnWarrantyReg, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = req.body || {};
    const updated = updateSiteSettings({
      adminNotificationEmail,
      notifyOnNewOrder,
      notifyOnNewBooking,
      notifyOnWarrantyReg,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure
    });
    res.json({ ok: true, settings: updated });
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to update notification settings" });
  }
});
app.put("/api/viewings/:id", requireAdmin, (req, res) => {
  const { auditNote, actor, ...updates } = req.body || {};
  const updated = updateViewingAppointment(req.params.id, updates, auditNote, actor);
  if (!updated) return res.status(404).json({ error: "Appointment not found" });
  res.json(updated);
});
app.delete("/api/viewings/:id", requireAdmin, (req, res) => {
  const success = deleteViewingAppointment(req.params.id);
  if (!success) return res.status(404).json({ error: "Appointment not found" });
  res.json({ ok: true, id: req.params.id });
});
app.delete("/api/viewings", requireAdmin, (_req, res) => {
  clearAllViewingAppointments();
  res.json({ ok: true, message: "All appointments cleared" });
});
app.post("/api/admin/clear-mock-data", requireAdmin, (_req, res) => {
  const summary = clearMockData();
  res.json({ ok: true, summary, message: "Mock data cleared successfully. All showroom products are preserved." });
});
app.post("/api/viewings/locations", requireAdmin, (req, res) => {
  const loc = addViewingLocation(req.body);
  res.status(201).json(loc);
});
app.put("/api/viewings/locations/:id", requireAdmin, (req, res) => {
  const updated = updateViewingLocation(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Location not found" });
  res.json(updated);
});
app.delete("/api/viewings/locations/:id", requireAdmin, (req, res) => {
  const success = deleteViewingLocation(req.params.id);
  if (!success) return res.status(404).json({ error: "Location not found" });
  res.json({ ok: true });
});
app.put("/api/viewings/config", requireAdmin, (req, res) => {
  const updated = updateBookingConfig(req.body);
  res.json(updated);
});
app.put("/api/settings", requireAdmin, (req, res) => {
  const updated = updateSiteSettings(req.body);
  res.json(updated);
});
var verificationCodes = /* @__PURE__ */ new Map();
function generate6DigitCode() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
var otpRateLimiter = createRateLimiter({
  maxRequests: 15,
  windowMs: 10 * 60 * 1e3
});
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of verificationCodes.entries()) {
    if (now > entry.expiresAt) {
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1e3);
app.post("/api/auth/send-reset-code", otpRateLimiter, async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    const client = findClientByEmail(email);
    const code = generate6DigitCode();
    const key = `reset:${email}`;
    verificationCodes.set(key, {
      code,
      email,
      purpose: "password_reset",
      expiresAt: Date.now() + 10 * 60 * 1e3,
      // 10 minutes expiry
      attempts: 0,
      clientName: client?.name || email.split("@")[0]
    });
    console.log(`[AUTH-OTP]: Generated reset code ${code} for ${email}`);
    const emailResult = await sendPasswordResetCodeEmail(email, code, client?.name);
    return res.json({
      ok: true,
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      isSimulated: emailResult?.status === "simulated"
    });
  } catch (err) {
    console.error("[AUTH-OTP]: Error sending password reset code:", err?.message || err);
    return res.status(500).json({ error: "Failed to send verification code. Please try again." });
  }
});
app.post("/api/auth/verify-reset-code", (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const code = (req.body?.code || "").trim();
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }
    const key = `reset:${email}`;
    const entry = verificationCodes.get(key);
    if (!entry) {
      return res.status(400).json({
        error: "No active verification code found or it has expired. Please request a new code."
      });
    }
    if (Date.now() > entry.expiresAt) {
      verificationCodes.delete(key);
      return res.status(400).json({ error: "This verification code has expired. Please request a new code." });
    }
    if (entry.code !== code) {
      entry.attempts++;
      if (entry.attempts >= 5) {
        verificationCodes.delete(key);
        return res.status(400).json({
          error: "Too many incorrect attempts. For security reasons, please request a new verification code."
        });
      }
      return res.status(400).json({
        error: `Incorrect code. ${5 - entry.attempts} attempts remaining.`
      });
    }
    const resetToken = `rst-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    entry.verifiedToken = resetToken;
    return res.json({
      ok: true,
      resetToken,
      message: "Code verified successfully. You can now set your new password."
    });
  } catch (err) {
    console.error("[AUTH-OTP]: Error verifying reset code:", err?.message || err);
    return res.status(500).json({ error: "Failed to verify code. Please try again." });
  }
});
app.post("/api/auth/complete-password-reset", async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const resetToken = (req.body?.resetToken || "").trim();
    const newPassword = (req.body?.newPassword || "").trim();
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: "Email, reset token, and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    const key = `reset:${email}`;
    const entry = verificationCodes.get(key);
    if (!entry || entry.verifiedToken !== resetToken) {
      return res.status(403).json({
        error: "Invalid or expired password reset session. Please request a new code."
      });
    }
    updateClientPassword(email, newPassword);
    verificationCodes.delete(key);
    sendPasswordChangedConfirmationEmail(email, entry.clientName).catch((err) => {
      console.error("[AUTH-OTP]: Error sending confirmation email:", err?.message || err);
    });
    return res.json({
      ok: true,
      message: "Your password has been securely updated. You can now log in with your new password."
    });
  } catch (err) {
    console.error("[AUTH-OTP]: Error updating password:", err?.message || err);
    return res.status(500).json({ error: "Failed to update password." });
  }
});
app.post("/api/auth/send-mfa-code", otpRateLimiter, async (req, res) => {
  try {
    const purpose = req.body?.purpose || "client_login";
    let email = (req.body?.email || "").trim().toLowerCase();
    if (purpose === "admin_login") {
      email = getAdminNotificationRecipient().toLowerCase();
    }
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required for two-step verification." });
    }
    const client = findClientByEmail(email);
    const code = generate6DigitCode();
    const key = `mfa:${purpose}:${email}`;
    verificationCodes.set(key, {
      code,
      email,
      purpose,
      expiresAt: Date.now() + 10 * 60 * 1e3,
      attempts: 0,
      clientName: purpose === "admin_login" ? "Showroom Admin" : client?.name || email.split("@")[0]
    });
    console.log(`[AUTH-MFA]: Generated ${purpose} MFA code ${code} for ${email}`);
    const contextLabel = purpose === "admin_login" ? "Administrator Security Gate" : "Client Account Sign In";
    const emailResult = await sendTwoFactorCodeEmail(
      email,
      code,
      purpose,
      purpose === "admin_login" ? "Showroom Administrator" : client?.name
    );
    return res.json({
      ok: true,
      email,
      message: `Security code sent to ${email}.`,
      isSimulated: emailResult?.status === "simulated"
    });
  } catch (err) {
    console.error("[AUTH-MFA]: Error sending MFA code:", err?.message || err);
    return res.status(500).json({ error: "Failed to send two-step verification code." });
  }
});
app.post("/api/auth/verify-mfa-code", (req, res) => {
  try {
    const purpose = req.body?.purpose || "client_login";
    let email = (req.body?.email || "").trim().toLowerCase();
    if (purpose === "admin_login") {
      email = getAdminNotificationRecipient().toLowerCase();
    }
    const code = (req.body?.code || "").trim();
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }
    const key = `mfa:${purpose}:${email}`;
    const entry = verificationCodes.get(key);
    if (!entry) {
      return res.status(400).json({
        error: "Verification code not found or has expired. Please request a new code."
      });
    }
    if (Date.now() > entry.expiresAt) {
      verificationCodes.delete(key);
      return res.status(400).json({ error: "This verification code has expired. Please request a new code." });
    }
    if (entry.code !== code) {
      entry.attempts++;
      if (entry.attempts >= 5) {
        verificationCodes.delete(key);
        return res.status(400).json({
          error: "Too many incorrect attempts. Please request a new code."
        });
      }
      return res.status(400).json({
        error: `Incorrect security code. ${5 - entry.attempts} attempts remaining.`
      });
    }
    verificationCodes.delete(key);
    let client = null;
    if (purpose === "client_login") {
      client = findClientByEmail(email);
    }
    return res.json({
      ok: true,
      verified: true,
      client,
      message: "Two-step verification verified successfully."
    });
  } catch (err) {
    console.error("[AUTH-MFA]: Error verifying MFA code:", err?.message || err);
    return res.status(500).json({ error: "Failed to verify two-step code." });
  }
});
app.post("/api/auth/client-login", (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = (req.body?.password || "").trim();
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const client = findClientByEmail(email);
    if (!client || client.password !== password) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    if (client.mfaEnabled) {
      return res.json({
        ok: true,
        requiresMfa: true,
        email: client.email,
        name: client.name
      });
    }
    return res.json({
      ok: true,
      requiresMfa: false,
      client
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to process login." });
  }
});
app.post("/api/auth/client-register", (req, res) => {
  try {
    const { name, email, phone, password, defaultAddress, city, mfaEnabled } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const saved = saveOrUpdateClient({
      name: name || email.split("@")[0],
      email: email.trim().toLowerCase(),
      phone: phone || "",
      password,
      defaultAddress: defaultAddress || "",
      city: city || "Nairobi",
      mfaEnabled: Boolean(mfaEnabled)
    });
    return res.status(201).json({ ok: true, client: saved });
  } catch (err) {
    return res.status(500).json({ error: "Failed to register account." });
  }
});
app.post("/api/auth/toggle-mfa", (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const enabled = Boolean(req.body?.enabled);
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const updated = updateClientMfa(email, enabled);
    return res.json({ ok: true, mfaEnabled: enabled, updated });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update two-step verification settings." });
  }
});
app.post("/api/auth/sync-client", (req, res) => {
  try {
    const clientData = req.body;
    if (!clientData || !clientData.email) {
      return res.status(400).json({ error: "Client email is required." });
    }
    const saved = saveOrUpdateClient(clientData);
    return res.json({ ok: true, client: saved });
  } catch (err) {
    return res.status(500).json({ error: "Failed to sync client profile." });
  }
});
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    store: "Tech Sokoni Showroom",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    aiBudgetRemaining: Math.max(0, AI_DAILY_CALL_LIMIT - aiCallsToday)
  });
});
app.post("/api/telemetry/error", (req, res) => {
  try {
    const { id, message, url, timestamp } = req.body || {};
    if (message) {
      const record = {
        id: id || `err-${Date.now()}`,
        timestamp: timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        message: String(message).slice(0, 300),
        url: String(url || "").slice(0, 200),
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"
      };
      serverTelemetryErrors.unshift(record);
      if (serverTelemetryErrors.length > MAX_SERVER_ERROR_LOGS) {
        serverTelemetryErrors.pop();
      }
    }
  } catch {
  }
  res.status(204).end();
});
app.post("/api/telemetry/event", (_req, res) => {
  res.status(204).end();
});
var bookingRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 10 * 60 * 1e3
  // 30 booking attempts per 10 mins per IP
});
var confirmedServerSlots = [];
function backendValidateKenyanPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const clean = phone.replace(/[\s\-\(\)]/g, "");
  return /^0[17]\d{8}$/.test(clean) || /^254[17]\d{8}$/.test(clean) || /^\+254[17]\d{8}$/.test(clean);
}
function getNairobiToday() {
  const now = /* @__PURE__ */ new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 6e4;
  const eat = new Date(utc + 36e5 * 3);
  const y = eat.getFullYear();
  const m = String(eat.getMonth() + 1).padStart(2, "0");
  const d = String(eat.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
app.post("/api/bookings/validate", bookingRateLimiter, (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      viewingDate,
      viewingTimeSlot,
      productId,
      productName,
      locationId
    } = req.body || {};
    if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
      return res.status(400).json({ error: "Please enter your full legal name (minimum 2 characters)." });
    }
    if (!customerPhone || !backendValidateKenyanPhone(customerPhone)) {
      return res.status(400).json({
        error: "Please provide a valid Kenyan mobile number (e.g. 0712 345 678, 0110 123 456, or +254 7XX XXX XXX)."
      });
    }
    if (customerEmail && typeof customerEmail === "string" && customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        return res.status(400).json({ error: "Please provide a valid email address or leave it blank." });
      }
    }
    if (!viewingDate || !/^\d{4}-\d{2}-\d{2}$/.test(viewingDate)) {
      return res.status(400).json({ error: "Please select a valid viewing appointment date (YYYY-MM-DD)." });
    }
    const todayNairobi = getNairobiToday();
    if (viewingDate < todayNairobi) {
      return res.status(400).json({ error: "Appointments cannot be booked for past dates." });
    }
    if (!viewingTimeSlot || typeof viewingTimeSlot !== "string") {
      return res.status(400).json({ error: "Please select a preferred viewing time slot." });
    }
    if (!productId || !productName) {
      return res.status(400).json({ error: "Missing selected laptop details." });
    }
    const targetLoc = locationId || "loc-nbi-cbd";
    const existingInSlot = confirmedServerSlots.filter(
      (s) => s.date === viewingDate && s.slot === viewingTimeSlot && s.locationId === targetLoc
    );
    const MAX_SLOT_CAPACITY = 2;
    if (existingInSlot.length >= MAX_SLOT_CAPACITY) {
      return res.status(409).json({
        error: "This viewing slot was just reserved by another client. Please select another convenient time slot.",
        slotUnavailable: true
      });
    }
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
    const bookingReference = `TSV-${year}-${randomSuffix}`;
    confirmedServerSlots.push({
      date: viewingDate,
      slot: viewingTimeSlot,
      locationId: targetLoc,
      reference: bookingReference
    });
    return res.status(200).json({
      ok: true,
      bookingReference,
      message: "Appointment details validated and slot reserved successfully."
    });
  } catch (err) {
    console.error("[Booking Validation Error]:", err?.message);
    return res.status(500).json({ error: "Server error processing booking reservation. Please try again." });
  }
});
var aiRateLimiter = createRateLimiter({
  maxRequests: 15,
  windowMs: 5 * 60 * 1e3
  // 15 requests per 5 minutes per IP
});
app.post("/api/ai/generate-product", aiRateLimiter, async (req, res) => {
  try {
    const rawQuery = req.body?.query || req.body?.prompt;
    if (typeof rawQuery !== "string" || !rawQuery.trim()) {
      res.status(400).json({ error: "Valid product title or specifications query is required." });
      return;
    }
    const query = rawQuery.trim();
    if (query.length < 2 || query.length > 500) {
      res.status(400).json({
        error: "Query length must be between 2 and 500 characters."
      });
      return;
    }
    if (!checkAndIncrementAiBudget()) {
      res.status(429).json({
        error: "Daily AI generation capacity reached. Please enter specifications manually or retry tomorrow.",
        fallback: true
      });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      res.status(503).json({
        error: "GEMINI_API_KEY not configured on server; exact input parser active.",
        fallback: true
      });
      return;
    }
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate complete electronics product details for the Tech Sokoni store from this exact user input:
"${query}"

STRICT FIDELITY RULES:
1. You MUST preserve EVERY exact detail written by the user (exact product name/model, exact RAM, exact Storage, exact Processor, exact Screen Size, exact Color, exact GPU, exact OS, exact price if mentioned).
2. NEVER replace or contradict any specification written by the user.
3. Only infer or complete fields that the user did NOT explicitly specify, using authentic real-world specifications for that exact hardware.`,
      config: {
        systemInstruction: "You are the Hardware Catalog Engine for TECH SOKONI. Always honor and copy the user\u2019s exact written features and specifications verbatim into the corresponding fields before filling in any remaining blanks.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Exact product title incorporating the user input model and key identity"
            },
            sku: {
              type: Type.STRING,
              description: "Unique SKU starting with TS- followed by category and model code"
            },
            brand: {
              type: Type.STRING,
              description: "Exact manufacturer brand name"
            },
            category: {
              type: Type.STRING,
              description: "One of: laptops, phones, desktops, monitors, printers, tablets, accessories, networking, storage, gaming"
            },
            price: {
              type: Type.NUMBER,
              description: "Price in Kenyan Shillings (KSh) realistic for the item"
            },
            shortSpec: {
              type: Type.STRING,
              description: "Key configuration line separated by middle dots (\xB7) using the exact user-specified processor, RAM, storage, screen size, and color"
            },
            shortDescription: {
              type: Type.STRING,
              description: "1-2 sentence summary accurately reflecting the exact specifications provided by the user"
            },
            description: {
              type: Type.STRING,
              description: "Detailed 2-3 sentence technical overview faithful to the user input"
            },
            processor: {
              type: Type.STRING,
              description: "Exact processor / chip specified by user or authentic model CPU"
            },
            ram: {
              type: Type.STRING,
              description: "Exact RAM specified by user (e.g. 16GB DDR4 / 32GB Unified)"
            },
            storage: {
              type: Type.STRING,
              description: "Exact storage specified by user (e.g. 512GB NVMe SSD)"
            },
            screenSize: {
              type: Type.STRING,
              description: 'Exact screen size specified by user (e.g. 14.0" FHD / 16.0")'
            },
            color: {
              type: Type.STRING,
              description: "Exact color/finish specified by user"
            },
            os: {
              type: Type.STRING,
              description: "Exact operating system specified by user or authentic OS"
            },
            graphics: {
              type: Type.STRING,
              description: "Exact GPU / graphics specification"
            },
            ports: {
              type: Type.STRING,
              description: "Connectivity and I/O ports"
            },
            battery: {
              type: Type.STRING,
              description: "Battery specification"
            },
            weight: {
              type: Type.STRING,
              description: "Weight in kg or g"
            },
            warranty: {
              type: Type.STRING,
              description: "Warranty coverage statement"
            },
            variations: {
              type: Type.ARRAY,
              description: "Product variation groups such as Storage, RAM, Color, Screen Size",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "Variation group name"
                  },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        priceDelta: { type: Type.NUMBER }
                      },
                      required: ["label", "priceDelta"]
                    }
                  }
                },
                required: ["name", "options"]
              }
            }
          },
          required: [
            "name",
            "sku",
            "brand",
            "category",
            "price",
            "shortSpec",
            "shortDescription",
            "description",
            "processor",
            "ram",
            "storage",
            "screenSize",
            "color",
            "os",
            "warranty"
          ]
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("Empty response from model");
    }
    const parsed = JSON.parse(text.trim());
    res.json(parsed);
  } catch (error) {
    console.error("Gemini product generation handled error:", error?.message);
    res.status(500).json({
      error: "Unable to auto-generate specifications with AI. Exact input parser active.",
      fallback: true
    });
  }
});
app.use((err, _req, res, _next) => {
  const errorId = `err-${Date.now()}`;
  console.error(`[Server Error ${errorId}]:`, err?.message || err);
  res.status(500).json({
    error: "An unexpected internal error occurred. Please try again shortly.",
    errorId
  });
});
var handler = (req, res) => app(req, res);
var server_default = app;
if (!process.env.VERCEL && !process.env.VERCEL_ENV && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const PORT = Number(process.env.PORT) || 3e3;
  if (process.env.NODE_ENV !== "production") {
    import("vite").then(({ createServer }) => {
      createServer({
        server: { middlewareMode: true },
        appType: "spa"
      }).then((vite) => {
        app.use(vite.middlewares);
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`Tech Sokoni server running on http://0.0.0.0:${PORT}`);
        });
      });
    }).catch((err) => {
      console.error("Failed to initialize Vite development server:", err);
    });
  } else {
    const distPath = path2.resolve(__dirname2, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Tech Sokoni server running on http://0.0.0.0:${PORT}`);
    });
  }
}
export {
  app,
  server_default as default,
  handler
};
