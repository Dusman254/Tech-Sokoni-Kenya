/**
 * Tech Sokoni Client-Side Error Tracking & Diagnostics
 * Captures uncaught exceptions, unhandled rejections, and runtime warnings
 * Stores an in-memory & localStorage diagnostic ring buffer for admin inspection
 * and optionally dispatches to server telemetry.
 */

export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  url: string;
  userAgent: string;
  handled: boolean;
}

const ERROR_BUFFER_KEY = 'tech_sokoni_error_diagnostics_v1';
const MAX_ERRORS_STORED = 30;

class ErrorTrackerService {
  private errors: ErrorReport[] = [];
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Load existing errors
    try {
      const raw = localStorage.getItem(ERROR_BUFFER_KEY);
      if (raw) {
        this.errors = JSON.parse(raw);
      }
    } catch {}

    // Global uncaught error listener
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message || 'Uncaught script error',
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        handled: false,
      });
    });

    // Unhandled promise rejection listener
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason?.message || 'Unhandled Promise rejection';
      this.recordError({
        message,
        stack: reason?.stack,
        handled: false,
      });
    });
  }

  public captureException(error: unknown, context?: string) {
    const message =
      error instanceof Error
        ? `${context ? `[${context}] ` : ''}${error.message}`
        : `${context ? `[${context}] ` : ''}${String(error)}`;
    const stack = error instanceof Error ? error.stack : undefined;

    this.recordError({
      message,
      stack,
      handled: true,
    });
  }

  public recordError(data: {
    message: string;
    source?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    handled: boolean;
  }) {
    if (typeof window === 'undefined') return;

    // Sanitize message: never store API keys or passwords
    let cleanMessage = data.message.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
    cleanMessage = cleanMessage.replace(/(password|token)=[^&]*/gi, '$1=[REDACTED]');

    const report: ErrorReport = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      message: cleanMessage,
      source: data.source,
      lineno: data.lineno,
      colno: data.colno,
      url: window.location.href,
      userAgent: navigator.userAgent,
      handled: data.handled,
    };

    this.errors = [report, ...this.errors.slice(0, MAX_ERRORS_STORED - 1)];

    try {
      localStorage.setItem(ERROR_BUFFER_KEY, JSON.stringify(this.errors));
    } catch {}

    // Best-effort send to server telemetry without throwing
    try {
      fetch('/api/telemetry/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          message: report.message,
          url: report.url,
          timestamp: report.timestamp,
          handled: report.handled,
        }),
      }).catch(() => {});
    } catch {}
  }

  public getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  public clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem(ERROR_BUFFER_KEY);
    } catch {}
  }
}

export const errorTracker = new ErrorTrackerService();
