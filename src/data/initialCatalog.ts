import { CategoryInfo, Offer, Order, Product, SiteSettings } from '../types/store';

export const STUDIO_IMAGES = {
  laptopPro: '/src/assets/images/product_laptop_pro_1790801590092.jpg',
  smartphoneUltra: '/src/assets/images/product_smartphone_ultra_1790801601802.jpg',
  desktopWorkstation: '/src/assets/images/product_desktop_workstation_1790801612830.jpg',
  monitorStudio: '/src/assets/images/product_monitor_studio_1790801622847.jpg',
  headphonesAnc: '/src/assets/images/product_headphones_anc_1790801633558.jpg',
  printerLaser: '/src/assets/images/product_printer_laser_1790801643724.jpg',
  tabletPro: '/src/assets/images/product_tablet_pro_1790801656180.jpg',
  networkingRouter: '/src/assets/images/product_networking_router_1790801665360.jpg',
};

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'laptops',
    name: 'Laptops',
    shortLabel: 'Laptops',
    tagline: 'Work. Create. Perform.',
    editorialHeadline: 'Portable power for business, studio and everyday computing.',
    description:
      'MacBook Pro, HP EliteBook, Dell XPS, Lenovo ThinkPad, and professional notebooks stocked at our Nairobi CBD showroom.',
    image: STUDIO_IMAGES.laptopPro,
    startingPrice: 45000,
  },
  {
    id: 'phones',
    name: 'Phones',
    shortLabel: 'Phones',
    tagline: 'Stay connected.',
    editorialHeadline: 'Flagship smartphones with official warranty.',
    description:
      'iPhone, Samsung Galaxy Ultra, and Google Pixel devices with genuine local & manufacturer coverage.',
    image: STUDIO_IMAGES.smartphoneUltra,
    startingPrice: 35000,
  },
  {
    id: 'desktops',
    name: 'Desktops',
    shortLabel: 'Desktops',
    tagline: 'Built for productivity.',
    editorialHeadline: 'Desktops, All-in-Ones, and studio workstations.',
    description:
      'High-sustained performance towers, compact mini PCs, and enterprise desktop systems.',
    image: STUDIO_IMAGES.desktopWorkstation,
    startingPrice: 55000,
  },
  {
    id: 'monitors',
    name: 'Monitors',
    shortLabel: 'Monitors',
    tagline: 'See every detail.',
    editorialHeadline: '4K, 5K & 6K studio and office displays.',
    description:
      'Color-accurate IPS Black, OLED, and Ultrawide displays for creators, engineers, and corporate desks.',
    image: STUDIO_IMAGES.monitorStudio,
    startingPrice: 28000,
  },
  {
    id: 'printers',
    name: 'Printers',
    shortLabel: 'Printers',
    tagline: 'Print with confidence.',
    editorialHeadline: 'LaserJet, EcoTank & commercial multifunction printers.',
    description:
      'High-yield office printers, wireless scanners, and genuine toner supplies.',
    image: STUDIO_IMAGES.printerLaser,
    startingPrice: 24000,
  },
  {
    id: 'tablets',
    name: 'Tablets',
    shortLabel: 'Tablets',
    tagline: 'Sketch. Note. Present.',
    editorialHeadline: 'iPad Pro, Galaxy Tab & portable creative slates.',
    description:
      'Ultra-thin OLED and Liquid Retina tablets engineered for design, field operations, and executive mobility.',
    image: STUDIO_IMAGES.tabletPro,
    startingPrice: 42000,
  },
  {
    id: 'accessories',
    name: 'Accessories',
    shortLabel: 'Accessories',
    tagline: 'Complete your setup.',
    editorialHeadline: 'Studio audio, mechanical keyboards, docks & power.',
    description:
      'ANC headphones, Thunderbolt 4 docks, ergonomic mice, and genuine adapters.',
    image: STUDIO_IMAGES.headphonesAnc,
    startingPrice: 3500,
  },
  {
    id: 'networking',
    name: 'Networking',
    shortLabel: 'Networking',
    tagline: 'Multi-gigabit Wi-Fi 7 mesh.',
    editorialHeadline: 'Enterprise routers, switches, and access points.',
    description:
      'High-throughput Wi-Fi 7 mesh systems, MikroTik, Ubiquiti UniFi, and office networking hardware.',
    image: STUDIO_IMAGES.networkingRouter,
    startingPrice: 8500,
  },
  {
    id: 'storage',
    name: 'Storage',
    shortLabel: 'Storage',
    tagline: 'High-speed NVMe & NAS.',
    editorialHeadline: 'Portable NVMe SSDs, enterprise drives & backup.',
    description:
      'Rugged Thunderbolt external SSDs, internal M.2 NVMe modules, and multi-bay NAS storage.',
    image: STUDIO_IMAGES.desktopWorkstation,
    startingPrice: 9500,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    shortLabel: 'Gaming',
    tagline: 'High-refresh performance.',
    editorialHeadline: 'Consoles, RTX gaming rigs & pro peripherals.',
    description:
      'PlayStation 5, high-refresh gaming laptops, and custom-cooled graphics systems.',
    image: STUDIO_IMAGES.laptopPro,
    startingPrice: 65000,
  },
];

// Live production mode — all mock products, offers, and orders removed so the admin manages real inventory
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_OFFERS: Offer[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_SETTINGS: SiteSettings = {
  heroHeadline: 'Technology that moves you.',
  heroSupportingText:
    'Discover laptops, phones, desktops, printers and accessories selected for work, creativity, gaming and everyday life.',
  tickerMessages: [
    'TECH SOKONI KENYA — KENYATTA PIONEER BUILDING, 5TH FLOOR, SHOP 514',
    'ORDERS & WHATSAPP HOTLINE: +254 792 620 789',
    'INSPECT PACKAGE UPON ARRIVAL BEFORE PAYING VIA CASH OR M-PESA',
    'LIPA NA M-PESA BUY GOODS TILL NO: 9309020',
    '100% FREE NATIONWIDE SHIPPING & 2-HOUR NAIROBI EXPRESS DELIVERY',
  ],
  currencySymbol: 'KSh ',
  freeShippingThreshold: 0,
  supportPhone: '+254 792 620 789',
  supportEmail: 'shop@techsokoni.com',
  showroomAddress:
    'Kenyatta Pioneer Building, 5th Floor, Shop 514, Kenyatta Avenue (Next to I&M Building), Nairobi CBD, Kenya',
};
