import { ActiveRoute, CategoryId } from '../types/store';

const VALID_CATEGORIES: Set<string> = new Set([
  'all',
  'laptops',
  'phones',
  'desktops',
  'monitors',
  'printers',
  'tablets',
  'accessories',
  'networking',
]);

type InfoSection = Extract<ActiveRoute, { page: 'info' }>['section'];

const INFO_ALIAS_MAP: Record<string, InfoSection> = {
  // Returns / Refund / Exchange Policy
  returns: 'returns',
  return: 'returns',
  returnpolicy: 'returns',
  returnspolicy: 'returns',
  refund: 'returns',
  refunds: 'returns',
  refundpolicy: 'returns',
  refundspolicy: 'returns',
  exchangepolicy: 'returns',
  exchanges: 'returns',

  // Delivery / Shipping Policy
  delivery: 'delivery',
  deliverypolicy: 'delivery',
  shipping: 'delivery',
  shippingpolicy: 'delivery',

  // Warranty Policy
  warranty: 'warranty',
  warrantypolicy: 'warranty',
  guarantee: 'warranty',

  // Privacy Policy
  privacy: 'privacy',
  privacypolicy: 'privacy',
  dataprotection: 'privacy',

  // Terms of Service
  terms: 'terms',
  termsofservice: 'terms',
  termsandconditions: 'terms',
  termsofsale: 'terms',
  tos: 'terms',

  // About Us
  about: 'about',
  aboutus: 'about',
  company: 'about',

  // Contact / Support
  contact: 'contact',
  contactus: 'contact',
  support: 'contact',
  help: 'contact',
  showroom: 'contact',

  // FAQs
  faq: 'faq',
  faqs: 'faq',
  frequentlyaskedquestions: 'faq',
};

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseRouteFromUrl(): ActiveRoute {
  if (typeof window === 'undefined') return { page: 'home' };

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    const hashQuery = hash.includes('?')
      ? new URLSearchParams(hash.substring(hash.indexOf('?')))
      : null;

    // Firebase auth action links (e.g. /?mode=resetPassword&oobCode=...)
    const mode = searchParams.get('mode') || hashQuery?.get('mode');
    const oobCode = searchParams.get('oobCode') || hashQuery?.get('oobCode');
    if (oobCode || mode === 'resetPassword' || mode === 'reset-password') {
      return { page: 'client-portal' };
    }

    // Support explicit ?page= query param if supplied
    const pageParam = searchParams.get('page');
    let rawPath = window.location.pathname || '/';
    if ((!rawPath || rawPath === '/') && hash.startsWith('#/')) {
      rawPath = hash.slice(1).split('?')[0];
    } else if ((!rawPath || rawPath === '/') && pageParam) {
      rawPath = `/${pageParam}`;
    }

    const segments = rawPath
      .split('/')
      .map((s) => decodeURIComponent(s).trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return { page: 'home' };
    }

    const firstRaw = segments[0].toLowerCase();
    const firstNorm = normalizeSlug(firstRaw);

    if (firstNorm === 'home' || firstRaw === 'index.html') {
      return { page: 'home' };
    }

    // Direct match for info/policy pages (e.g. /returnpolicy, /return-policy, /privacy-policy, /warranty, etc.)
    if (INFO_ALIAS_MAP[firstNorm]) {
      return { page: 'info', section: INFO_ALIAS_MAP[firstNorm] };
    }

    // /info/:section or /policy/:section
    if ((firstNorm === 'info' || firstNorm === 'policy' || firstNorm === 'policies') && segments[1]) {
      const secondNorm = normalizeSlug(segments[1]);
      if (INFO_ALIAS_MAP[secondNorm]) {
        return { page: 'info', section: INFO_ALIAS_MAP[secondNorm] };
      }
    }

    // Catalog & Categories
    if (['shop', 'catalog', 'all', 'store'].includes(firstNorm)) {
      return { page: 'category', categoryId: 'all' };
    }
    if (firstNorm === 'products') {
      if (segments[1]) {
        return { page: 'product', productId: segments[1] };
      }
      return { page: 'category', categoryId: 'all' };
    }
    if (firstNorm === 'category' && segments[1]) {
      const cat = segments[1].toLowerCase();
      if (VALID_CATEGORIES.has(cat)) {
        return { page: 'category', categoryId: cat as CategoryId | 'all' };
      }
    }
    if (VALID_CATEGORIES.has(firstRaw)) {
      return { page: 'category', categoryId: firstRaw as CategoryId | 'all' };
    }

    // Deals / Offers
    if (['deals', 'offers', 'privileges', 'sale'].includes(firstNorm)) {
      return { page: 'deals' };
    }

    // Single Product
    if (firstNorm === 'product' && segments[1]) {
      return { page: 'product', productId: segments[1] };
    }

    // Track Order / Shipment
    if (['track', 'trackorder', 'trackshipment', 'tracking'].includes(firstNorm)) {
      return {
        page: 'track-shipment',
        orderId: segments[1] || searchParams.get('orderId') || searchParams.get('q') || undefined,
      };
    }

    // Book In-Person Viewing
    if (['book', 'bookviewing', 'viewing', 'appointment', 'appointments'].includes(firstNorm)) {
      return {
        page: 'book-viewing',
        productId: segments[1] || searchParams.get('productId') || undefined,
        bookingRef: searchParams.get('ref') || undefined,
      };
    }

    // Client Portal / Login / Account
    if (
      ['clientportal', 'portal', 'account', 'login', 'signin', 'signup', 'register'].includes(
        firstNorm
      )
    ) {
      return { page: 'client-portal' };
    }

    // Compare & Wishlist
    if (firstNorm === 'compare') {
      return { page: 'compare' };
    }
    if (['wishlist', 'saved', 'favorites'].includes(firstNorm)) {
      return { page: 'wishlist' };
    }

    // Admin Console
    if (['admin', 'console', 'dashboard'].includes(firstNorm)) {
      return { page: 'admin' };
    }

    return { page: 'not-found' };
  } catch {
    return { page: 'home' };
  }
}

export function getUrlForRoute(route: ActiveRoute): string {
  switch (route.page) {
    case 'home':
      return '/';
    case 'category':
      return route.categoryId === 'all' ? '/shop' : `/${route.categoryId}`;
    case 'deals':
      return '/deals';
    case 'product':
      return `/product/${encodeURIComponent(route.productId)}`;
    case 'track-shipment':
      return route.orderId
        ? `/track-shipment/${encodeURIComponent(route.orderId)}`
        : '/track-shipment';
    case 'book-viewing':
      return route.productId
        ? `/book-viewing/${encodeURIComponent(route.productId)}`
        : '/book-viewing';
    case 'client-portal':
      return '/client-portal';
    case 'compare':
      return '/compare';
    case 'wishlist':
      return '/wishlist';
    case 'admin':
      return '/admin';
    case 'info': {
      const canonicalMap: Record<InfoSection, string> = {
        returns: '/return-policy',
        delivery: '/delivery-policy',
        warranty: '/warranty',
        privacy: '/privacy-policy',
        terms: '/terms',
        about: '/about',
        contact: '/contact',
        faq: '/faq',
      };
      return canonicalMap[route.section] || '/';
    }
    case 'not-found':
      return typeof window !== 'undefined' ? window.location.pathname : '/404';
  }
}

export function getPageTitleForRoute(route: ActiveRoute): string {
  const base = 'Tech Sokoni Kenya';
  switch (route.page) {
    case 'home':
      return 'Tech Sokoni — Flagship Laptops, Phones & Tech in Kenya';
    case 'category':
      return route.categoryId === 'all'
        ? `All Hardware — ${base}`
        : `${route.categoryId.charAt(0).toUpperCase() + route.categoryId.slice(1)} — ${base}`;
    case 'deals':
      return `Active Showroom Deals — ${base}`;
    case 'track-shipment':
      return `Track Your Order — ${base}`;
    case 'book-viewing':
      return `Book Showroom Viewing — ${base}`;
    case 'client-portal':
      return `Client Account Portal — ${base}`;
    case 'compare':
      return `Hardware Comparison — ${base}`;
    case 'wishlist':
      return `Saved Wishlist — ${base}`;
    case 'admin':
      return `Management Console — ${base}`;
    case 'not-found':
      return `Page Not Found (404) — ${base}`;
    case 'info': {
      const titles: Record<InfoSection, string> = {
        returns: 'Returns & Exchange Policy',
        delivery: 'Nationwide Delivery & Payment on Delivery',
        warranty: '6-Month Official Hardware Warranty',
        privacy: 'Privacy Policy & Data Protection',
        terms: 'Terms of Service & Sale',
        about: 'About Tech Sokoni Kenya',
        contact: 'Contact & Nairobi Showroom',
        faq: 'Frequently Asked Questions',
      };
      return `${titles[route.section]} — ${base}`;
    }
    default:
      return base;
  }
}
