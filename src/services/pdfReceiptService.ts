import { jsPDF } from 'jspdf';
import { Order, SiteSettings } from '../types/store';

/**
 * Tech Sokoni Branded PDF Receipt & Serial Warranty Service
 * Renders a high-contrast architectural receipt using jsPDF.
 */
export class PdfReceiptService {
  static generateAndDownloadReceipt(order: Order, settings: SiteSettings): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    const currency = settings.currencySymbol || 'KSh ';

    // 1. Warm Off-White Showroom Paper Background (#F4F3EF)
    doc.setFillColor(244, 243, 239);
    doc.rect(0, 0, pageWidth, 297, 'F');

    // 2. Top Architectural Header Band (#141413)
    doc.setFillColor(20, 20, 19);
    doc.rect(0, 0, pageWidth, 44, 'F');

    // Brand Mark & Wordmark
    doc.setFillColor(217, 78, 52); // Accent dot #D94E34
    doc.circle(margin + 2, 15.5, 1.8, 'F');

    doc.setTextColor(244, 243, 239);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('TECH SOKONI', margin + 7, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(185, 184, 178);
    doc.text(
      'TECHNOLOGY THAT MOVES YOU  ·  OFFICIAL HARDWARE RECEIPT & WARRANTY',
      margin,
      25
    );
    doc.text(
      settings.showroomAddress ||
        'Kenyatta Pioneer Building, 5th Floor, Shop 514, Kenyatta Ave (Next to I&M Building), Nairobi CBD',
      margin,
      31
    );
    doc.text(
      `Tel / WhatsApp: ${settings.supportPhone || '+254 792 620 789'}   |   ${
        settings.supportEmail || 'shop@techsokoni.com'
      }   |   M-Pesa Buy Goods Till: 9309020`,
      margin,
      37
    );

    // Right side of Header: Receipt Label, Serial & Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(244, 243, 239);
    doc.text('OFFICIAL CLIENT RECEIPT', pageWidth - margin, 18, {
      align: 'right',
    });

    doc.setFont('courier', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(217, 78, 52);
    doc.text(order.orderNumber, pageWidth - margin, 25.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(205, 204, 198);
    const formattedDate = new Date(order.createdAt).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }
    );
    doc.text(`Issue Date: ${formattedDate}`, pageWidth - margin, 31.5, {
      align: 'right',
    });
    doc.text(
      `Fulfillment Status: ${order.status.toUpperCase()}`,
      pageWidth - margin,
      37,
      { align: 'right' }
    );

    // 3. Client & Order Verification Grid
    let y = 54;
    doc.setFillColor(234, 233, 228); // #EAE9E4
    doc.rect(margin, y, contentWidth, 35, 'F');
    doc.setDrawColor(20, 20, 19);
    doc.setLineWidth(0.25);
    doc.rect(margin, y, contentWidth, 35, 'S');

    // Left Column: Client & Delivery Destination
    doc.setTextColor(110, 109, 104);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('BILLED & DELIVERED TO CLIENT', margin + 5, y + 7.5);

    doc.setTextColor(20, 20, 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(order.customerName, margin + 5, y + 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `${order.customerEmail}  ·  ${order.customerPhone}`,
      margin + 5,
      y + 21
    );
    doc.text(`${order.shippingAddress}, ${order.city}`, margin + 5, y + 27.5);

    // Right Column: Payment & Authenticity Details
    const rightColX = pageWidth / 2 + 8;
    doc.setTextColor(110, 109, 104);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('SETTLEMENT & SERIAL VERIFICATION', rightColX, y + 7.5);

    doc.setTextColor(20, 20, 19);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Payment Method: ${order.paymentMethod}${
        order.mpesaCode ? ` (${order.mpesaCode})` : ''
      }`,
      rightColX,
      y + 14.5
    );
    doc.text(
      `Receipt Reference: ${order.orderNumber} · ${
        order.mpesaStatus || 'Confirmed'
      }`,
      rightColX,
      y + 21
    );
    doc.text(
      `Warranty Coverage: Official Manufacturer + Tech Sokoni Direct`,
      rightColX,
      y + 27.5
    );

    // 4. Itemized Hardware & Selected Variations Table
    y = 98;
    doc.setFillColor(20, 20, 19);
    doc.rect(margin, y, contentWidth, 9.5, 'F');

    doc.setTextColor(244, 243, 239);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('#', margin + 4, y + 6.2);
    doc.text('SKU', margin + 13, y + 6.2);
    doc.text('HARDWARE SYSTEM & SELECTED VARIATIONS', margin + 40, y + 6.2);
    doc.text('QTY', pageWidth - margin - 46, y + 6.2, { align: 'right' });
    doc.text('UNIT PRICE', pageWidth - margin - 24, y + 6.2, {
      align: 'right',
    });
    doc.text('LINE TOTAL', pageWidth - margin - 4, y + 6.2, { align: 'right' });

    y += 9.5;

    doc.setTextColor(20, 20, 19);
    order.items.forEach((item, index) => {
      const variationEntries = item.selectedVariations
        ? Object.entries(item.selectedVariations)
        : [];
      const hasVariations = variationEntries.length > 0;
      const rowHeight = hasVariations ? 16 : 12;

      if (index % 2 === 1) {
        doc.setFillColor(234, 233, 228);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }

      doc.setTextColor(20, 20, 19);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.text(String(index + 1).padStart(2, '0'), margin + 4, y + 7);
      doc.text((item.sku || 'TS-SYS').slice(0, 14), margin + 13, y + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const title = `${item.brand} ${item.productName}`.slice(0, 48);
      doc.text(title, margin + 40, y + 7);

      if (hasVariations) {
        const varSummary = variationEntries
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ')
          .slice(0, 68);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(95, 94, 89);
        doc.text(varSummary, margin + 40, y + 12.2);
        doc.setTextColor(20, 20, 19);
      }

      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.text(String(item.quantity), pageWidth - margin - 46, y + 7, {
        align: 'right',
      });
      doc.text(
        `${currency}${item.unitPrice.toLocaleString()}`,
        pageWidth - margin - 24,
        y + 7,
        { align: 'right' }
      );

      doc.setFont('courier', 'bold');
      const lineTotal = item.unitPrice * item.quantity;
      doc.text(
        `${currency}${lineTotal.toLocaleString()}`,
        pageWidth - margin - 4,
        y + 7,
        { align: 'right' }
      );

      doc.setDrawColor(210, 209, 202);
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
      y += rowHeight;
    });

    // 5. Financial Totals & Official Verification Stamp
    y += 9;
    const summaryX = pageWidth - margin - 84;
    doc.setFillColor(234, 233, 228);
    doc.rect(summaryX, y, 84, 39, 'F');
    doc.setDrawColor(20, 20, 19);
    doc.rect(summaryX, y, 84, 39, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 89, 85);
    doc.text('Hardware Subtotal:', summaryX + 5, y + 8);
    doc.setFont('courier', 'normal');
    doc.text(
      `${currency}${order.subtotal.toLocaleString()}`,
      pageWidth - margin - 5,
      y + 8,
      { align: 'right' }
    );

    doc.setFont('helvetica', 'normal');
    doc.text('Active Offer Privilege:', summaryX + 5, y + 15);
    doc.setFont('courier', 'normal');
    doc.setTextColor(31, 111, 67);
    doc.text(
      order.discountTotal > 0
        ? `-${currency}${order.discountTotal.toLocaleString()}`
        : `${currency}0`,
      pageWidth - margin - 5,
      y + 15,
      { align: 'right' }
    );

    doc.setTextColor(90, 89, 85);
    doc.setFont('helvetica', 'normal');
    doc.text('Insured Courier Delivery:', summaryX + 5, y + 22);
    doc.setFont('courier', 'normal');
    doc.text('INCLUDED', pageWidth - margin - 5, y + 22, { align: 'right' });

    doc.setDrawColor(20, 20, 19);
    doc.line(summaryX + 4, y + 26.5, pageWidth - margin - 4, y + 26.5);

    doc.setTextColor(20, 20, 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('TOTAL PAID:', summaryX + 5, y + 34);
    doc.setFont('courier', 'bold');
    doc.text(
      `${currency}${order.total.toLocaleString()}`,
      pageWidth - margin - 5,
      y + 34,
      { align: 'right' }
    );

    // Official Stamp Box on the Left
    doc.setDrawColor(31, 111, 67);
    doc.setLineWidth(0.5);
    doc.rect(margin, y + 3, 76, 30, 'S');
    doc.setTextColor(31, 111, 67);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TECH SOKONI VERIFIED RECEIPT', margin + 5, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 76);
    doc.text('Authentic Serial & Warranty Registered', margin + 5, y + 17.5);
    doc.text(`Order Ref: ${order.orderNumber}`, margin + 5, y + 23.5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(
      `AUTH-HASH: TS-${order.id.slice(-6).toUpperCase()}-2026`,
      margin + 5,
      y + 29
    );

    // 6. Footer Terms & Showroom Guarantee
    const footerY = 262;
    doc.setDrawColor(180, 179, 173);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setTextColor(95, 94, 89);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(
      'TECH SOKONI HARDWARE GUARANTEE & WARRANTY CERTIFICATE',
      margin,
      footerY + 7
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      '1. Retain this official PDF receipt for priority warranty service at Kenyatta Pioneer Building, 5th Floor, Shop 514, Nairobi CBD.',
      margin,
      footerY + 13
    );
    doc.text(
      '2. All systems are backed by our 1-Year Local & Manufacturer Warranty. Lipa Na M-Pesa Buy Goods Till: 9309020.',
      margin,
      footerY + 18
    );
    doc.text(
      `TECH SOKONI KENYA — www.techsokoni.com   |   ${
        settings.supportEmail || 'shop@techsokoni.com'
      }   |   ${settings.supportPhone || '+254 792 620 789'}`,
      margin,
      footerY + 24
    );

    doc.save(`Tech-Sokoni-Receipt-${order.orderNumber}.pdf`);
  }
}

export function downloadOrderReceiptPdf(order: Order, settings: SiteSettings) {
  PdfReceiptService.generateAndDownloadReceipt(order, settings);
}
