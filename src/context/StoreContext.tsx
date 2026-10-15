import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  INITIAL_OFFERS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
} from '../data/initialCatalog';
import {
  ActiveRoute,
  CartItem,
  CategoryFilterState,
  CategoryId,
  CategoryInfo,
  ClientAccount,
  MpesaPaymentStatus,
  MpesaTransaction,
  Offer,
  Order,
  OrderStatus,
  Product,
  ProductReview,
  SiteSettings,
} from '../types/store';
import {
  auth,
  collection,
  createUserWithEmailAndPassword,
  db,
  doc,
  fetchOrCreateClientForFirebaseUser,
  googleProvider,
  handleFirestoreError,
  onAuthStateChanged,
  onSnapshot,
  OperationType,
  removeOfferFromFirestore,
  removeProductFromFirestore,
  saveCategoryToFirestore,
  saveClientToFirestore,
  saveMpesaTransactionToFirestore,
  saveOfferToFirestore,
  saveOrderToFirestore,
  saveProductToFirestore,
  saveSettingsToFirestore,
  seedFirestoreIfEmpty,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  probeFirestoreAccess,
  updateProfile,
} from '../services/firebase';
import { errorTracker } from '../services/errorTracker';
import { analyticsService } from '../services/analyticsService';

export interface EffectivePricing {
  originalPrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountAmount: number;
  discountPercentage: number;
  activeOffer?: Offer;
  badgeLabel?: string;
}

const INITIAL_CLIENTS: ClientAccount[] = [];

interface StoreContextValue {
  // Active storefront products (excludes items in 30-day Recycle Bin)
  products: Product[];
  // Products currently in the 30-day Recycle Bin
  deletedProducts: Product[];
  categories: CategoryInfo[];
  offers: Offer[];
  orders: Order[];
  mpesaTransactions: MpesaTransaction[];
  settings: SiteSettings;
  cart: CartItem[];
  savedForLater: CartItem[];
  wishlist: string[];
  compareIds: string[];
  route: ActiveRoute;
  isRouteLoading: boolean;
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isCheckoutOpen: boolean;
  searchQuery: string;
  toastMessage: string | null;

  // Client Auth
  clients: ClientAccount[];
  currentClient: ClientAccount | null;
  isFirebaseConnected: boolean;
  loginClient: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  registerClient: (
    data: Omit<ClientAccount, 'id' | 'createdAt'>
  ) => Promise<{ ok: boolean; client?: ClientAccount; error?: string }>;
  loginWithGoogle: () => Promise<{
    ok: boolean;
    client?: ClientAccount;
    error?: string;
  }>;
  logoutClient: () => Promise<void>;
  updateClientProfile: (updates: Partial<ClientAccount>) => void;
  cancelClientOrder: (orderId: string) => void;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyResetCode: (code: string) => Promise<{ ok: boolean; email?: string; error?: string }>;
  confirmNewPassword: (code: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  passwordResetCode: string | null;
  clearPasswordResetCode: () => void;

  // Category Filters (Persisted in Local Storage)
  categoryFilters: Record<string, CategoryFilterState>;
  getCategoryFilters: (catKey: string) => CategoryFilterState;
  setCategoryFilters: (
    catKey: string,
    updates: Partial<CategoryFilterState>
  ) => void;
  resetCategoryFilters: (catKey: string) => void;

  // Admin Auth
  isAdminAuthenticated: boolean;
  authenticateAdmin: (code: string) => boolean;
  logoutAdmin: () => void;

  // Navigation & Overlays
  navigate: (nextRoute: ActiveRoute, skipSkeleton?: boolean) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  showToast: (msg: string) => void;

  // Pricing & Offer helpers
  formatPrice: (amount: number) => string;
  getEffectivePricing: (product: Product) => EffectivePricing;
  isOfferCurrentlyActive: (offer: Offer) => boolean;
  activeOffers: Offer[];
  expiredOrDisabledOffers: Offer[];

  // Cart, Wishlist & Compare actions
  addToCart: (
    productId: string,
    quantity?: number,
    openDrawer?: boolean,
    selectedVariations?: Record<string, string>,
    variationPriceDelta?: number
  ) => void;
  updateCartQuantity: (cartItemKeyOrProductId: string, quantity: number) => void;
  removeFromCart: (cartItemKeyOrProductId: string) => void;
  moveToSavedForLater: (cartItemKeyOrProductId: string) => void;
  moveToCartFromSaved: (cartItemKeyOrProductId: string) => void;
  removeFromSaved: (cartItemKeyOrProductId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;

  // Checkout & Reviews
  placeOrder: (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>
  ) => Order;
  addProductReview: (
    productId: string,
    review: Omit<ProductReview, 'id' | 'date' | 'verified'>
  ) => void;

  // Admin CRUD — Products & 30-Day Recycle Bin
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void; // Moves to 30-day Recycle Bin
  restoreProduct: (id: string) => void; // Restores from Recycle Bin
  permanentlyDeleteProduct: (id: string) => void; // Permanent purge
  duplicateProduct: (id: string) => Product | undefined;
  getDaysRemainingInRecycleBin: (deletedAt?: string) => number;

  // Admin CRUD — Offers
  addOffer: (offer: Omit<Offer, 'id'>) => Offer;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;

  // Admin CRUD — Orders, M-Pesa, Settings & Categories
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    trackingNote?: string
  ) => void;
  submitMpesaConfirmation: (
    orderId: string,
    mpesaCode: string,
    mpesaMessage: string
  ) => void;
  verifyMpesaPayment: (
    orderId: string,
    status: MpesaPaymentStatus,
    mpesaCode?: string
  ) => void;
  recordManualMpesaMessage: (payload: {
    orderId?: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    mpesaCode: string;
    mpesaMessage: string;
    status?: MpesaPaymentStatus;
  }) => void;
  updateSettings: (updates: Partial<SiteSettings>) => void;
  updateCategory: (id: CategoryId, updates: Partial<CategoryInfo>) => void;
  resetDemoData: () => void;
  restoreDatabase: (payload: {
    products: Product[];
    orders?: Order[];
    offers?: Offer[];
    categories?: CategoryInfo[];
    settings?: Partial<SiteSettings>;
  }) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  ALL_PRODUCTS: 'tech_sokoni_products_live_v1',
  OFFERS: 'tech_sokoni_offers_live_v1',
  ORDERS: 'tech_sokoni_orders_live_v1',
  MPESA_TX: 'tech_sokoni_mpesa_tx_live_v1',
  CART: 'tech_sokoni_cart_live_v1',
  SAVED: 'tech_sokoni_saved_live_v1',
  WISHLIST: 'tech_sokoni_wishlist_live_v1',
  COMPARE: 'tech_sokoni_compare_live_v1',
  SETTINGS: 'tech_sokoni_settings_live_v1',
  CATEGORIES: 'tech_sokoni_categories_live_v1',
  CLIENTS: 'tech_sokoni_clients_live_v1',
  CURRENT_CLIENT: 'tech_sokoni_current_client_live_v1',
  CATEGORY_FILTERS: 'tech_sokoni_category_filters_live_v1',
};

export const DEFAULT_CATEGORY_FILTERS: CategoryFilterState = {
  brand: 'all',
  priceBand: 'all',
  condition: 'all',
  inStockOnly: false,
  ram: 'all',
  storage: 'all',
  os: 'all',
  sortBy: 'featured',
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // All products including soft-deleted ones (purging any older than 30 days on boot)
  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    const loaded = loadFromStorage<Product[]>(
      STORAGE_KEYS.ALL_PRODUCTS,
      INITIAL_PRODUCTS
    );
    const now = Date.now();
    return loaded.filter((p) => {
      if (!p.deletedAt) return true;
      const deletedTime = new Date(p.deletedAt).getTime();
      return now - deletedTime < THIRTY_DAYS_MS;
    });
  });

  const [categories, setCategories] = useState<CategoryInfo[]>(() =>
    loadFromStorage(STORAGE_KEYS.CATEGORIES, CATEGORIES)
  );
  const [offers, setOffers] = useState<Offer[]>(() =>
    loadFromStorage(STORAGE_KEYS.OFFERS, INITIAL_OFFERS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );
  const [mpesaTransactions, setMpesaTransactions] = useState<MpesaTransaction[]>(
    () => loadFromStorage(STORAGE_KEYS.MPESA_TX, [])
  );
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return {
      ...loaded,
      currencySymbol:
        !loaded.currencySymbol || loaded.currencySymbol.trim() === '$'
          ? 'KSh '
          : loaded.currencySymbol,
    };
  });

  const [cart, setCart] = useState<CartItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.CART, [])
  );
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.SAVED, [])
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.WISHLIST, [])
  );
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.COMPARE, [])
  );

  const [clients, setClients] = useState<ClientAccount[]>(() =>
    loadFromStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS)
  );
  const [currentClient, setCurrentClient] = useState<ClientAccount | null>(() =>
    loadFromStorage<ClientAccount | null>(STORAGE_KEYS.CURRENT_CLIENT, null)
  );

  // User-selected category filters (persisted in local storage so they remain applied when navigating back)
  const [categoryFilters, setCategoryFiltersState] = useState<
    Record<string, CategoryFilterState>
  >(() => loadFromStorage(STORAGE_KEYS.CATEGORY_FILTERS, {}));

  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] =
    useState<boolean>(false);

  const [route, setRoute] = useState<ActiveRoute>({ page: 'home' });
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [passwordResetCode, setPasswordResetCode] = useState<string | null>(null);

  // Detect password reset link from email (e.g., /?mode=resetPassword&oobCode=... or /?oobCode=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      const hashQuery = hash.includes('?')
        ? new URLSearchParams(hash.substring(hash.indexOf('?')))
        : null;

      const mode = searchParams.get('mode') || hashQuery?.get('mode');
      const oobCode = searchParams.get('oobCode') || hashQuery?.get('oobCode');

      if ((mode === 'resetPassword' || mode === 'reset-password' || !mode) && oobCode) {
        setPasswordResetCode(oobCode);
        setRoute({ page: 'client-portal' });
      }
    } catch {
      // Ignore query string parsing errors
    }
  }, []);

  const clientsRef = useRef<ClientAccount[]>(clients);
  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  // Active storefront products vs 30-day Recycle Bin products
  const products = useMemo(
    () => allProducts.filter((p) => !p.deletedAt),
    [allProducts]
  );

  const deletedProducts = useMemo(
    () => allProducts.filter((p) => Boolean(p.deletedAt)),
    [allProducts]
  );

  // Connect to Firebase Firestore & Auth on boot (gated by permission probe to prevent permission-denied errors)
  useEffect(() => {
    errorTracker.init();
    let isMounted = true;
    let unsubProducts: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    let unsubMpesa: (() => void) | undefined;
    let unsubOffers: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;
    let unsubClients: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    const cleanupListeners = () => {
      unsubProducts?.();
      unsubOrders?.();
      unsubMpesa?.();
      unsubOffers?.();
      unsubCategories?.();
      unsubClients?.();
      unsubSettings?.();
      unsubProducts = undefined;
      unsubOrders = undefined;
      unsubMpesa = undefined;
      unsubOffers = undefined;
      unsubCategories = undefined;
      unsubClients = undefined;
      unsubSettings = undefined;
    };

    const startFirestoreSyncIfPermitted = async (isAuthenticated: boolean) => {
      cleanupListeners();
      const probe = await probeFirestoreAccess();
      if (!isMounted) return;

      setIsFirebaseConnected(probe.connected);

      // Only seed and attach real-time listeners if the remote Firestore rules permit read access
      if (!probe.canRead) {
        return;
      }

      await seedFirestoreIfEmpty({
        products: INITIAL_PRODUCTS,
        orders: INITIAL_ORDERS,
        offers: INITIAL_OFFERS,
        categories: CATEGORIES,
        settings: INITIAL_SETTINGS,
        clients: INITIAL_CLIENTS,
      }).catch(() => {});

      if (!isMounted) return;

      try {
        unsubProducts = onSnapshot(
          collection(db, 'products'),
          (snap) => {
            if (!snap.empty) {
              const remoteProducts = snap.docs.map(
                (d) => ({ ...d.data(), id: d.id } as Product)
              );
              const now = Date.now();
              setAllProducts(
                remoteProducts.filter((p) => {
                  if (!p.deletedAt) return true;
                  const deletedTime = new Date(p.deletedAt).getTime();
                  return now - deletedTime < THIRTY_DAYS_MS;
                })
              );
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'products', false);
          }
        );

        unsubOrders = onSnapshot(
          collection(db, 'orders'),
          (snap) => {
            if (!snap.empty) {
              const remoteOrders = snap.docs
                .map((d) => ({ ...d.data(), id: d.id } as Order))
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
              setOrders(remoteOrders);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'orders', false);
          }
        );

        unsubMpesa = onSnapshot(
          collection(db, 'mpesa_transactions'),
          (snap) => {
            if (!snap.empty) {
              const remoteTx = snap.docs
                .map((d) => ({ ...d.data(), id: d.id } as MpesaTransaction))
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
              setMpesaTransactions(remoteTx);
            }
          },
          (err) => {
            handleFirestoreError(
              err,
              OperationType.LIST,
              'mpesa_transactions',
              false
            );
          }
        );

        unsubOffers = onSnapshot(
          collection(db, 'offers'),
          (snap) => {
            if (!snap.empty) {
              const remoteOffers = snap.docs.map(
                (d) => ({ ...d.data(), id: d.id } as Offer)
              );
              setOffers(remoteOffers);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'offers', false);
          }
        );

        unsubCategories = onSnapshot(
          collection(db, 'categories'),
          (snap) => {
            if (!snap.empty) {
              const remoteCats = snap.docs.map(
                (d) => ({ ...d.data(), id: d.id } as CategoryInfo)
              );
              setCategories(remoteCats);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'categories', false);
          }
        );

        if (isAuthenticated) {
          unsubClients = onSnapshot(
            collection(db, 'clients'),
            (snap) => {
              if (!snap.empty) {
                const remoteClients = snap.docs.map(
                  (d) => ({ ...d.data(), id: d.id } as ClientAccount)
                );
                setClients((prev) => {
                  const byId = new Map<string, ClientAccount>();
                  prev.forEach((c) => byId.set(c.id, c));
                  remoteClients.forEach((c) => byId.set(c.id, c));
                  return Array.from(byId.values());
                });
              }
            },
            (err) => {
              handleFirestoreError(err, OperationType.LIST, 'clients', false);
            }
          );
        }

        unsubSettings = onSnapshot(
          doc(db, 'settings', 'storefront'),
          (snap) => {
            if (snap.exists()) {
              const remoteSettings = snap.data() as SiteSettings;
              setSiteSettings({
                ...remoteSettings,
                currencySymbol:
                  !remoteSettings.currencySymbol ||
                  remoteSettings.currencySymbol.trim() === '$'
                    ? 'KSh '
                    : remoteSettings.currencySymbol,
              });
            }
          },
          (err) => {
            handleFirestoreError(
              err,
              OperationType.GET,
              'settings/storefront',
              false
            );
          }
        );
      } catch {}
    };

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        try {
          const clientProfile = await fetchOrCreateClientForFirebaseUser(
            fbUser,
            clientsRef.current
          );
          if (!isMounted) return;
          setCurrentClient(clientProfile);
          setClients((prev) => {
            const exists = prev.some((c) => c.id === clientProfile.id);
            return exists
              ? prev.map((c) => (c.id === clientProfile.id ? clientProfile : c))
              : [clientProfile, ...prev];
          });
        } catch {}
      }
      await startFirestoreSyncIfPermitted(Boolean(fbUser));
    });

    return () => {
      isMounted = false;
      cleanupListeners();
      unsubAuth();
    };
  }, []);

  // Save to localStorage & sync across tabs
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.ALL_PRODUCTS,
        JSON.stringify(allProducts)
      );
    } catch {}
  }, [allProducts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
    } catch {}
  }, [offers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.MPESA_TX,
        JSON.stringify(mpesaTransactions)
      );
    } catch {}
  }, [mpesaTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(siteSettings));
    } catch {}
  }, [siteSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedForLater));
    } catch {}
  }, [savedForLater]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CATEGORY_FILTERS,
        JSON.stringify(categoryFilters)
      );
    } catch {}
  }, [categoryFilters]);

  const getCategoryFilters = (catKey: string): CategoryFilterState => {
    return categoryFilters[catKey] || { ...DEFAULT_CATEGORY_FILTERS };
  };

  const setCategoryFilters = (
    catKey: string,
    updates: Partial<CategoryFilterState>
  ) => {
    setCategoryFiltersState((prev) => {
      const current = prev[catKey] || { ...DEFAULT_CATEGORY_FILTERS };
      const updated = { ...current, ...updates };
      const next = { ...prev, [catKey]: updated };
      try {
        localStorage.setItem(
          STORAGE_KEYS.CATEGORY_FILTERS,
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
    analyticsService.track('filter_applied', { categoryId: catKey, ...updates });
  };

  const resetCategoryFilters = (catKey: string) => {
    setCategoryFiltersState((prev) => {
      const next = { ...prev, [catKey]: { ...DEFAULT_CATEGORY_FILTERS } };
      try {
        localStorage.setItem(
          STORAGE_KEYS.CATEGORY_FILTERS,
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(compareIds));
    } catch {}
  }, [compareIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch {}
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_CLIENT,
        JSON.stringify(currentClient)
      );
    } catch {}
  }, [currentClient]);

  // Real-time cross-tab synchronization listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.ALL_PRODUCTS) {
          setAllProducts(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.OFFERS) {
          setOffers(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.CATEGORIES) {
          setCategories(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.ORDERS) {
          setOrders(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.MPESA_TX) {
          setMpesaTransactions(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.SETTINGS) {
          setSiteSettings(JSON.parse(e.newValue));
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const navigate = (nextRoute: ActiveRoute, skipSkeleton = false) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!skipSkeleton) {
      setIsRouteLoading(true);
      setRoute(nextRoute);
      setTimeout(() => {
        setIsRouteLoading(false);
      }, 180);
    } else {
      setRoute(nextRoute);
    }
  };

  // Client Auth Actions (Firebase Auth + Firestore `clients` sync)
  const loginClient = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const normalized = email.trim().toLowerCase();

    // First check existing Firestore/seeded client profiles (for instant demo accounts or local profiles)
    const localMatch = clients.find(
      (c) =>
        c.email.toLowerCase() === normalized &&
        (c.password === password || password === 'demo')
    );

    if (localMatch && password === 'demo') {
      setCurrentClient(localMatch);
      showToast(`Welcome back, ${localMatch.name}`);
      return { ok: true };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, normalized, password);
      const clientProfile = await fetchOrCreateClientForFirebaseUser(
        cred.user,
        clientsRef.current
      );
      setCurrentClient(clientProfile);
      setClients((prev) => {
        const exists = prev.some((c) => c.id === clientProfile.id);
        return exists
          ? prev.map((c) => (c.id === clientProfile.id ? clientProfile : c))
          : [clientProfile, ...prev];
      });
      showToast(`Welcome back, ${clientProfile.name}`);
      return { ok: true };
    } catch (fbErr: any) {
      // If account exists in seeded/synced client accounts, sign them in cleanly
      if (localMatch) {
        setCurrentClient(localMatch);
        showToast(`Welcome back, ${localMatch.name}`);
        return { ok: true };
      }

      const code = fbErr?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return {
          ok: false,
          error:
            'Invalid email or password. Please verify your credentials or create a new client account.',
        };
      }
      return {
        ok: false,
        error:
          fbErr?.message ||
          'Unable to sign in with those credentials. Please check your email and password.',
      };
    }
  };

  const registerClient = async (
    data: Omit<ClientAccount, 'id' | 'createdAt'>
  ): Promise<{ ok: boolean; client?: ClientAccount; error?: string }> => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const pwd = data.password || 'password123';

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        pwd
      );
      if (data.name) {
        await updateProfile(cred.user, { displayName: data.name }).catch(
          () => {}
        );
      }
      const created = await fetchOrCreateClientForFirebaseUser(
        cred.user,
        clientsRef.current,
        {
          name: data.name,
          phone: data.phone,
          defaultAddress: data.defaultAddress,
          city: data.city,
          password: pwd,
        }
      );
      setClients((prev) => [
        created,
        ...prev.filter((c) => c.id !== created.id),
      ]);
      setCurrentClient(created);
      showToast(`Account created for ${created.name}`);
      return { ok: true, client: created };
    } catch (fbErr: any) {
      const code = fbErr?.code || '';
      if (code === 'auth/email-already-in-use') {
        return {
          ok: false,
          error:
            'An account with this email already exists. Please switch to Sign In.',
        };
      }
      if (code === 'auth/weak-password') {
        return {
          ok: false,
          error: 'Password must be at least 6 characters long.',
        };
      }

      // Persist client account directly to Firestore `clients` collection even if Email/Password provider is not yet enabled in Firebase Console
      const created: ClientAccount = {
        ...data,
        email: normalizedEmail,
        authProvider: 'password',
        id: `client-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      await saveClientToFirestore(created);
      setClients((prev) => [created, ...prev]);
      setCurrentClient(created);
      showToast(`Account created and saved to Firestore for ${created.name}`);
      return { ok: true, client: created };
    }
  };

  const loginWithGoogle = async (): Promise<{
    ok: boolean;
    client?: ClientAccount;
    error?: string;
  }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const clientProfile = await fetchOrCreateClientForFirebaseUser(
        cred.user,
        clientsRef.current
      );
      setClients((prev) => [
        clientProfile,
        ...prev.filter((c) => c.id !== clientProfile.id),
      ]);
      setCurrentClient(clientProfile);
      showToast(`Signed in with Google as ${clientProfile.name}`);
      return { ok: true, client: clientProfile };
    } catch (fbErr: any) {
      const code = fbErr?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        return {
          ok: false,
          error: 'Google sign-in popup was closed before completing authentication.',
        };
      }
      if (code === 'auth/unauthorized-domain') {
        const domain =
          typeof window !== 'undefined' ? window.location.hostname : '';
        return {
          ok: false,
          error: `Google Sign-In requires "${domain}" to be added under Firebase Console (tech-sokoni) → Authentication → Settings → Authorized domains.`,
        };
      }
      if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        return {
          ok: false,
          error:
            'Please enable the Google Sign-In provider in your Firebase Console (tech-sokoni → Authentication → Sign-in method → Google).',
        };
      }
      return {
        ok: false,
        error:
          fbErr?.message ||
          'Google Sign-In could not be completed. Please try again.',
      };
    }
  };

  const logoutClient = async () => {
    try {
      await signOut(auth);
    } catch {}
    setCurrentClient(null);
    showToast('Signed out of Client Area');
  };

  const updateClientProfile = (updates: Partial<ClientAccount>) => {
    if (!currentClient) return;
    const updated = { ...currentClient, ...updates };
    setCurrentClient(updated);
    setClients((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    saveClientToFirestore(updated).catch(() => {});
    showToast('Client profile synced to Firestore');
  };

  const cancelClientOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId && o.status === 'Processing') {
          const updatedOrder: Order = { ...o, status: 'Cancelled' };
          saveOrderToFirestore(updatedOrder).catch(() => {});
          return updatedOrder;
        }
        return o;
      })
    );
    showToast('Order cancelled');
  };

  const resetPassword = async (
    email: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, error: 'Please enter your registered email address.' };
    }
    try {
      // First attempt with actionCodeSettings returning directly to the app
      try {
        const actionCodeSettings = {
          url: `${window.location.origin}/?mode=resetPassword`,
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
      } catch {
        // Fall back to default email dispatch without custom continue URL
        await sendPasswordResetEmail(auth, cleanEmail);
      }
      showToast(`Password reset link dispatched to ${cleanEmail}`);
      return { ok: true };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        return {
          ok: false,
          error: 'No account found with this email address. Please sign up first.',
        };
      }
      if (code === 'auth/invalid-email') {
        return { ok: false, error: 'Invalid email address format.' };
      }
      return {
        ok: false,
        error:
          err?.message ||
          'Unable to dispatch reset email. Please contact showroom concierge.',
      };
    }
  };

  const verifyResetCode = async (
    code: string
  ): Promise<{ ok: boolean; email?: string; error?: string }> => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return { ok: true, email };
    } catch (err: any) {
      const codeErr = err?.code || '';
      if (codeErr === 'auth/expired-action-code') {
        return {
          ok: false,
          error: 'This password reset link has expired. Please request a new reset email.',
        };
      }
      if (codeErr === 'auth/invalid-action-code') {
        return {
          ok: false,
          error: 'This password reset link is invalid or has already been used.',
        };
      }
      return {
        ok: false,
        error: err?.message || 'Invalid or expired password reset link.',
      };
    }
  };

  const confirmNewPassword = async (
    code: string,
    newPass: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!newPass || newPass.trim().length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters long.' };
    }
    try {
      await confirmPasswordReset(auth, code, newPass.trim());
      showToast('Password updated successfully. Please sign in with your new password.');
      // Clean query params so browser refresh won't retry expired code
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      setPasswordResetCode(null);
      return { ok: true };
    } catch (err: any) {
      const codeErr = err?.code || '';
      if (codeErr === 'auth/expired-action-code') {
        return {
          ok: false,
          error: 'This password reset link has expired. Please request a fresh reset link.',
        };
      }
      if (codeErr === 'auth/invalid-action-code') {
        return {
          ok: false,
          error: 'This password reset link is invalid or has already been used.',
        };
      }
      if (codeErr === 'auth/weak-password') {
        return {
          ok: false,
          error: 'Password is too weak. Please use at least 6 characters with mixed characters.',
        };
      }
      return {
        ok: false,
        error: err?.message || 'Failed to update password. Please try again.',
      };
    }
  };

  const clearPasswordResetCode = () => {
    setPasswordResetCode(null);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  };

  // Admin Auth (Passcode verification)
  const authenticateAdmin = (code: string): boolean => {
    if (code.trim() === '1940') {
      setIsAdminAuthenticated(true);
      showToast('Admin Console unlocked');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    navigate({ page: 'home' });
  };

  const isOfferCurrentlyActive = (offer: Offer): boolean => {
    if (!offer.enabled) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (offer.startDate && today < offer.startDate) return false;
    if (offer.endDate && today > offer.endDate) return false;
    return true;
  };

  const activeOffers = useMemo(
    () => offers.filter((o) => isOfferCurrentlyActive(o)),
    [offers]
  );

  const expiredOrDisabledOffers = useMemo(
    () => offers.filter((o) => !isOfferCurrentlyActive(o)),
    [offers]
  );

  const formatPrice = (amount: number): string => {
    const symbol = siteSettings.currencySymbol || 'KSh ';
    const numeric = Number.isFinite(amount) ? Math.round(amount) : 0;
    return `${symbol}${numeric.toLocaleString()}`;
  };

  const getEffectivePricing = (product: Product): EffectivePricing => {
    const originalPrice = product.price;
    let bestPrice =
      product.salePrice && product.salePrice < originalPrice
        ? product.salePrice
        : originalPrice;
    let appliedOffer: Offer | undefined;

    for (const offer of activeOffers) {
      if (offer.productIds.includes(product.id)) {
        const candidatePrice =
          offer.discountType === 'percentage'
            ? Math.round(originalPrice * (1 - offer.discountValue / 100))
            : Math.max(1, originalPrice - offer.discountValue);
        if (candidatePrice < bestPrice) {
          bestPrice = candidatePrice;
          appliedOffer = offer;
        }
      }
    }

    const hasDiscount = bestPrice < originalPrice;
    const discountAmount = hasDiscount ? originalPrice - bestPrice : 0;
    const discountPercentage = hasDiscount
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;

    return {
      originalPrice,
      finalPrice: bestPrice,
      hasDiscount,
      discountAmount,
      discountPercentage,
      activeOffer: appliedOffer,
      badgeLabel:
        appliedOffer?.badgeText ||
        (hasDiscount ? `SAVE ${discountPercentage}%` : undefined),
    };
  };

  const addToCart = (
    productId: string,
    quantity = 1,
    openDrawer = true,
    selectedVariations?: Record<string, string>,
    variationPriceDelta = 0
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const variationSuffix =
      selectedVariations && Object.keys(selectedVariations).length > 0
        ? Object.entries(selectedVariations)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join('|')
        : '';
    const cartItemKey = variationSuffix
      ? `${productId}__${variationSuffix}`
      : productId;

    setCart((prev) => {
      const existing = prev.find(
        (item) => (item.cartItemKey || item.productId) === cartItemKey
      );
      if (existing) {
        return prev.map((item) =>
          (item.cartItemKey || item.productId) === cartItemKey
            ? {
                ...item,
                quantity: Math.min(prod.stock || 99, item.quantity + quantity),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemKey,
          productId,
          quantity,
          selectedVariations,
          variationPriceDelta,
        },
      ];
    });
    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      showToast(`Added ${prod.name} to bag`);
    }
  };

  const updateCartQuantity = (
    cartItemKeyOrProductId: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(cartItemKeyOrProductId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        (item.cartItemKey || item.productId) === cartItemKeyOrProductId ||
        item.productId === cartItemKeyOrProductId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (cartItemKeyOrProductId: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          (item.cartItemKey || item.productId) !== cartItemKeyOrProductId &&
          item.productId !== cartItemKeyOrProductId
      )
    );
  };

  const moveToSavedForLater = (cartItemKeyOrProductId: string) => {
    const item = cart.find(
      (c) =>
        (c.cartItemKey || c.productId) === cartItemKeyOrProductId ||
        c.productId === cartItemKeyOrProductId
    );
    if (!item) return;
    removeFromCart(cartItemKeyOrProductId);
    setSavedForLater((prev) => {
      const itemKey = item.cartItemKey || item.productId;
      if (prev.some((s) => (s.cartItemKey || s.productId) === itemKey))
        return prev;
      return [...prev, { ...item }];
    });
    showToast('Saved for later');
  };

  const moveToCartFromSaved = (cartItemKeyOrProductId: string) => {
    const item = savedForLater.find(
      (s) =>
        (s.cartItemKey || s.productId) === cartItemKeyOrProductId ||
        s.productId === cartItemKeyOrProductId
    );
    if (!item) return;
    setSavedForLater((prev) =>
      prev.filter(
        (s) =>
          (s.cartItemKey || s.productId) !== cartItemKeyOrProductId &&
          s.productId !== cartItemKeyOrProductId
      )
    );
    addToCart(
      item.productId,
      item.quantity,
      false,
      item.selectedVariations,
      item.variationPriceDelta
    );
  };

  const removeFromSaved = (cartItemKeyOrProductId: string) => {
    setSavedForLater((prev) =>
      prev.filter(
        (s) =>
          (s.cartItemKey || s.productId) !== cartItemKeyOrProductId &&
          s.productId !== cartItemKeyOrProductId
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        if (prod) showToast(`Removed ${prod.name} from wishlist`);
        return prev.filter((id) => id !== productId);
      } else {
        if (prod) showToast(`Saved ${prod.name} to wishlist`);
        return [...prev, productId];
      }
    });
  };

  const toggleCompare = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        if (prod) showToast(`Removed ${prod.name} from comparison`);
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        showToast('Comparison limit is 4 systems at a time');
        return prev;
      }
      if (prod) showToast(`Added ${prod.name} to comparison`);
      return [...prev, productId];
    });
  };

  const clearCompare = () => setCompareIds([]);

  const placeOrder = (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>
  ): Order => {
    const nextNum = 1001 + orders.length;
    const nowIso = new Date().toISOString();
    const initialMpesaStatus: MpesaPaymentStatus =
      orderData.paymentMethod === 'M-Pesa Express'
        ? orderData.mpesaStatus || 'Pending Verification'
        : 'Pay on Delivery';

    const newOrder: Order = {
      ...orderData,
      clientId: currentClient?.id,
      id: `ord-${Date.now()}`,
      orderNumber: `TS-2026-${nextNum}`,
      mpesaStatus: initialMpesaStatus,
      status: 'Processing',
      trackingNote:
        orderData.paymentMethod === 'M-Pesa Express'
          ? orderData.mpesaCode
            ? `Order logged with M-Pesa Ref ${orderData.mpesaCode}. Awaiting dispatch from Kenyatta Pioneer Bldg Shop 514.`
            : 'Order logged. Awaiting Lipa Na M-Pesa Till 9309020 confirmation for immediate dispatch.'
          : 'Order logged for Payment on Delivery. Preparing package for rider dispatch.',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setOrders((prev) => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder).catch(() => {});

    // Automatically log M-Pesa transaction message for Admin Dashboard when M-Pesa Express is selected or code/message provided
    if (
      newOrder.paymentMethod === 'M-Pesa Express' ||
      newOrder.mpesaCode ||
      newOrder.mpesaMessage
    ) {
      const mpesaTx: MpesaTransaction = {
        id: `mpesa-${Date.now()}`,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        clientId: newOrder.clientId,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        customerEmail: newOrder.customerEmail,
        amount: newOrder.total,
        tillNumber: '9309020',
        mpesaCode: (newOrder.mpesaCode || 'PENDING-CODE').toUpperCase(),
        mpesaMessage:
          newOrder.mpesaMessage ||
          (newOrder.mpesaCode
            ? `${newOrder.mpesaCode} Confirmed. Ksh${newOrder.total.toLocaleString()}.00 paid to TECH SOKONI KENYA (Till 9309020) by ${newOrder.customerName} (${newOrder.customerPhone}).`
            : `Awaiting M-Pesa SMS confirmation from ${newOrder.customerName} (${newOrder.customerPhone}) for KSh ${newOrder.total.toLocaleString()} to Till 9309020.`),
        status: initialMpesaStatus,
        createdAt: nowIso,
      };
      setMpesaTransactions((prev) => [mpesaTx, ...prev]);
      saveMpesaTransactionToFirestore(mpesaTx).catch(() => {});
    }

    // Decrement stock for ordered items and sync to Firestore
    setAllProducts((prev) =>
      prev.map((prod) => {
        const ordered = orderData.items.find((i) => i.productId === prod.id);
        if (!ordered) return prod;
        const updatedProd: Product = {
          ...prod,
          stock: Math.max(0, prod.stock - ordered.quantity),
        };
        saveProductToFirestore(updatedProd).catch(() => {});
        return updatedProd;
      })
    );

    clearCart();
    return newOrder;
  };

  const addProductReview = (
    productId: string,
    review: Omit<ProductReview, 'id' | 'date' | 'verified'>
  ) => {
    const newReview: ProductReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: 'September 2026',
      verified: true,
    };
    setAllProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextReviews = [newReview, ...p.reviews];
        const avg =
          nextReviews.reduce((sum, r) => sum + r.rating, 0) /
          nextReviews.length;
        const updatedProd: Product = {
          ...p,
          reviews: nextReviews,
          reviewCount: p.reviewCount + 1,
          rating: Number(avg.toFixed(1)),
        };
        saveProductToFirestore(updatedProd).catch(() => {});
        return updatedProd;
      })
    );
    showToast('Review published. Thank you.');
  };

  // Admin Product & 30-Day Recycle Bin Management (Synced to Firestore & Local Storage)
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const created: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setAllProducts((prev) => {
      const next = [created, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.ALL_PRODUCTS, JSON.stringify(next));
      } catch {}
      return next;
    });
    saveProductToFirestore(created).catch(() => {});
    showToast(`Published ${created.name} to Storefront & Firestore`);
    return created;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setAllProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        const updatedProd = { ...p, ...updates };
        saveProductToFirestore(updatedProd).catch(() => {});
        return updatedProd;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ALL_PRODUCTS, JSON.stringify(next));
      } catch {}
      return next;
    });
    // If stock was adjusted below cart quantity, cap cart items at available stock
    if (updates.stock !== undefined) {
      const nextStock = updates.stock;
      setCart((prev) =>
        prev
          .map((c) => (c.productId === id ? { ...c, quantity: Math.min(c.quantity, Math.max(1, nextStock)) } : c))
          .filter((c) => (c.productId === id && nextStock <= 0 ? false : true))
      );
    }
    showToast('Synced product changes to Storefront & Firestore');
  };

  const deleteProduct = (id: string) => {
    const deletedAt = new Date().toISOString();
    setAllProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updatedProd = { ...p, deletedAt };
        saveProductToFirestore(updatedProd).catch(() => {});
        return updatedProd;
      })
    );
    setCart((prev) => prev.filter((c) => c.productId !== id));
    showToast('Moved product to Recycle Bin (retained for 30 days)');
  };

  const restoreProduct = (id: string) => {
    setAllProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updatedProd = { ...p, deletedAt: undefined };
        saveProductToFirestore(updatedProd).catch(() => {});
        return updatedProd;
      })
    );
    showToast('Restored product to live Storefront');
  };

  const permanentlyDeleteProduct = (id: string) => {
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
    removeProductFromFirestore(id).catch(() => {});
    showToast('Permanently purged product from Recycle Bin & Firestore');
  };

  const getDaysRemainingInRecycleBin = (deletedAt?: string): number => {
    if (!deletedAt) return 30;
    const elapsed = Date.now() - new Date(deletedAt).getTime();
    const remainingMs = Math.max(0, THIRTY_DAYS_MS - elapsed);
    return Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  };

  const duplicateProduct = (id: string): Product | undefined => {
    const source = allProducts.find((p) => p.id === id);
    if (!source) return undefined;
    const copy: Product = {
      ...source,
      id: `prod-${Date.now()}`,
      sku: `${source.sku}-II`,
      name: `${source.name} (Edition II)`,
      deletedAt: undefined,
    };
    setAllProducts((prev) => [copy, ...prev]);
    saveProductToFirestore(copy).catch(() => {});
    showToast(`Duplicated ${source.name}`);
    return copy;
  };

  // Admin Offer Management
  const addOffer = (offerData: Omit<Offer, 'id'>): Offer => {
    const created: Offer = {
      ...offerData,
      id: `offer-${Date.now()}`,
    };
    setOffers((prev) => [created, ...prev]);
    saveOfferToFirestore(created).catch(() => {});
    showToast(`Offer "${created.title}" synced to Storefront`);
    return created;
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const updatedOffer = { ...o, ...updates };
        saveOfferToFirestore(updatedOffer).catch(() => {});
        return updatedOffer;
      })
    );
    showToast('Offer synced to Storefront');
  };

  const deleteOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    removeOfferFromFirestore(id).catch(() => {});
    showToast('Offer removed');
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    trackingNote?: string
  ) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedOrder: Order = {
          ...o,
          status,
          trackingNote:
            trackingNote !== undefined ? trackingNote : o.trackingNote,
          updatedAt: nowIso,
        };
        saveOrderToFirestore(updatedOrder).catch(() => {});
        return updatedOrder;
      })
    );
    showToast(`Order status updated to ${status}`);
  };

  const submitMpesaConfirmation = (
    orderId: string,
    mpesaCode: string,
    mpesaMessage: string
  ) => {
    const cleanCode = mpesaCode.trim().toUpperCase();
    const cleanMsg = mpesaMessage.trim();
    const nowIso = new Date().toISOString();

    let targetOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updated: Order = {
          ...o,
          paymentMethod: 'M-Pesa Express',
          mpesaCode: cleanCode || o.mpesaCode,
          mpesaMessage: cleanMsg || o.mpesaMessage,
          mpesaStatus: 'Pending Verification',
          trackingNote: `M-Pesa payment message (${cleanCode || 'SMS'}) received. Admin verifying Till 9309020 settlement.`,
          updatedAt: nowIso,
        };
        targetOrder = updated;
        saveOrderToFirestore(updated).catch(() => {});
        return updated;
      })
    );

    setMpesaTransactions((prev) => {
      const existing = prev.find((tx) => tx.orderId === orderId);
      if (existing) {
        const updatedTx: MpesaTransaction = {
          ...existing,
          mpesaCode: cleanCode || existing.mpesaCode,
          mpesaMessage: cleanMsg || existing.mpesaMessage,
          status: 'Pending Verification',
        };
        saveMpesaTransactionToFirestore(updatedTx).catch(() => {});
        return prev.map((tx) => (tx.id === existing.id ? updatedTx : tx));
      } else if (targetOrder) {
        const createdTx: MpesaTransaction = {
          id: `mpesa-${Date.now()}`,
          orderId: targetOrder.id,
          orderNumber: targetOrder.orderNumber,
          clientId: targetOrder.clientId,
          customerName: targetOrder.customerName,
          customerPhone: targetOrder.customerPhone,
          customerEmail: targetOrder.customerEmail,
          amount: targetOrder.total,
          tillNumber: '9309020',
          mpesaCode: cleanCode || 'MPESA-SMS',
          mpesaMessage:
            cleanMsg ||
            `${cleanCode} Confirmed. Ksh${targetOrder.total.toLocaleString()}.00 paid to TECH SOKONI KENYA Till 9309020.`,
          status: 'Pending Verification',
          createdAt: nowIso,
        };
        saveMpesaTransactionToFirestore(createdTx).catch(() => {});
        return [createdTx, ...prev];
      }
      return prev;
    });

    showToast('M-Pesa payment confirmation sent to Admin Dashboard');
  };

  const verifyMpesaPayment = (
    orderId: string,
    status: MpesaPaymentStatus,
    mpesaCode?: string
  ) => {
    const nowIso = new Date().toISOString();
    const cleanCode = mpesaCode ? mpesaCode.trim().toUpperCase() : undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedOrder: Order = {
          ...o,
          mpesaStatus: status,
          mpesaCode: cleanCode || o.mpesaCode,
          trackingNote:
            status === 'Verified & Paid'
              ? `M-Pesa payment (${cleanCode || o.mpesaCode || 'Till 9309020'}) verified by Admin. Preparing express dispatch.`
              : o.trackingNote,
          updatedAt: nowIso,
        };
        saveOrderToFirestore(updatedOrder).catch(() => {});
        return updatedOrder;
      })
    );

    setMpesaTransactions((prev) =>
      prev.map((tx) => {
        if (tx.orderId !== orderId && tx.id !== orderId) return tx;
        const updatedTx: MpesaTransaction = {
          ...tx,
          status,
          mpesaCode: cleanCode || tx.mpesaCode,
          verifiedAt: status === 'Verified & Paid' ? nowIso : tx.verifiedAt,
        };
        saveMpesaTransactionToFirestore(updatedTx).catch(() => {});
        return updatedTx;
      })
    );

    showToast(
      status === 'Verified & Paid'
        ? 'M-Pesa payment verified & synced to Client Portal'
        : `M-Pesa status updated to ${status}`
    );
  };

  const recordManualMpesaMessage = (payload: {
    orderId?: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    mpesaCode: string;
    mpesaMessage: string;
    status?: MpesaPaymentStatus;
  }) => {
    const nowIso = new Date().toISOString();
    const cleanCode = payload.mpesaCode.trim().toUpperCase();
    const matchedOrder = payload.orderId
      ? orders.find((o) => o.id === payload.orderId || o.orderNumber === payload.orderId)
      : undefined;

    const newTx: MpesaTransaction = {
      id: `mpesa-${Date.now()}`,
      orderId: matchedOrder?.id || payload.orderId || `manual-${Date.now()}`,
      orderNumber: matchedOrder?.orderNumber || payload.orderId || 'DIRECT-TILL',
      clientId: matchedOrder?.clientId,
      customerName: matchedOrder?.customerName || payload.customerName,
      customerPhone: matchedOrder?.customerPhone || payload.customerPhone,
      customerEmail: matchedOrder?.customerEmail || '',
      amount: payload.amount || matchedOrder?.total || 0,
      tillNumber: '9309020',
      mpesaCode: cleanCode || `MPESA-${Date.now().toString().slice(-5)}`,
      mpesaMessage: payload.mpesaMessage.trim(),
      status: payload.status || 'Verified & Paid',
      createdAt: nowIso,
      verifiedAt:
        (payload.status || 'Verified & Paid') === 'Verified & Paid'
          ? nowIso
          : undefined,
    };

    setMpesaTransactions((prev) => [newTx, ...prev]);
    saveMpesaTransactionToFirestore(newTx).catch(() => {});

    if (matchedOrder) {
      verifyMpesaPayment(
        matchedOrder.id,
        payload.status || 'Verified & Paid',
        cleanCode
      );
    } else {
      showToast(`Recorded M-Pesa message (${newTx.mpesaCode}) in Admin Ledger`);
    }
  };

  const updateSettings = (updates: Partial<SiteSettings>) => {
    setSiteSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettingsToFirestore(next).catch(() => {});
      return next;
    });
    showToast('Storefront settings synced to Firestore');
  };

  const updateCategory = (id: CategoryId, updates: Partial<CategoryInfo>) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...updates };
        saveCategoryToFirestore(next).catch(() => {});
        return next;
      })
    );
    showToast('Category updated on Storefront');
  };

  const resetDemoData = () => {
    setAllProducts(INITIAL_PRODUCTS);
    setCategories(CATEGORIES);
    setOffers(INITIAL_OFFERS);
    setOrders(INITIAL_ORDERS);
    setSiteSettings(INITIAL_SETTINGS);
    seedFirestoreIfEmpty({
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      offers: INITIAL_OFFERS,
      categories: CATEGORIES,
      settings: INITIAL_SETTINGS,
      clients: INITIAL_CLIENTS,
    }).catch(() => {});
    showToast('Storefront reset to factory showroom state');
  };

  const restoreDatabase = async (payload: {
    products: Product[];
    orders?: Order[];
    offers?: Offer[];
    categories?: CategoryInfo[];
    settings?: Partial<SiteSettings>;
  }) => {
    if (Array.isArray(payload.products)) {
      setAllProducts(payload.products);
      try {
        localStorage.setItem(STORAGE_KEYS.ALL_PRODUCTS, JSON.stringify(payload.products));
      } catch {}
      for (const prod of payload.products) {
        saveProductToFirestore(prod).catch(() => {});
      }
    }
    if (Array.isArray(payload.orders)) {
      setOrders(payload.orders);
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(payload.orders));
      } catch {}
      for (const ord of payload.orders) {
        saveOrderToFirestore(ord).catch(() => {});
      }
    }
    if (Array.isArray(payload.offers)) {
      setOffers(payload.offers);
      try {
        localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(payload.offers));
      } catch {}
      for (const off of payload.offers) {
        saveOfferToFirestore(off).catch(() => {});
      }
    }
    if (Array.isArray(payload.categories)) {
      setCategories(payload.categories);
      try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(payload.categories));
      } catch {}
      for (const cat of payload.categories) {
        saveCategoryToFirestore(cat).catch(() => {});
      }
    }
    if (payload.settings) {
      const merged: SiteSettings = { ...siteSettings, ...payload.settings };
      setSiteSettings(merged);
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      } catch {}
      saveSettingsToFirestore(merged).catch(() => {});
    }
    showToast('Database restore complete: All collections synced to local state and Firestore');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        deletedProducts,
        categories,
        offers,
        orders,
        mpesaTransactions,
        settings: siteSettings,
        cart,
        savedForLater,
        wishlist,
        compareIds,
        route,
        isRouteLoading,
        isCartOpen,
        isSearchOpen,
        isCheckoutOpen,
        searchQuery,
        toastMessage,
        clients,
        currentClient,
        isFirebaseConnected,
        loginClient,
        registerClient,
        loginWithGoogle,
        logoutClient,
        updateClientProfile,
        cancelClientOrder,
        resetPassword,
        verifyResetCode,
        confirmNewPassword,
        passwordResetCode,
        clearPasswordResetCode,
        categoryFilters,
        getCategoryFilters,
        setCategoryFilters,
        resetCategoryFilters,
        isAdminAuthenticated,
        authenticateAdmin,
        logoutAdmin,
        navigate,
        setIsCartOpen,
        setIsSearchOpen,
        setIsCheckoutOpen,
        setSearchQuery,
        showToast,
        formatPrice,
        getEffectivePricing,
        isOfferCurrentlyActive,
        activeOffers,
        expiredOrDisabledOffers,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        moveToSavedForLater,
        moveToCartFromSaved,
        removeFromSaved,
        clearCart,
        toggleWishlist,
        toggleCompare,
        clearCompare,
        placeOrder,
        addProductReview,
        addProduct,
        updateProduct,
        deleteProduct,
        restoreProduct,
        permanentlyDeleteProduct,
        duplicateProduct,
        getDaysRemainingInRecycleBin,
        addOffer,
        updateOffer,
        deleteOffer,
        updateOrderStatus,
        submitMpesaConfirmation,
        verifyMpesaPayment,
        recordManualMpesaMessage,
        updateSettings,
        updateCategory,
        resetDemoData,
        restoreDatabase,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextValue => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
};
