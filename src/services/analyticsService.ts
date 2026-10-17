/**
 * Tech Sokoni E-Commerce Funnel Analytics Service
 * Tracks customer journey: showroom visit -> product view -> add to cart -> checkout steps -> purchase / drop-off
 * Stores funnel metrics locally and reports events to server telemetry.
 */

export type FunnelStep =
  | 'page_view'
  | 'product_view'
  | 'filter_applied'
  | 'add_to_cart'
  | 'cart_opened'
  | 'checkout_step_1_delivery'
  | 'checkout_step_2_payment'
  | 'checkout_step_3_review'
  | 'order_completed'
  | 'client_login'
  | 'client_signup'
  | 'book_to_view_clicked'
  | 'booking_form_started'
  | 'booking_completed';

export interface AnalyticsEvent {
  id: string;
  step: FunnelStep;
  timestamp: string;
  meta?: Record<string, any>;
}

const ANALYTICS_STORAGE_KEY = 'tech_sokoni_analytics_funnel_v1';
const MAX_EVENTS = 100;

class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
        if (raw) {
          this.events = JSON.parse(raw);
        }
      } catch {}
    }
  }

  public track(step: FunnelStep, meta?: Record<string, any>) {
    if (typeof window === 'undefined') return;

    const event: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      step,
      timestamp: new Date().toISOString(),
      meta,
    };

    this.events = [event, ...this.events.slice(0, MAX_EVENTS - 1)];

    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.events));
    } catch {}

    // Dispatch to server telemetry
    try {
      fetch('/api/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: event.step,
          timestamp: event.timestamp,
          meta: event.meta,
        }),
      }).catch(() => {});
    } catch {}
  }

  public getFunnelSummary() {
    const counts: Record<FunnelStep, number> = {
      page_view: 0,
      product_view: 0,
      filter_applied: 0,
      add_to_cart: 0,
      cart_opened: 0,
      checkout_step_1_delivery: 0,
      checkout_step_2_payment: 0,
      checkout_step_3_review: 0,
      order_completed: 0,
      client_login: 0,
      client_signup: 0,
    };

    this.events.forEach((e) => {
      if (counts[e.step] !== undefined) {
        counts[e.step]++;
      }
    });

    const views = counts.page_view + counts.product_view || 1;
    const carts = counts.add_to_cart;
    const checkoutStarts = counts.checkout_step_1_delivery;
    const orders = counts.order_completed;

    const cartConversionRate = ((carts / views) * 100).toFixed(1);
    const checkoutDropOffRate = checkoutStarts > 0 ? (((checkoutStarts - orders) / checkoutStarts) * 100).toFixed(1) : '0';

    return {
      counts,
      recentEvents: this.events.slice(0, 20),
      cartConversionRate: `${cartConversionRate}%`,
      checkoutDropOffRate: `${checkoutDropOffRate}%`,
      totalOrdersRecorded: orders,
    };
  }

  public clear() {
    this.events = [];
    try {
      localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    } catch {}
  }
}

export const analyticsService = new AnalyticsService();
