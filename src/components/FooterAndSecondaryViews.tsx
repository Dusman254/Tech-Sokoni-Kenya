import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

export const WishlistView: React.FC = () => {
  const { products, wishlist, navigate } = useStore();
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-[75vh] max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      <div className="pb-8 border-b border-[#141413]/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68] mb-2">
            TECH SOKONI · PERSONAL ARCHIVE
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Saved Wishlist ({wishlistedProducts.length})
          </h1>
        </div>
        <button
          onClick={() => navigate({ page: 'category', categoryId: 'all' })}
          className="text-xs font-mono-num uppercase tracking-widest text-[#141413] hover:opacity-70 flex items-center gap-1.5 cursor-pointer self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Browsing</span>
        </button>
      </div>

      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <h2 className="font-editorial text-3xl text-[#141413]">
            Your wishlist is currently empty.
          </h2>
          <p className="text-xs text-[#6E6D68] max-w-md mx-auto">
            Save configurations while browsing our showroom to compare
            specifications and track active privileges.
          </p>
          <button
            onClick={() => navigate({ page: 'home' })}
            className="px-6 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest cursor-pointer"
          >
            Return to Showroom
          </button>
        </div>
      )}
    </div>
  );
};

export const InfoSectionView: React.FC<{
  section:
    | 'about'
    | 'delivery'
    | 'returns'
    | 'warranty'
    | 'faq'
    | 'contact'
    | 'privacy'
    | 'terms';
}> = ({ section }) => {
  const { settings, navigate } = useStore();

  const contentMap = {
    about: {
      kicker: 'COMPANY · ABOUT TECH SOKONI KENYA',
      title: 'Premium Imports, Enterprise Computers & Curated Hardware.',
      body: [
        'Tech Sokoni Kenya (techsokoni.com) is a premier electronics showroom and enterprise hardware supplier located in Nairobi CBD at Kenyatta Pioneer Building, along Kenyatta Avenue, 5th Floor, Shop Number 514 (Next to I&M Building).',
        'We specialize in 100% genuine brand imports and enterprise computers — including Apple MacBooks, HP EliteBooks & Spectres, Dell XPS workstations, iPhones, Samsung Galaxy flagships, genuine Epson EcoTank & HP LaserJet printers, and Anker & Sony studio accessories.',
        'Every machine in our catalog is rigorously verified for battery health, thermal performance, and authentic serial provenance — backed by our 1-Year Local & Manufacturer Warranty, instant Lipa Na M-Pesa clearing (Buy Goods Till: 9309020), and Payment on Delivery nationwide.',
      ],
    },
    delivery: {
      kicker: 'CUSTOMER SUPPORT · DELIVERY & PAYMENT ON DELIVERY',
      title: '2-Hour Nairobi Express & 100% Free Nationwide Shipping.',
      body: [
        'We ship nationwide across all 47 counties of Kenya with 100% Free Shipping and zero delivery surcharge. Nairobi addresses (CBD, Westlands, Waiyaki Way, Kilimani, Karen, etc.) qualify for same-day 2-hour express rider delivery.',
        'Upcountry deliveries to Mombasa, Kisumu, Nakuru, Eldoret, Thika, Kiambu, Machakos, Meru, Nyeri, and Kajiado arrive within 24 to 48 hours via insured courier.',
        'Payment on Delivery (Inspect First): You are permitted to inspect the physical package and hardware upon arrival before paying via Cash or M-Pesa (Buy Goods Till No: 9309020) to the courier.',
      ],
    },
    returns: {
      kicker: 'CUSTOMER SUPPORT · RETURNS',
      title: '14-Day Showroom Exchange & Return Policy.',
      body: [
        'If a hardware system does not integrate seamlessly into your workflow, you may initiate a return or configuration exchange within 14 calendar days of delivery at our Nairobi CBD showroom (Kenyatta Pioneer Building, 5th Floor, Shop 514).',
        'For any factory hardware defect discovered within 30 days, Tech Sokoni provides an immediate verified replacement unit.',
      ],
    },
    warranty: {
      kicker: 'CUSTOMER SUPPORT · WARRANTY',
      title: '1-Year Official & Boutique Hardware Warranty.',
      body: [
        'Every laptop, phone, desktop, monitor, genuine Epson EcoTank printer, and Anker power system sold at Tech Sokoni is 100% manufacturer-certified and includes a 1-Year Local Kenya & Manufacturer Warranty.',
        'All warranty diagnostics, upgrades, and priority service are handled directly at Kenyatta Pioneer Building, 5th Floor, Shop 514, Kenyatta Avenue (Next to I&M Building), Nairobi CBD.',
      ],
    },
    faq: {
      kicker: 'CUSTOMER SUPPORT · FAQS',
      title: 'Frequently Asked Questions.',
      body: [
        'Where is Tech Sokoni located? — Visit our Nairobi CBD Storefront at Kenyatta Pioneer Building, along Kenyatta Avenue, 5th Floor, Shop Number 514 (Next to I&M Building). Orders Hotline & WhatsApp: +254 792 620 789.',
        'How does Payment on Delivery (Cash or M-Pesa on Delivery) work? — We offer Payment on Delivery across Nairobi County and major towns nationwide in Kenya. You inspect the physical package and hardware upon arrival before paying via Cash or M-Pesa (Buy Goods Till: 9309020).',
        'Are the products genuine and covered by warranty? — Absolutely. Every system is 100% genuine, serial-verified, and backed by a 1-year local service warranty.',
      ],
    },
    contact: {
      kicker: 'CONCIERGE · CONTACT TECH SOKONI',
      title: 'Visit Our Kenyatta Avenue Showroom or Chat on WhatsApp.',
      body: [
        'Physical Address: Kenyatta Pioneer Building, along Kenyatta Avenue, 5th Floor, Shop Number 514 (Next to I&M Building), Nairobi CBD, Kenya.',
        'Orders Hotline & WhatsApp: +254 792 620 789 / 0792 620 789 · Email: shop@techsokoni.com',
        'Lipa Na M-Pesa Buy Goods Till Number: 9309020 · Hours: Monday – Saturday, 8:30 AM – 6:30 PM EAT.',
      ],
    },
    privacy: {
      kicker: 'LEGAL · PRIVACY POLICY & DATA PROTECTION',
      title: 'Client Data Privacy & Protection Policy.',
      body: [
        'In compliance with the Kenya Data Protection Act, 2019, Tech Sokoni is dedicated to safeguarding your personal data, delivery addresses, and payment information with institutional-grade confidentiality.',
        'Information Collected: We collect your name, phone number, delivery address, email, and hardware serial numbers solely for order fulfillment, courier transit updates, M-Pesa receipt verification, and warranty service.',
        'Data Retention & Security: Your data is never sold, traded, or shared with third-party advertising brokers. It is encrypted in transit and at rest.',
        'Payment Information: We do not store PINs or banking credentials. All mobile payments are conducted directly through Safaricom Lipa Na M-Pesa (Buy Goods Till 9309020) and verified by reference codes.',
        'Your Rights: You may request access to, correction of, or permanent deletion of your client profile at any time by contacting shop@techsokoni.com or our Kenyatta Avenue showroom concierge.',
      ],
    },
    terms: {
      kicker: 'LEGAL · TERMS OF SERVICE & SALE',
      title: 'Terms of Sale, Delivery & Hardware Warranty.',
      body: [
        '1. Pricing & Currency: All prices displayed on Tech Sokoni are quoted in Kenyan Shillings (KSh) and are inclusive of applicable statutory taxes.',
        '2. Payment Methods: We accept Lipa Na M-Pesa Buy Goods Till 9309020 and Payment on Delivery (Cash or M-Pesa on Delivery) across Nairobi County and nationwide transit hubs.',
        '3. Order Verification & Delivery: Orders are dispatched from Kenyatta Pioneer Building, Shop 514, Nairobi. Same-day delivery applies for orders confirmed before 3:00 PM EAT within Nairobi.',
        '4. Inspection & Guarantee: Clients are entitled to physically inspect hardware packaging and verified serial numbers upon delivery before confirming receipt.',
        '5. Warranty Coverage: Every new system includes a minimum 1-Year Official Manufacturer and Tech Sokoni warranty. Defective units reported within 14 calendar days are eligible for priority replacement.',
        '6. Governing Law: These terms are governed by and construed in accordance with the laws of the Republic of Kenya.',
      ],
    },
  }[section];

  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-6">
      <button
        onClick={() => navigate({ page: 'home' })}
        className="text-xs font-mono-num uppercase tracking-widest text-[#6E6D68] hover:text-[#141413] flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Showroom</span>
      </button>

      <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68]">
        {contentMap.kicker}
      </p>
      <h1 className="font-editorial text-3xl sm:text-5xl text-[#141413]">
        {contentMap.title}
      </h1>
      <div className="space-y-4 pt-4 border-t border-[#141413]/10 text-sm text-[#5E5D59] leading-relaxed">
        {contentMap.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {/* Showroom Location & Direct WhatsApp Contact Card */}
      <div className="mt-8 p-5 bg-[#EAE9E4]/70 border border-[#141413]/12 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-mono-num text-[10px] uppercase tracking-wider text-[#6E6D68]">
              Nairobi CBD Storefront
            </p>
            <p className="font-semibold text-[#141413]">
              Kenyatta Pioneer Building, 5th Floor, Shop 514
            </p>
            <p className="text-[#5E5D59]">
              Along Kenyatta Avenue (Next to I&amp;M Building), Nairobi CBD
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-mono-num text-[10px] uppercase tracking-wider text-[#6E6D68]">
              Direct Contact &amp; M-Pesa Till
            </p>
            <p className="font-semibold text-[#141413]">
              Tel / WhatsApp: +254 792 620 789
            </p>
            <p className="text-[#5E5D59]">
              Email: shop@techsokoni.com · Buy Goods Till: 9309020
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20would%20like%20to%20make%20an%20inquiry."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#1F6F43] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider inline-flex items-center gap-2 hover:bg-[#185835] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp (+254 792 620 789)</span>
          </a>
          <a
            href="tel:+254792620789"
            className="px-4 py-2.5 border border-[#141413]/25 bg-[#F4F3EF] text-[#141413] text-xs font-mono-num uppercase tracking-wider inline-flex items-center gap-2 hover:border-[#141413] transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call +254 792 620 789</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const Footer: React.FC = () => {
  const { settings, navigate, showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [footerTrackingQuery, setFooterTrackingQuery] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address to subscribe.');
      return;
    }
    setIsSubscribed(true);
    setNewsletterEmail('');
    showToast(
      `Subscribed (${email}) to Tech Sokoni Hardware Dispatches & Privileges`
    );
  };

  const handleFooterTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerTrackingQuery.trim()) return;
    navigate({ page: 'track-shipment', orderId: footerTrackingQuery.trim() });
  };

  return (
    <footer className="bg-[#F4F3EF] border-t border-[#141413]/12 text-[#141413]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-11">
        {/* TOP ROW: Brand Identity + Modern Newsletter Subscription Form */}
        <div className="pb-6 border-b border-[#141413]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate({ page: 'home' })}
                className="text-base sm:text-lg font-semibold tracking-[0.18em] uppercase text-[#141413] cursor-pointer"
              >
                TECH SOKONI
              </button>
              <span className="text-[10px] font-mono-num uppercase tracking-widest px-2 py-0.5 bg-[#EAE9E4] text-[#5E5D59]">
                Nairobi CBD · Shop 514
              </span>
            </div>
            <p className="text-xs text-[#5E5D59] max-w-md">
              Technology that moves you. Genuine laptops, smartphones, desktops,
              monitors, printers &amp; accessories.
            </p>
          </div>

          {/* Newsletter Subscription Module */}
          <form
            onSubmit={handleNewsletterSubmit}
            className="w-full lg:w-auto lg:min-w-[410px]"
          >
            <label
              htmlFor="footer-newsletter-input"
              className="block text-[10px] font-mono-num uppercase tracking-[0.18em] text-[#6E6D68] mb-1.5"
            >
              Subscribe for New Arrivals &amp; Showroom Privileges
            </label>
            <div className="flex items-stretch">
              <input
                id="footer-newsletter-input"
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  if (isSubscribed) setIsSubscribed(false);
                }}
                placeholder="Enter your email address..."
                className="flex-1 min-w-0 bg-[#EAE9E4]/75 border border-[#141413]/20 focus:border-[#141413] focus:outline-none px-3.5 py-2 text-xs text-[#141413] placeholder:text-[#8E8D87]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {isSubscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#36B37E]" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ORDER TRACKING ON FOOTER */}
        <div className="py-4 px-4 bg-[#EAE9E4]/70 border border-[#141413]/12 my-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1F6F43] text-[#F4F3EF] flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono-num uppercase tracking-wider font-bold text-[#141413] block">
                Track Your Order &amp; Delivery
              </span>
              <span className="text-[11px] text-[#6E6D68]">
                Check real-time dispatch status using your order number (e.g. TS-2026-1001) or phone
              </span>
            </div>
          </div>

          <form onSubmit={handleFooterTrack} className="flex items-stretch gap-2 w-full md:w-auto">
            <input
              type="text"
              required
              placeholder="Order Number / Phone..."
              value={footerTrackingQuery}
              onChange={(e) => setFooterTrackingQuery(e.target.value)}
              className="flex-1 md:w-64 bg-white border border-[#141413]/20 px-3.5 py-2 text-xs text-[#141413] focus:outline-none focus:border-[#141413]"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-[#1F6F43] hover:bg-[#185835] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              Track Order
            </button>
          </form>
        </div>

        {/* MIDDLE ROW: Compact Space-Saving Grid Across Mobile (3-col), Tablet (4-col) & Desktop (12-col) */}
        <div className="py-6 border-b border-[#141413]/10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Showroom Address & Direct Contact Column */}
          <div className="md:col-span-5 lg:col-span-5 space-y-2.5">
            <p className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
              Showroom &amp; Payment
            </p>
            <div className="text-xs text-[#5E5D59] space-y-1">
              <p className="font-medium text-[#141413] flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D94E34]" />
                <span>
                  {settings.showroomAddress ||
                    'Kenyatta Pioneer Building, 5th Floor, Shop 514, Kenyatta Avenue (Next to I&M Building), Nairobi CBD'}
                </span>
              </p>
              <p className="pl-5 font-mono-num text-[11px]">
                Hotline:{' '}
                <a
                  href="tel:+254792620789"
                  className="text-[#141413] font-semibold hover:underline"
                >
                  +254 792 620 789
                </a>{' '}
                · {settings.supportEmail || 'shop@techsokoni.com'}
              </p>
              <p className="pl-5 font-mono-num text-[11px] text-[#1F6F43] font-medium">
                M-Pesa Buy Goods Till: 9309020 · Payment on Delivery Available
              </p>
            </div>

            <div className="pl-5 pt-0.5 flex flex-wrap items-center gap-2">
              <a
                href="https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20am%20browsing%20your%20online%20showroom%20and%20have%20a%20question."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#1F6F43] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-[#185835] transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
              <a
                href="tel:+254792620789"
                className="px-3 py-1.5 border border-[#141413]/20 text-[#141413] text-[10px] font-mono-num uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-[#141413] transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>0792 620 789</span>
              </a>
            </div>
          </div>

          {/* 3-Column Navigation Links even on Mobile to Save Vertical Space */}
          <div className="md:col-span-7 lg:col-span-7 grid grid-cols-3 gap-4 sm:gap-6">
            {/* Shop Column */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono-num uppercase tracking-[0.18em] text-[#6E6D68]">
                Shop
              </p>
              <ul className="space-y-1.5 text-xs text-[#5E5D59]">
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'category', categoryId: 'laptops' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Laptops
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'category', categoryId: 'phones' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Phones
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'category', categoryId: 'desktops' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Desktops
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'category', categoryId: 'printers' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Printers
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'category', categoryId: 'accessories' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Accessories
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ page: 'deals' })}
                    className="hover:text-[#141413] transition-colors text-[#D94E34] font-medium cursor-pointer"
                  >
                    Deals
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono-num uppercase tracking-[0.18em] text-[#6E6D68]">
                Support
              </p>
              <ul className="space-y-1.5 text-xs text-[#5E5D59]">
                <li>
                  <button
                    onClick={() => navigate({ page: 'track-shipment' })}
                    className="hover:text-[#141413] text-[#1F6F43] font-semibold transition-colors cursor-pointer"
                  >
                    Track Shipment
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'info', section: 'contact' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'info', section: 'delivery' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Delivery
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'info', section: 'returns' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Returns
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'info', section: 'warranty' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Warranty
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ page: 'info', section: 'faq' })}
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    FAQs
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono-num uppercase tracking-[0.18em] text-[#6E6D68]">
                Company
              </p>
              <ul className="space-y-1.5 text-xs text-[#5E5D59]">
                <li>
                  <button
                    onClick={() => navigate({ page: 'info', section: 'about' })}
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      navigate({ page: 'info', section: 'privacy' })
                    }
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Privacy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ page: 'info', section: 'terms' })}
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Terms
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ page: 'client-portal' })}
                    className="hover:text-[#141413] transition-colors cursor-pointer"
                  >
                    Client Area
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ page: 'admin' })}
                    className="hover:text-[#141413] transition-colors font-medium text-[#141413] cursor-pointer"
                  >
                    Admin
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & PAYMENT METHODS STRIP */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6E6D68]">
          <p>© {new Date().getFullYear()} TECH SOKONI KENYA. All rights reserved.</p>
          <p className="font-mono-num text-[10px] uppercase tracking-wider text-[#141413]">
            Official Payments: Lipa Na M-Pesa (Till 9309020) · Payment on Delivery
          </p>
        </div>
      </div>
    </footer>
  );
};
