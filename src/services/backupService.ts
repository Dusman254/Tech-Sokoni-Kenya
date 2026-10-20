/**
 * Tech Sokoni Database Backup & Restore Utility
 * Allows 1-click snapshot export of Catalog, Orders, Offers, Categories, Settings,
 * and validated restore with structural verification.
 */

import { CategoryInfo, Offer, Order, Product, SiteSettings } from '../types/store';

export interface DatabaseBackupPayload {
  version: '1.0';
  exportedAt: string;
  storeName: string;
  data: {
    products: Product[];
    orders: Order[];
    offers: Offer[];
    categories: CategoryInfo[];
    settings: SiteSettings;
  };
}

export function createDatabaseBackup(data: {
  products: Product[];
  orders: Order[];
  offers: Offer[];
  categories: CategoryInfo[];
  settings: SiteSettings;
}): DatabaseBackupPayload {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    storeName: 'Tech Sokoni Showroom',
    data,
  };
}

export function downloadDatabaseBackupJson(data: {
  products: Product[];
  orders: Order[];
  offers: Offer[];
  categories: CategoryInfo[];
  settings: SiteSettings;
}) {
  const backup = createDatabaseBackup(data);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `techsokoni-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndParseBackup(
  rawJson: string
): { valid: boolean; data?: DatabaseBackupPayload['data']; error?: string } {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'File is not a valid JSON object.' };
    }
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { valid: false, error: 'Backup does not contain a data payload.' };
    }
    const d = parsed.data;
    if (!Array.isArray(d.products)) {
      return { valid: false, error: 'Missing products array in backup.' };
    }
    return {
      valid: true,
      data: {
        products: d.products,
        orders: Array.isArray(d.orders) ? d.orders : [],
        offers: Array.isArray(d.offers) ? d.offers : [],
        categories: Array.isArray(d.categories) ? d.categories : [],
        settings: d.settings || {},
      },
    };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Invalid JSON syntax.' };
  }
}
