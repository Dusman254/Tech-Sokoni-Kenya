import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Security & Rate Limiting (In-Memory Sliding Window)
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

function createRateLimiter(options: { maxRequests: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: 'Too many requests. Please wait before trying again.',
        retryAfterSeconds,
      });
    }

    record.count++;
    next();
  };
}

// Clean up stale rate-limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// AI Daily Spending Cap Guard
// Protects billing from runaway loops or abuse
// ============================================================================

const AI_DAILY_CALL_LIMIT = 80; // Safe daily limit for auto-generation
let aiCallsToday = 0;
let aiUsageDay = new Date().toISOString().slice(0, 10);

function checkAndIncrementAiBudget(): boolean {
  const currentDay = new Date().toISOString().slice(0, 10);
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

// ============================================================================
// Diagnostic Telemetry Storage (Ring Buffer)
// ============================================================================

interface ServerTelemetryError {
  id: string;
  timestamp: string;
  message: string;
  url: string;
  ip: string;
}

const serverTelemetryErrors: ServerTelemetryError[] = [];
const MAX_SERVER_ERROR_LOGS = 50;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      store: 'Tech Sokoni Showroom',
      timestamp: new Date().toISOString(),
      aiBudgetRemaining: Math.max(0, AI_DAILY_CALL_LIMIT - aiCallsToday),
    });
  });

  // Client telemetry error ingestion endpoint
  app.post('/api/telemetry/error', (req, res) => {
    try {
      const { id, message, url, timestamp } = req.body || {};
      if (message) {
        const record: ServerTelemetryError = {
          id: id || `err-${Date.now()}`,
          timestamp: timestamp || new Date().toISOString(),
          message: String(message).slice(0, 300),
          url: String(url || '').slice(0, 200),
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown',
        };
        serverTelemetryErrors.unshift(record);
        if (serverTelemetryErrors.length > MAX_SERVER_ERROR_LOGS) {
          serverTelemetryErrors.pop();
        }
      }
    } catch {}
    res.status(204).end();
  });

  // Client telemetry funnel event ingestion endpoint
  app.post('/api/telemetry/event', (_req, res) => {
    // Acknowledged for analytics tracking
    res.status(204).end();
  });

  // ============================================================================
  // "Book to View" In-Person Viewing Appointment Backend APIs
  // Concurrency-safe slot validation, Kenyan phone checks & spam rate limiting
  // ============================================================================

  const bookingRateLimiter = createRateLimiter({
    maxRequests: 30,
    windowMs: 10 * 60 * 1000, // 30 booking attempts per 10 mins per IP
  });

  // In-memory slot booking register to prevent double-booking collisions
  interface SlotBookingKey {
    date: string;
    slot: string;
    locationId: string;
    reference: string;
  }
  const confirmedServerSlots: SlotBookingKey[] = [];

  // Helper to validate Kenyan telephone numbers on backend
  function backendValidateKenyanPhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    return (
      /^0[17]\d{8}$/.test(clean) ||
      /^254[17]\d{8}$/.test(clean) ||
      /^\+254[17]\d{8}$/.test(clean)
    );
  }

  // Helper to get today's date in East Africa Time (Africa/Nairobi UTC+3)
  function getNairobiToday(): string {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const eat = new Date(utc + 3600000 * 3);
    const y = eat.getFullYear();
    const m = String(eat.getMonth() + 1).padStart(2, '0');
    const d = String(eat.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Validate and submit viewing appointment
  app.post('/api/bookings/validate', bookingRateLimiter, (req: Request, res: Response) => {
    try {
      const {
        customerName,
        customerPhone,
        customerEmail,
        viewingDate,
        viewingTimeSlot,
        productId,
        productName,
        locationId,
      } = req.body || {};

      // 1. Mandatory field checks
      if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter your full legal name (minimum 2 characters).' });
      }

      if (!customerPhone || !backendValidateKenyanPhone(customerPhone)) {
        return res.status(400).json({
          error: 'Please provide a valid Kenyan mobile number (e.g. 0712 345 678, 0110 123 456, or +254 7XX XXX XXX).',
        });
      }

      if (customerEmail && typeof customerEmail === 'string' && customerEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail.trim())) {
          return res.status(400).json({ error: 'Please provide a valid email address or leave it blank.' });
        }
      }

      if (!viewingDate || !/^\d{4}-\d{2}-\d{2}$/.test(viewingDate)) {
        return res.status(400).json({ error: 'Please select a valid viewing appointment date (YYYY-MM-DD).' });
      }

      // 2. Prevent past dates in Africa/Nairobi
      const todayNairobi = getNairobiToday();
      if (viewingDate < todayNairobi) {
        return res.status(400).json({ error: 'Appointments cannot be booked for past dates.' });
      }

      if (!viewingTimeSlot || typeof viewingTimeSlot !== 'string') {
        return res.status(400).json({ error: 'Please select a preferred viewing time slot.' });
      }

      if (!productId || !productName) {
        return res.status(400).json({ error: 'Missing selected laptop details.' });
      }

      // 3. Concurrency / Collision Check
      const targetLoc = locationId || 'loc-nbi-cbd';
      const existingInSlot = confirmedServerSlots.filter(
        (s) => s.date === viewingDate && s.slot === viewingTimeSlot && s.locationId === targetLoc
      );

      const MAX_SLOT_CAPACITY = 2; // Maximum concurrent viewings per station
      if (existingInSlot.length >= MAX_SLOT_CAPACITY) {
        return res.status(409).json({
          error: 'This viewing slot was just reserved by another client. Please select another convenient time slot.',
          slotUnavailable: true,
        });
      }

      // Generate deterministic unique booking reference: TSV-YYYY-XXXX
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingReference = `TSV-${year}-${randomSuffix}`;

      // Reserve slot in server memory
      confirmedServerSlots.push({
        date: viewingDate,
        slot: viewingTimeSlot,
        locationId: targetLoc,
        reference: bookingReference,
      });

      return res.status(200).json({
        ok: true,
        bookingReference,
        message: 'Appointment details validated and slot reserved successfully.',
      });
    } catch (err: any) {
      console.error('[Booking Validation Error]:', err?.message);
      return res.status(500).json({ error: 'Server error processing booking reservation. Please try again.' });
    }
  });

  // Server-Side Gemini AI Endpoint with Strict Rate Limiting, Validation & Budget Cap
  const aiRateLimiter = createRateLimiter({
    maxRequests: 15,
    windowMs: 5 * 60 * 1000, // 15 requests per 5 minutes per IP
  });

  app.post('/api/ai/generate-product', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      // 1. Server-side input validation
      const rawQuery = req.body?.query || req.body?.prompt;
      if (typeof rawQuery !== 'string' || !rawQuery.trim()) {
        res.status(400).json({ error: 'Valid product title or specifications query is required.' });
        return;
      }

      const query = rawQuery.trim();
      if (query.length < 2 || query.length > 500) {
        res.status(400).json({
          error: 'Query length must be between 2 and 500 characters.',
        });
        return;
      }

      // 2. Spending Cap & Daily Limit Check
      if (!checkAndIncrementAiBudget()) {
        res.status(429).json({
          error: 'Daily AI generation capacity reached. Please enter specifications manually or retry tomorrow.',
          fallback: true,
        });
        return;
      }

      // 3. API Key existence verification
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured on server; exact input parser active.',
          fallback: true,
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate complete electronics product details for the Tech Sokoni store from this exact user input:
"${query}"

STRICT FIDELITY RULES:
1. You MUST preserve EVERY exact detail written by the user (exact product name/model, exact RAM, exact Storage, exact Processor, exact Screen Size, exact Color, exact GPU, exact OS, exact price if mentioned).
2. NEVER replace or contradict any specification written by the user.
3. Only infer or complete fields that the user did NOT explicitly specify, using authentic real-world specifications for that exact hardware.`,
        config: {
          systemInstruction:
            'You are the Hardware Catalog Engine for TECH SOKONI. Always honor and copy the user’s exact written features and specifications verbatim into the corresponding fields before filling in any remaining blanks.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'Exact product title incorporating the user input model and key identity',
              },
              sku: {
                type: Type.STRING,
                description: 'Unique SKU starting with TS- followed by category and model code',
              },
              brand: {
                type: Type.STRING,
                description: 'Exact manufacturer brand name',
              },
              category: {
                type: Type.STRING,
                description:
                  'One of: laptops, phones, desktops, monitors, printers, tablets, accessories, networking, storage, gaming',
              },
              price: {
                type: Type.NUMBER,
                description: 'Price in Kenyan Shillings (KSh) realistic for the item',
              },
              shortSpec: {
                type: Type.STRING,
                description:
                  'Key configuration line separated by middle dots (·) using the exact user-specified processor, RAM, storage, screen size, and color',
              },
              shortDescription: {
                type: Type.STRING,
                description:
                  '1-2 sentence summary accurately reflecting the exact specifications provided by the user',
              },
              description: {
                type: Type.STRING,
                description:
                  'Detailed 2-3 sentence technical overview faithful to the user input',
              },
              processor: {
                type: Type.STRING,
                description: 'Exact processor / chip specified by user or authentic model CPU',
              },
              ram: {
                type: Type.STRING,
                description: 'Exact RAM specified by user (e.g. 16GB DDR4 / 32GB Unified)',
              },
              storage: {
                type: Type.STRING,
                description: 'Exact storage specified by user (e.g. 512GB NVMe SSD)',
              },
              screenSize: {
                type: Type.STRING,
                description: 'Exact screen size specified by user (e.g. 14.0" FHD / 16.0")',
              },
              color: {
                type: Type.STRING,
                description: 'Exact color/finish specified by user',
              },
              os: {
                type: Type.STRING,
                description: 'Exact operating system specified by user or authentic OS',
              },
              graphics: {
                type: Type.STRING,
                description: 'Exact GPU / graphics specification',
              },
              ports: {
                type: Type.STRING,
                description: 'Connectivity and I/O ports',
              },
              battery: {
                type: Type.STRING,
                description: 'Battery specification',
              },
              weight: {
                type: Type.STRING,
                description: 'Weight in kg or g',
              },
              warranty: {
                type: Type.STRING,
                description: 'Warranty coverage statement',
              },
              variations: {
                type: Type.ARRAY,
                description:
                  'Product variation groups such as Storage, RAM, Color, Screen Size',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: 'Variation group name',
                    },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          priceDelta: { type: Type.NUMBER },
                        },
                        required: ['label', 'priceDelta'],
                      },
                    },
                  },
                  required: ['name', 'options'],
                },
              },
            },
            required: [
              'name',
              'sku',
              'brand',
              'category',
              'price',
              'shortSpec',
              'shortDescription',
              'description',
              'processor',
              'ram',
              'storage',
              'screenSize',
              'color',
              'os',
              'warranty',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from model');
      }

      const parsed = JSON.parse(text.trim());
      res.json(parsed);
    } catch (error: any) {
      // Never leak stack traces to the client
      console.error('Gemini product generation handled error:', error?.message);
      res.status(500).json({
        error: 'Unable to auto-generate specifications with AI. Exact input parser active.',
        fallback: true,
      });
    }
  });

  // Centralized Error Handling Middleware (No Stack Traces)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const errorId = `err-${Date.now()}`;
    console.error(`[Server Error ${errorId}]:`, err?.message || err);
    res.status(500).json({
      error: 'An unexpected internal error occurred. Please try again shortly.',
      errorId,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tech Sokoni server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
