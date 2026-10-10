# TECH SOKONI — LAUNCH DAY CONTINGENCY & ROLLBACK PLAN

**Target Production Domain**: `techsokoni.com`  
**Physical Showroom**: Kenyatta Pioneer Building, 5th Floor, Shop 514, Kenyatta Avenue, Nairobi CBD  
**Orders Hotline / WhatsApp**: +254 792 620 789  
**M-Pesa Buy Goods Till**: `9309020`  

---

## 1. Executive Summary & Trigger Criteria

Initiate this rollback procedure immediately if any of the following occur during launch window:
- Critical checkout blocker preventing order submission or M-Pesa receipt verification (>5 minutes duration).
- Unrecoverable database corruption or unintended schema disruption.
- Server-side rate limiter / API threshold blockage preventing catalog load.
- Severe payment reconciliation mismatch between Safaricom SMS and recorded order ledgers.

---

## 2. Emergency Instant Actions (Severity 1)

### Action 1: Switch Storefront to Local Resilient Mode
The Tech Sokoni architecture is built with automatic local resilient storage fallbacks. If Firestore network latency or quota disruption occurs:
1. The app automatically buffers orders, client profiles, and M-Pesa transactions in browser `localStorage` (`tech_sokoni_orders_live_v1`, `tech_sokoni_mpesa_tx_live_v1`).
2. Customers can continue submitting orders without losing cart items.
3. Once connectivity restores, the StoreContext background sync will reconcile records.

### Action 2: 1-Click Database Restore
1. Log in to the Admin Dashboard (`/#admin` or click Admin Passcode `7890` in the footer).
2. Navigate to **Storefront Settings -> Database Backup & Test Restore**.
3. Click **"Verify & Restore From Backup"** and select the most recent valid JSON snapshot (e.g., `tech-sokoni-backup-YYYY-MM-DD.json`).
4. The system validates the schema integrity across all collections (`products`, `orders`, `offers`, `categories`, `settings`) and restores the exact state.
5. Verify success banner: `✓ Backup verified & applied: X products, Y orders restored.`

### Action 3: Payment Reconciliation Fallback (Lipa Na M-Pesa Till 9309020)
If M-Pesa Express automated clearing experiences Safaricom gateway downtime:
1. Direct customer to manual Buy Goods flow:
   - Go to M-Pesa menu -> **Lipa na M-PESA** -> **Buy Goods and Services**.
   - Enter Till Number: **9309020** (TECH SOKONI KENYA).
   - Enter Amount.
   - Enter M-Pesa PIN.
2. In the Admin Dashboard under **M-Pesa & SMS Messages**:
   - Use the **"Log Manual M-Pesa Transaction / Safaricom SMS"** form.
   - Paste the SMS message or enter the M-Pesa reference code (e.g., `TD12AB34CD`).
   - Click **Verify & Mark Order Paid**. The customer's order history and tracking status instantly update to *Processing / Paid*.

---

## 3. Server-Side & Deployment Rollback

### If Cloud Run / Container Deployment Fails:
1. Re-deploy the previous verified stable build artifact using Cloud Run revisions:
   ```bash
   # Identify previous healthy revision
   gcloud run revisions list --service=tech-sokoni
   # Route 100% traffic back to previous stable revision
   gcloud run services update-traffic tech-sokoni --to-revisions=PREVIOUS_REVISION=100
   ```
2. Verify `/api/health` returns HTTP 200:
   ```bash
   curl -I https://techsokoni.com/api/health
   ```

### If Gemini AI Generation Quota is Exhausted:
1. The server automatically activates the **Exact Input Parser** fallback (`/api/ai/generate-product`).
2. Admins can continue adding products manually with zero interruption. Every field (Processor, RAM, Storage, Screen, Warranty) is editable and fully functional.

---

## 4. Launch Day Communication Protocol

1. **Customer Inquiries**: Broadcast WhatsApp notice to hotline `+254 792 620 789`.
2. **Physical Showroom Backup**: All orders can be fulfilled in person at Kenyatta Pioneer Building, Shop 514, Nairobi CBD with Cash or direct Till payment.
3. **Email Deliverability**: Remind customers awaiting password reset or receipts to check Spam/Junk and add `shop@techsokoni.com` to safe senders.

---

## 5. Post-Rollback Verification Checklist

- [ ] Catalog loads with correct KSh prices and zero mock items.
- [ ] Cart allows item addition and calculates total correctly.
- [ ] 3-step mobile checkout accepts Nairobi and nationwide delivery addresses.
- [ ] M-Pesa Till 9309020 instructions display prominently.
- [ ] Real-time order tracking indicator renders correctly in Client Portal.
- [ ] Admin console updates order status and prints valid PDF receipts.
