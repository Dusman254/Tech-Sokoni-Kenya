import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Scale,
  ShoppingBag,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { StudioImage } from './StudioImage';

export const HomeEditorialSections: React.FC = () => {
  const {
    products,
    activeOffers,
    settings,
    compareIds,
    navigate,
    addToCart,
    toggleCompare,
    getEffectivePricing,
  } = useStore();

  const featuredProducts = products.filter((p) => p.featured);
  const displayFeatured =
    featuredProducts.length > 0 ? featuredProducts : products.slice(0, 6);

  const dealProducts = products.filter(
    (p) => getEffectivePricing(p).hasDiscount
  );

  const primaryOffer =
    activeOffers.find((o) => o.featured) || activeOffers[0];

  // Auto-advancing 3-second carousel index for Featured Technology
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [pauseFeatured, setPauseFeatured] = useState(false);

  // Auto-advancing 3-second carousel index for Tech Sokoni Deals
  const [dealsIdx, setDealsIdx] = useState(0);
  const [pauseDeals, setPauseDeals] = useState(false);

  useEffect(() => {
    if (pauseFeatured || displayFeatured.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIdx((prev) => (prev + 1) % displayFeatured.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [pauseFeatured, displayFeatured.length]);

  useEffect(() => {
    if (pauseDeals || dealProducts.length <= 1) return;
    const timer = setInterval(() => {
      setDealsIdx((prev) => (prev + 1) % dealProducts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [pauseDeals, dealProducts.length]);

  // Helper to get a sliding window of 3 items for Desktop, 2 for Tablet, 1 for Mobile
  const getWindowItems = <T,>(items: T[], startIdx: number, count: number): T[] => {
    if (items.length === 0) return [];
    const result: T[] = [];
    for (let i = 0; i < Math.min(count, items.length); i++) {
      result.push(items[(startIdx + i) % items.length]);
    }
    return result;
  };

  const visibleFeaturedDesktop = getWindowItems(displayFeatured, featuredIdx, 3);
  const visibleDealsDesktop = getWindowItems(dealProducts, dealsIdx, 3);

  return (
    <div className="w-full">
      {/* =====================================================================
          SECTION 02: FEATURED TECHNOLOGY (3-Second Auto-Advancing Carousel)
         ===================================================================== */}
      <section
        onMouseEnter={() => setPauseFeatured(true)}
        onMouseLeave={() => setPauseFeatured(false)}
        className="py-14 sm:py-20 border-b border-[#141413]/10 bg-[#F4F3EF]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68] mb-1">
                02. FEATURED TECHNOLOGY · AUTO-EXHIBITION
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
                Curated Systems for Studio & Work
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {displayFeatured.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setFeaturedIdx(
                        (prev) =>
                          (prev - 1 + displayFeatured.length) %
                          displayFeatured.length
                      )
                    }
                    aria-label="Previous featured product"
                    className="w-9 h-9 rounded-full border border-[#141413]/25 flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono-num text-xs text-[#6E6D68]">
                    {String(
                      (featuredIdx % displayFeatured.length) + 1
                    ).padStart(2, '0')}{' '}
                    / {String(displayFeatured.length).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() =>
                      setFeaturedIdx(
                        (prev) => (prev + 1) % displayFeatured.length
                      )
                    }
                    aria-label="Next featured product"
                    className="w-9 h-9 rounded-full border border-[#141413]/25 flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() =>
                  navigate({ page: 'category', categoryId: 'all' })
                }
                className="ml-2 inline-flex items-center gap-1 text-xs font-mono-num uppercase tracking-[0.16em] text-[#141413] hover:opacity-70 cursor-pointer whitespace-nowrap"
              >
                <span>All ({products.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Horizontal Carousel Card (1 compact horizontal card at a time, changes every 3s) */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              {displayFeatured[featuredIdx % displayFeatured.length] && (() => {
                const product =
                  displayFeatured[featuredIdx % displayFeatured.length];
                const pricing = getEffectivePricing(product);
                const isCompared = compareIds.includes(product.id);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -28 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-[#EAE9E4]/75 border border-[#141413]/12 p-4 flex items-center gap-4"
                  >
                    <button
                      onClick={() =>
                        navigate({ page: 'product', productId: product.id })
                      }
                      className="w-28 h-28 bg-[#F4F3EF] p-3 shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      <StudioImage
                        src={product.images[0]}
                        alt={product.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-contain"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] truncate">
                        {product.brand} · {product.condition}
                      </p>
                      <button
                        onClick={() =>
                          navigate({ page: 'product', productId: product.id })
                        }
                        className="text-left block w-full mt-0.5 cursor-pointer"
                      >
                        <h3 className="text-sm font-semibold text-[#141413] truncate">
                          {product.name}
                        </h3>
                      </button>
                      <p className="text-[11px] text-[#5E5D59] truncate mt-0.5">
                        {product.shortSpec}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="font-mono-num text-sm font-semibold text-[#141413]">
                          {settings.currencySymbol}
                          {pricing.finalPrice.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleCompare(product.id)}
                            aria-label="Compare"
                            className={`p-1.5 border ${
                              isCompared
                                ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                                : 'border-[#141413]/20 text-[#141413]'
                            }`}
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => addToCart(product.id, 1, true)}
                            className="px-3 py-1.5 bg-[#141413] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider cursor-pointer whitespace-nowrap"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* Tablet & Desktop 3-Card Auto-Advancing Carousel */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {visibleFeaturedDesktop.map((product) => {
                const pricing = getEffectivePricing(product);
                const isCompared = compareIds.includes(product.id);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-[#EAE9E4]/55 border border-[#141413]/10 p-5 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono-num text-[#6E6D68] mb-3">
                        <span className="uppercase tracking-wider text-[#141413] font-semibold">
                          {product.brand}
                        </span>
                        <button
                          onClick={() => toggleCompare(product.id)}
                          className={`cursor-pointer ${
                            isCompared
                              ? 'text-[#D94E34] font-semibold'
                              : 'hover:text-[#141413]'
                          }`}
                        >
                          {isCompared ? '✓ Comparing' : '+ Compare'}
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          navigate({ page: 'product', productId: product.id })
                        }
                        className="w-full aspect-[4/3] bg-[#F4F3EF] p-6 flex items-center justify-center mb-4 cursor-pointer"
                      >
                        <StudioImage
                          src={product.images[0]}
                          alt={product.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      </button>

                      <button
                        onClick={() =>
                          navigate({ page: 'product', productId: product.id })
                        }
                        className="text-left block w-full cursor-pointer"
                      >
                        <h3 className="text-base font-semibold text-[#141413] truncate group-hover:opacity-75">
                          {product.name}
                        </h3>
                      </button>
                      <p className="text-xs text-[#6E6D68] mt-1 truncate">
                        {product.shortSpec}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#141413]/10 flex items-center justify-between">
                      <div className="flex items-baseline gap-2 font-mono-num">
                        <span className="text-base font-semibold text-[#141413]">
                          {settings.currencySymbol}
                          {pricing.finalPrice.toLocaleString()}
                        </span>
                        {pricing.hasDiscount && (
                          <span className="text-xs text-[#8E8D87] line-through">
                            {settings.currencySymbol}
                            {pricing.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(product.id, 1, true)}
                        className="px-3.5 py-2 bg-[#141413] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 03: TECH SOKONI DEALS (3-Second Auto-Advancing Carousel)
         ===================================================================== */}
      <section
        onMouseEnter={() => setPauseDeals(true)}
        onMouseLeave={() => setPauseDeals(false)}
        className="py-14 sm:py-20 bg-[#EAE9E4]/65 border-b border-[#141413]/10"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#141413]/12">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#D94E34] mb-1">
                <span>03. TECH SOKONI DEALS</span>
                {primaryOffer && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>VALID UNTIL {primaryOffer.endDate}</span>
                  </>
                )}
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
                {primaryOffer
                  ? primaryOffer.title
                  : 'Limited-Time Studio & Hardware Privileges'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {dealProducts.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setDealsIdx(
                        (prev) =>
                          (prev - 1 + dealProducts.length) % dealProducts.length
                      )
                    }
                    aria-label="Previous deal"
                    className="w-9 h-9 rounded-full border border-[#141413]/25 flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono-num text-xs text-[#6E6D68]">
                    {String((dealsIdx % dealProducts.length) + 1).padStart(
                      2,
                      '0'
                    )}{' '}
                    / {String(dealProducts.length).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() =>
                      setDealsIdx((prev) => (prev + 1) % dealProducts.length)
                    }
                    aria-label="Next deal"
                    className="w-9 h-9 rounded-full border border-[#141413]/25 flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => navigate({ page: 'deals' })}
                className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.16em] hover:bg-[#2B2B28] transition-colors cursor-pointer whitespace-nowrap"
              >
                All Deals ({dealProducts.length})
              </button>
            </div>
          </div>

          {dealProducts.length > 0 ? (
            <div className="mt-8">
              {/* Mobile Horizontal Deal Card (Cycles every 3s) */}
              <div className="md:hidden">
                <AnimatePresence mode="wait">
                  {dealProducts[dealsIdx % dealProducts.length] && (() => {
                    const product =
                      dealProducts[dealsIdx % dealProducts.length];
                    const pricing = getEffectivePricing(product);
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: 28 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -28 }}
                        transition={{
                          duration: 0.35,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="bg-[#F4F3EF] border border-[#141413]/12 p-4 flex items-center gap-4"
                      >
                        <button
                          onClick={() =>
                            navigate({ page: 'product', productId: product.id })
                          }
                          className="w-28 h-28 bg-[#EAE9E4] p-3 shrink-0 flex items-center justify-center cursor-pointer"
                        >
                          <StudioImage
                            src={product.images[0]}
                            alt={product.name}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-contain"
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#D94E34] font-semibold">
                            SAVE {pricing.discountPercentage}% ·{' '}
                            {product.brand}
                          </span>
                          <button
                            onClick={() =>
                              navigate({
                                page: 'product',
                                productId: product.id,
                              })
                            }
                            className="text-left block w-full mt-0.5 cursor-pointer"
                          >
                            <h3 className="text-sm font-semibold text-[#141413] truncate">
                              {product.name}
                            </h3>
                          </button>
                          <p className="text-[11px] text-[#6E6D68] truncate mt-0.5">
                            {product.shortSpec}
                          </p>
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-1.5 font-mono-num">
                              <span className="text-sm font-semibold text-[#141413]">
                                {settings.currencySymbol}
                                {pricing.finalPrice.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-[#8E8D87] line-through">
                                {settings.currencySymbol}
                                {pricing.originalPrice.toLocaleString()}
                              </span>
                            </div>
                            <button
                              onClick={() => addToCart(product.id, 1, true)}
                              className="px-3 py-1.5 bg-[#141413] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider cursor-pointer whitespace-nowrap"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>

              {/* Desktop / Tablet 3-Card Auto-Advancing Carousel */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {visibleDealsDesktop.map((product) => {
                    const pricing = getEffectivePricing(product);
                    return (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-[#F4F3EF] border border-[#141413]/10 p-5 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono-num mb-3">
                            <span className="text-[#D94E34] uppercase tracking-widest font-medium">
                              {pricing.badgeLabel || 'ACTIVE PRIVILEGE'}
                            </span>
                            {pricing.activeOffer?.endDate && (
                              <span className="text-[#6E6D68]">
                                Ends {pricing.activeOffer.endDate}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              navigate({
                                page: 'product',
                                productId: product.id,
                              })
                            }
                            className="w-full aspect-[4/3] bg-[#EAE9E4] p-6 flex items-center justify-center mb-4 cursor-pointer"
                          >
                            <StudioImage
                              src={product.images[0]}
                              alt={product.name}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            />
                          </button>

                          <p className="text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                            {product.brand} · {product.sku}
                          </p>

                          <button
                            onClick={() =>
                              navigate({
                                page: 'product',
                                productId: product.id,
                              })
                            }
                            className="text-left block w-full mt-1 cursor-pointer"
                          >
                            <h3 className="text-base font-semibold text-[#141413] truncate group-hover:opacity-75">
                              {product.name}
                            </h3>
                          </button>
                          <p className="text-xs text-[#6E6D68] mt-1 truncate">
                            {product.shortSpec}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#141413]/10 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-baseline gap-2 font-mono-num">
                              <span className="text-lg font-semibold text-[#141413]">
                                {settings.currencySymbol}
                                {pricing.finalPrice.toLocaleString()}
                              </span>
                              <span className="text-xs text-[#8E8D87] line-through">
                                {settings.currencySymbol}
                                {pricing.originalPrice.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono-num text-[#1F6F43]">
                              Save {settings.currencySymbol}
                              {pricing.discountAmount.toLocaleString()} (
                              {pricing.discountPercentage}%)
                            </p>
                          </div>

                          <button
                            onClick={() => addToCart(product.id, 1, true)}
                            className="px-3.5 py-2 bg-[#141413] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-[#6E6D68]">
              No active deals at this moment.
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: AUTHENTIC TECH SOKONI SHOWROOM & SERVICE GUARANTEES
         ===================================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 sm:py-20 border-t border-[#141413]/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-[#EAE9E4]/55 border border-[#141413]/10 space-y-2">
            <p className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#D94E34] font-semibold">
              01 · NAIROBI CBD STOREFRONT
            </p>
            <h3 className="font-editorial text-2xl text-[#141413]">
              Kenyatta Pioneer Bldg, Shop 514
            </h3>
            <p className="text-xs text-[#5E5D59] leading-relaxed">
              Visit us along Kenyatta Avenue, 5th Floor, Shop Number 514 (Next
              to I&amp;M Building), Nairobi CBD.
            </p>
          </div>

          <div className="p-5 bg-[#EAE9E4]/55 border border-[#141413]/10 space-y-2">
            <p className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#1F6F43] font-semibold">
              02 · INSPECT FIRST ON DELIVERY
            </p>
            <h3 className="font-editorial text-2xl text-[#141413]">
              Payment on Delivery
            </h3>
            <p className="text-xs text-[#5E5D59] leading-relaxed">
              Inspect your physical package and hardware upon arrival before
              paying via Cash or M-Pesa nationwide.
            </p>
          </div>

          <div className="p-5 bg-[#EAE9E4]/55 border border-[#141413]/10 space-y-2">
            <p className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#141413] font-semibold">
              03 · LIPA NA M-PESA EXPRESS
            </p>
            <h3 className="font-editorial text-2xl text-[#141413]">
              Buy Goods Till: 9309020
            </h3>
            <p className="text-xs text-[#5E5D59] leading-relaxed">
              Instant STK Push checkout or direct Lipa Na M-Pesa Buy Goods Till
              9309020 with verified tax invoice.
            </p>
          </div>

          <div className="p-5 bg-[#EAE9E4]/55 border border-[#141413]/10 space-y-2">
            <p className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#141413] font-semibold">
              04 · 2-HR NAIROBI &amp; FREE SHIPPING
            </p>
            <h3 className="font-editorial text-2xl text-[#141413]">
               Hotline: +254 792 620 789
            </h3>
            <p className="text-xs text-[#5E5D59] leading-relaxed">
              Same-day 2-hour express rider dispatch in Nairobi &amp; 100% Free
              Shipping across all 47 counties in Kenya.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
