import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
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
} from '../types/store';

// User's Tech Sokoni Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBMyReihYiYY1JDiWyH1LEgOYtQbmeuAGs",
  authDomain: "techsokonikenya.firebaseapp.com",
  projectId: "techsokonikenya",
  storageBucket: "techsokonikenya.firebasestorage.app",
  messagingSenderId: "720907830049",
  appId: "1:720907830049:web:e18eb6a1e861c64753b460",
  measurementId: "G-2PC5T8BSCP"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Safely initialize Firebase Analytics in browser environments
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics blocked or unsupported in environment
    });
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Uploads a product image directly to Firebase Storage bucket (techsokonikenya.firebasestorage.app)
 * and returns the public, CDN-cached download URL.
 */
export async function uploadProductImage(
  file: File | Blob,
  customFileName?: string
): Promise<string> {
  const ext = (file as File).name?.split('.').pop() || 'jpg';
  const filename =
    customFileName ||
    `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const sRef = storageRef(storage, `products/${filename}`);
  const result = await uploadBytes(sRef, file, {
    contentType: (file as File).type || 'image/jpeg',
  });
  return await getDownloadURL(result.ref);
}

// Tracks whether the external `techsokonikenya` Firestore rules currently allow read/write for the current auth session
let firestoreReadAllowed = true;
let firestoreWriteAllowed = true;

export function isFirestoreSyncAvailable(): boolean {
  return firestoreReadAllowed;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export let lastFirestoreErrorInfo: FirestoreErrorInfo | null = null;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  rethrow = false
): FirestoreErrorInfo {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  lastFirestoreErrorInfo = errInfo;

  // If external Firebase Console security rules reject access for the current auth state,
  // disable further background writes/listeners until auth state changes so the app remains error-free.
  if (
    message.includes('Missing or insufficient permissions') ||
    message.includes('permission-denied')
  ) {
    if (
      operationType === OperationType.WRITE ||
      operationType === OperationType.CREATE ||
      operationType === OperationType.UPDATE ||
      operationType === OperationType.DELETE
    ) {
      firestoreWriteAllowed = false;
    } else {
      firestoreReadAllowed = false;
      firestoreWriteAllowed = false;
    }
  }

  if (rethrow) {
    throw new Error(JSON.stringify(errInfo));
  }
  return errInfo;
}

/**
 * Recursively strips `undefined` fields so Firestore setDoc/updateDoc never fails on optional properties.
 */
export function sanitizeForFirestore<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }
  return input;
}

/**
 * Validate Firestore connectivity and check whether current security rules allow reading.
 */
export async function probeFirestoreAccess(): Promise<{
  connected: boolean;
  canRead: boolean;
  errorMessage?: string;
}> {
  try {
    await getDocs(collection(db, 'products'));
    firestoreReadAllowed = true;
    firestoreWriteAllowed = true;
    return { connected: true, canRead: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline') || msg.includes('offline')) {
      return { connected: false, canRead: false, errorMessage: 'Offline mode active.' };
    }
    if (msg.includes('permissions') || msg.includes('permission-denied')) {
      firestoreReadAllowed = false;
      firestoreWriteAllowed = false;
      return {
        connected: true,
        canRead: false,
        errorMessage: 'Firestore security rules reject read access. Publish firestore.rules in Firebase Console (techsokonikenya).',
      };
    }
    return { connected: true, canRead: false, errorMessage: msg };
  }
}

/**
 * Seeds initial catalog, orders, offers, categories, settings, and demo clients to Firestore
 * if remote collections are empty and writable.
 */
export async function seedFirestoreIfEmpty(seedData: {
  products: Product[];
  orders: Order[];
  offers: Offer[];
  categories: CategoryInfo[];
  settings: SiteSettings;
  clients: ClientAccount[];
}): Promise<void> {
  if (!firestoreReadAllowed || !firestoreWriteAllowed) return;

  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      const batch = writeBatch(db);
      seedData.products.forEach((product) => {
        batch.set(doc(db, 'products', product.id), sanitizeForFirestore(product));
      });
      seedData.offers.forEach((offer) => {
        batch.set(doc(db, 'offers', offer.id), sanitizeForFirestore(offer));
      });
      seedData.categories.forEach((cat) => {
        batch.set(doc(db, 'categories', cat.id), sanitizeForFirestore(cat));
      });
      batch.set(
        doc(db, 'settings', 'storefront'),
        sanitizeForFirestore(seedData.settings)
      );
      await batch.commit();
    }

    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty && firestoreWriteAllowed) {
      const orderBatch = writeBatch(db);
      seedData.orders.forEach((order) => {
        orderBatch.set(doc(db, 'orders', order.id), sanitizeForFirestore(order));
      });
      await orderBatch.commit();
    }

    if (auth.currentUser && firestoreWriteAllowed) {
      const clientsSnap = await getDocs(collection(db, 'clients'));
      if (clientsSnap.empty) {
        const clientBatch = writeBatch(db);
        seedData.clients.forEach((client) => {
          clientBatch.set(
            doc(db, 'clients', client.id),
            sanitizeForFirestore(client)
          );
        });
        await clientBatch.commit();
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedFirestoreIfEmpty', false);
  }
}

// ============================================================================
// Firestore Persistence Helpers (Guarded by permission probe)
// ============================================================================

export async function saveProductToFirestore(product: Product): Promise<{ ok: boolean; error?: string }> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), sanitizeForFirestore(product), {
      merge: true,
    });
    return { ok: true };
  } catch (error: any) {
    const errInfo = handleFirestoreError(error, OperationType.WRITE, path, false);
    return { ok: false, error: errInfo.error };
  }
}

export async function removeProductFromFirestore(productId: string): Promise<{ ok: boolean; error?: string }> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
    return { ok: true };
  } catch (error: any) {
    const errInfo = handleFirestoreError(error, OperationType.DELETE, path, false);
    return { ok: false, error: errInfo.error };
  }
}

export async function saveOrderToFirestore(order: Order): Promise<{ ok: boolean; error?: string }> {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), sanitizeForFirestore(order), {
      merge: true,
    });
    return { ok: true };
  } catch (error: any) {
    const errInfo = handleFirestoreError(error, OperationType.WRITE, path, false);
    return { ok: false, error: errInfo.error };
  }
}

export async function saveMpesaTransactionToFirestore(
  tx: MpesaTransaction
): Promise<void> {
  const path = `mpesa_transactions/${tx.id}`;
  try {
    await setDoc(
      doc(db, 'mpesa_transactions', tx.id),
      sanitizeForFirestore(tx),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
  }
}

export async function saveOfferToFirestore(offer: Offer): Promise<void> {
  const path = `offers/${offer.id}`;
  try {
    await setDoc(doc(db, 'offers', offer.id), sanitizeForFirestore(offer), {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
  }
}

export async function removeOfferFromFirestore(offerId: string): Promise<void> {
  const path = `offers/${offerId}`;
  try {
    await deleteDoc(doc(db, 'offers', offerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path, false);
  }
}

export async function saveCategoryToFirestore(category: CategoryInfo): Promise<void> {
  const path = `categories/${category.id}`;
  try {
    await setDoc(doc(db, 'categories', category.id), sanitizeForFirestore(category), {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
  }
}

export async function saveSettingsToFirestore(settings: SiteSettings): Promise<void> {
  const path = 'settings/storefront';
  try {
    await setDoc(doc(db, 'settings', 'storefront'), sanitizeForFirestore(settings), {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
  }
}

export async function saveClientToFirestore(client: ClientAccount): Promise<void> {
  const path = `clients/${client.id}`;
  try {
    await setDoc(doc(db, 'clients', client.id), sanitizeForFirestore(client), {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
  }
}

export async function saveViewingAppointmentToFirestore(
  appointment: ViewingAppointment
): Promise<void> {
  const path = `viewing_appointments/${appointment.id}`;
  try {
    await setDoc(
      doc(db, 'viewing_appointments', appointment.id),
      sanitizeForFirestore(appointment),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
  }
}

export async function deleteViewingAppointmentFromFirestore(
  appointmentId: string
): Promise<void> {
  const path = `viewing_appointments/${appointmentId}`;
  try {
    await deleteDoc(doc(db, 'viewing_appointments', appointmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path, false);
  }
}

export async function saveViewingLocationToFirestore(
  location: ViewingLocation
): Promise<void> {
  const path = `viewing_locations/${location.id}`;
  try {
    await setDoc(
      doc(db, 'viewing_locations', location.id),
      sanitizeForFirestore(location),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
  }
}

export async function deleteViewingLocationFromFirestore(
  locationId: string
): Promise<void> {
  const path = `viewing_locations/${locationId}`;
  try {
    await deleteDoc(doc(db, 'viewing_locations', locationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path, false);
  }
}

export async function saveBookingConfigToFirestore(
  config: BookingConfig
): Promise<void> {
  const path = 'settings/booking_config';
  try {
    await setDoc(
      doc(db, 'settings', 'booking_config'),
      sanitizeForFirestore(config),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, false);
  }
}

// ============================================================================
// Firebase Authentication + Client Profile Sync
// ============================================================================

export async function fetchOrCreateClientForFirebaseUser(
  fbUser: FirebaseUser,
  existingClients: ClientAccount[],
  extraProfile?: {
    name?: string;
    phone?: string;
    defaultAddress?: string;
    city?: string;
    password?: string;
  }
): Promise<ClientAccount> {
  const docId = `client-${fbUser.uid}`;
  const emailLower = (fbUser.email || '').toLowerCase();

  // Re-probe Firestore now that a Firebase user is authenticated
  const probe = await probeFirestoreAccess();

  if (probe.canRead) {
    try {
      const snap = await getDoc(doc(db, 'clients', docId));
      if (snap.exists()) {
        const remoteData = snap.data() as ClientAccount;
        const merged: ClientAccount = {
          ...remoteData,
          id: remoteData.id || docId,
          uid: fbUser.uid,
          name:
            extraProfile?.name ||
            remoteData.name ||
            fbUser.displayName ||
            'Tech Sokoni Client',
          email: fbUser.email || remoteData.email,
          photoURL: fbUser.photoURL || remoteData.photoURL,
        };
        await saveClientToFirestore(merged);
        return merged;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `clients/${docId}`, false);
    }
  }

  // Check if there is an existing client by email
  const matchByEmail = existingClients.find(
    (c) => c.email.toLowerCase() === emailLower
  );

  const clientProfile: ClientAccount = {
    id: matchByEmail?.id || docId,
    uid: fbUser.uid,
    name:
      extraProfile?.name ||
      fbUser.displayName ||
      matchByEmail?.name ||
      (fbUser.email ? fbUser.email.split('@')[0] : 'Tech Sokoni Client'),
    email: fbUser.email || matchByEmail?.email || '',
    phone:
      extraProfile?.phone ||
      fbUser.phoneNumber ||
      matchByEmail?.phone ||
      '+254 700 000 000',
    password: extraProfile?.password || matchByEmail?.password,
    defaultAddress:
      extraProfile?.defaultAddress ||
      matchByEmail?.defaultAddress ||
      'Nairobi CBD / Express Delivery',
    city: extraProfile?.city || matchByEmail?.city || 'Nairobi',
    authProvider: fbUser.providerData.some((p) => p.providerId === 'google.com')
      ? 'google'
      : 'password',
    photoURL: fbUser.photoURL || matchByEmail?.photoURL || undefined,
    createdAt: matchByEmail?.createdAt || new Date().toISOString(),
  };

  if (probe.canRead) {
    await saveClientToFirestore(clientProfile);
  }
  return clientProfile;
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  onSnapshot,
};
