import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Laptop,
  Monitor,
  Printer,
  ShoppingBag,
  Smartphone,
  Tablet,
  Wifi,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { CategoryId, CategoryInfo } from '../types/store';
import { StudioImage } from './StudioImage';

export const CATEGORY_ICONS: Record<CategoryId, React.ComponentType<{ className?: string }>> = {
  laptops: Laptop,
  phones: Smartphone,
  desktops: Cpu,
  monitors: Monitor,
  printers: Printer,
  tablets: Tablet,
  accessories: Headphones,
  networking: Wifi,
  storage: HardDrive,
  gaming: Gamepad2,
};

export const ShowroomStage: React.FC = () => {
  const {
    products,
    categories,
    settings,
    navigate,
    addToCart,
    getEffectivePricing,
  } = useStore();

  // Desktop hover index: null when mouse is NOT pointed at the hanger ("let it just be the way it is")
  const [hoveredRailIdx, setHoveredRailIdx] = useState<number | null>(null);

  // Tablet & Mobile auto-carousel index (advances every 3 seconds on tablet and mobile views)
  const [carouselIdx, setCarouselIdx] = useState<number>(0);
  const [isTouchPaused, setIsTouchPaused] = useState<boolean>(false);

  // Opened category index for the animated Category Focus Stage (when clicking a category on the hanger)
  const [openedCategoryIdx, setOpenedCategoryIdx] = useState<number | null>(
    null
  );

  // Interactive Product Showcase state (Section below Hero)
  const [selectedShowcaseIdx, setSelectedShowcaseIdx] = useState<number>(0);

  const railCategories: CategoryInfo[] = categories;

  // Auto-carousel every 3 seconds for Tablet & Mobile Hero Category Hanger Rail
  useEffect(() => {
    if (isTouchPaused || openedCategoryIdx !== null || railCategories.length === 0)
      return;
    const timer = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % railCategories.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isTouchPaused, openedCategoryIdx, railCategories.length]);

  // Keyboard navigation when Category Animation Overlay is open
  useEffect(() => {
    if (openedCategoryIdx === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenedCategoryIdx(null);
      } else if (e.key === 'ArrowRight') {
        setOpenedCategoryIdx((prev) =>
          prev === null ? 0 : (prev + 1) % railCategories.length
        );
      } else if (e.key === 'ArrowLeft') {
        setOpenedCategoryIdx((prev) =>
          prev === null
            ? 0
            : (prev - 1 + railCategories.length) % railCategories.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openedCategoryIdx, railCategories.length]);

  const openedCategory: CategoryInfo | null =
    openedCategoryIdx !== null
      ? railCategories[openedCategoryIdx] || null
      : null;

  const showcaseProducts = products.slice(0, 8);
  const selectedShowcaseProduct =
    showcaseProducts[selectedShowcaseIdx] || showcaseProducts[0];

  return (
    <div className="w-full">
      {/* =====================================================================
          HERO SECTION:
          1. ONLY words: "Technology that moves you."
          2. Centerpiece Hanger Rail with Categories & Icons (auto-carousel every 3s)
          3. ONLY two buttons below the hanger
         ===================================================================== */}
      <section className="relative showroom-canvas min-h-[84vh] flex flex-col justify-between overflow-hidden border-b border-[#141413]/10 py-10 sm:py-14">
        {/* 1. ONLY WORDS ON HERO: "Technology that moves you." */}
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 text-center z-10">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-editorial text-4xl sm:text-6xl lg:text-[64px] leading-[1.04] tracking-tight text-[#141413]"
          >
            Technology that moves you.
          </motion.h1>
        </div>

        {/* 2. THE HANGER RAIL WITH CATEGORIES (ICONS)
               - Desktop (lg+): Resting undisturbed hanger rail when mouse is not pointed at it; expands on hover
               - Tablet & Mobile (< lg): Smooth 3-second auto-advancing carousel on the hanger rail */}
        <div className="relative max-w-[1360px] w-full mx-auto px-4 sm:px-10 my-auto py-6 sm:py-10">
          {/* DESKTOP HORIZONTAL HANGER RAIL (lg+): Static/calm when mouse is not pointed at the hanger */}
          <div
            onMouseLeave={() => setHoveredRailIdx(null)}
            className="hidden lg:block relative mx-auto max-w-[1240px]"
          >
            {/* Brushed Anodized Aluminum Bar */}
            <div
              aria-hidden="true"
              className="flex items-center justify-between w-full h-3.5 aluminum-rail rounded-full relative z-10"
            >
              <div className="w-5 h-7 -ml-1 aluminum-bracket rounded-xs border border-[#141413]/20" />
              <div className="w-5 h-7 -mr-1 aluminum-bracket rounded-xs border border-[#141413]/20" />
            </div>

            {/* Categories Hanging on the Rail */}
            <div className="flex items-start justify-between gap-2 w-full pt-0 -mt-1.5 min-h-[290px] px-3">
              {railCategories.map((cat, idx) => {
                const isHovered = hoveredRailIdx === idx;
                const isAnyHovered = hoveredRailIdx !== null;
                const IconComponent = CATEGORY_ICONS[cat.id] || Cpu;

                return (
                  <motion.div
                    key={cat.id}
                    layout
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 26,
                    }}
                    onMouseEnter={() => setHoveredRailIdx(idx)}
                    onClick={() => setOpenedCategoryIdx(idx)}
                    role="button"
                    tabIndex={0}
                    aria-label={cat.name}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenedCategoryIdx(idx);
                      }
                    }}
                    className={`group relative flex flex-col items-center cursor-pointer select-none transition-opacity duration-300 ${
                      isHovered
                        ? 'flex-[1.85] z-30 opacity-100'
                        : isAnyHovered
                        ? 'flex-[0.88] z-10 opacity-55'
                        : 'flex-1 z-20 opacity-100'
                    }`}
                  >
                    {/* Metallic Hanger Hook & Shoulder */}
                    <svg
                      viewBox="0 0 80 54"
                      className={`transition-all duration-500 ${
                        isHovered ? 'w-24 h-16' : 'w-16 h-12'
                      }`}
                      fill="none"
                    >
                      {/* Hook wrapping over the aluminum rail */}
                      <path
                        d="M40 2 C46 2, 48 10, 40 15 L40 24"
                        stroke="#52514D"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      />
                      {/* Hanger Shoulders */}
                      <path
                        d="M8 50 L40 24 L72 50"
                        stroke={isHovered ? '#141413' : '#5E5D59'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Suspended Category Icon Card on the Hanger */}
                    <motion.div
                      animate={{
                        scale: isHovered ? 1.08 : 1,
                        y: isHovered ? 4 : 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 280,
                        damping: 24,
                      }}
                      className={`w-full max-w-[152px] aspect-[4/5] flex flex-col items-center justify-center p-3.5 transition-colors duration-300 ${
                        isHovered
                          ? 'bg-[#141413] text-[#F4F3EF] shadow-[0_24px_38px_rgba(20,20,19,0.22)]'
                          : 'bg-[#F4F3EF] text-[#141413] border border-[#141413]/14 shadow-[0_8px_18px_rgba(20,20,19,0.06)]'
                      }`}
                    >
                      <IconComponent
                        className={`transition-transform duration-500 stroke-[1.4] ${
                          isHovered
                            ? 'w-11 h-11 text-[#F4F3EF] scale-110'
                            : 'w-8 h-8 text-[#141413]'
                        }`}
                      />
                      <span
                        className={`mt-3.5 text-[10px] font-mono-num uppercase tracking-[0.16em] text-center leading-tight ${
                          isHovered ? 'text-[#F4F3EF]' : 'text-[#141413]'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* TABLET & MOBILE HANGER RAIL AUTO-CAROUSEL (< lg, cycles every 3 seconds) */}
          <div
            onMouseEnter={() => setIsTouchPaused(true)}
            onMouseLeave={() => setIsTouchPaused(false)}
            onTouchStart={() => setIsTouchPaused(true)}
            onTouchEnd={() => setIsTouchPaused(false)}
            className="lg:hidden max-w-2xl mx-auto"
          >
            {/* Aluminum Rail Bar */}
            <div className="w-full h-3.5 aluminum-rail rounded-full flex items-center justify-between mb-1">
              <div className="w-4 h-6 -ml-1 aluminum-bracket rounded-xs border border-[#141413]/20" />
              <div className="w-4 h-6 -mr-1 aluminum-bracket rounded-xs border border-[#141413]/20" />
            </div>

            <div className="relative min-h-[260px] flex flex-col items-center justify-center">
              {/* Mobile View (< sm): 1 Centered Hanger Item Cycling Every 3s */}
              <div className="sm:hidden w-full flex flex-col items-center">
                <AnimatePresence mode="wait">
                  {railCategories[carouselIdx] && (() => {
                    const cat = railCategories[carouselIdx];
                    const MobileIcon = CATEGORY_ICONS[cat.id] || Cpu;
                    return (
                      <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, x: 36, scale: 0.94 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -36, scale: 0.94 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => setOpenedCategoryIdx(carouselIdx)}
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <svg
                          viewBox="0 0 80 54"
                          className="w-24 h-14 -mt-2"
                          fill="none"
                        >
                          <path
                            d="M40 2 C46 2, 48 10, 40 15 L40 24"
                            stroke="#52514D"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8 50 L40 24 L72 50"
                            stroke="#141413"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        <div className="w-44 h-48 bg-[#141413] text-[#F4F3EF] flex flex-col items-center justify-center p-5 shadow-xl">
                          <MobileIcon className="w-12 h-12 stroke-[1.4] text-[#F4F3EF]" />
                          <span className="mt-4 text-xs font-mono-num uppercase tracking-[0.2em]">
                            {cat.name}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })()}
                </AnimatePresence>
              </div>

              {/* Tablet View (sm to lg): 3-Item Sliding Hanger Carousel Cycling Every 3s */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-6 w-full px-4">
                <AnimatePresence mode="popLayout">
                  {[0, 1, 2].map((offset) => {
                    const itemIdx =
                      (carouselIdx + offset) % railCategories.length;
                    const cat = railCategories[itemIdx];
                    if (!cat) return null;
                    const TabletIcon = CATEGORY_ICONS[cat.id] || Cpu;
                    const isCenter = offset === 1;
                    return (
                      <motion.button
                        key={`${cat.id}-${itemIdx}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => setOpenedCategoryIdx(itemIdx)}
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <svg
                          viewBox="0 0 80 54"
                          className="w-20 h-13 -mt-2"
                          fill="none"
                        >
                          <path
                            d="M40 2 C46 2, 48 10, 40 15 L40 24"
                            stroke="#52514D"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8 50 L40 24 L72 50"
                            stroke={isCenter ? '#141413' : '#787772'}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        <div
                          className={`w-full max-w-[165px] h-44 flex flex-col items-center justify-center p-4 transition-colors ${
                            isCenter
                              ? 'bg-[#141413] text-[#F4F3EF] shadow-xl'
                              : 'bg-[#F4F3EF] text-[#141413] border border-[#141413]/15'
                          }`}
                        >
                          <TabletIcon className="w-10 h-10 stroke-[1.4]" />
                          <span className="mt-3 text-xs font-mono-num uppercase tracking-[0.18em]">
                            {cat.name}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Minimal Carousel Dots for Tablet & Mobile */}
              <div className="flex items-center gap-1.5 mt-5">
                {railCategories.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => setCarouselIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 transition-all rounded-full cursor-pointer ${
                      carouselIdx === i
                        ? 'w-5 bg-[#141413]'
                        : 'w-1.5 bg-[#141413]/25'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 3. ONLY TWO BUTTONS BELOW THE HANGER */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => navigate({ page: 'category', categoryId: 'all' })}
              className="px-6 py-2.5 rounded-full bg-[#141413] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-all cursor-pointer whitespace-nowrap"
            >
              Shop Technology
            </button>
            <button
              onClick={() => navigate({ page: 'deals' })}
              className="px-6 py-2.5 rounded-full border border-[#141413]/40 text-[#141413] text-[11px] font-mono-num uppercase tracking-[0.2em] hover:bg-[#141413] hover:text-[#F4F3EF] transition-all cursor-pointer whitespace-nowrap"
            >
              Explore Deals
            </button>
          </div>
        </div>

        {/* ===================================================================
            ANIMATED CATEGORY OPENING PORTAL (When clicking a category on rail)
           =================================================================== */}
        <AnimatePresence>
          {openedCategory && openedCategoryIdx !== null && (
            <motion.div
              key="category-portal"
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.35 }}
              role="dialog"
              aria-modal="true"
              aria-label={`Category focus: ${openedCategory.name}`}
              className="fixed inset-0 z-50 bg-[#EAE9E4]/90 backdrop-blur-xl flex flex-col justify-between p-6 sm:p-10 overflow-y-auto"
            >
              {/* Top Bar */}
              <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
                <span className="text-xs font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
                  TECH SOKONI · DEPARTMENT EXHIBITION
                </span>
                <button
                  onClick={() => setOpenedCategoryIdx(null)}
                  className="px-3 py-1.5 text-xs font-mono-num uppercase tracking-[0.2em] text-[#141413] hover:opacity-60 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Close</span>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Animated Category Center Stage */}
              <div className="my-auto max-w-4xl w-full mx-auto py-6">
                <div className="flex items-center justify-between gap-4 sm:gap-10">
                  <button
                    onClick={() =>
                      setOpenedCategoryIdx(
                        (openedCategoryIdx - 1 + railCategories.length) %
                          railCategories.length
                      )
                    }
                    aria-label="Previous category"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#141413]/25 flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={openedCategory.id}
                      initial={{ opacity: 0, scale: 0.86, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 24,
                      }}
                      className="flex-1 flex flex-col items-center text-center"
                    >
                      {(() => {
                        const ActiveIcon =
                          CATEGORY_ICONS[openedCategory.id] || Cpu;
                        const deptProducts = products
                          .filter((p) => p.category === openedCategory.id)
                          .slice(0, 3);

                        return (
                          <>
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#141413] text-[#F4F3EF] flex items-center justify-center shadow-2xl mb-5">
                              <ActiveIcon className="w-12 h-12 stroke-[1.4]" />
                            </div>

                            <p className="text-[11px] font-mono-num text-[#6E6D68] tracking-[0.22em]">
                              {String(openedCategoryIdx + 1).padStart(2, '0')} /{' '}
                              {String(railCategories.length).padStart(2, '0')}
                            </p>

                            <h2 className="font-editorial text-4xl sm:text-5xl text-[#141413] mt-1">
                              {openedCategory.name}
                            </h2>

                            <p className="text-xs sm:text-sm text-[#5E5D59] mt-2 max-w-md">
                              {openedCategory.editorialHeadline}
                            </p>

                            {/* Quick Horizontal Preview of Systems inside this Category */}
                            {deptProducts.length > 0 && (
                              <div className="mt-6 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {deptProducts.map((prod) => {
                                  const pricing = getEffectivePricing(prod);
                                  return (
                                    <button
                                      key={prod.id}
                                      onClick={() => {
                                        setOpenedCategoryIdx(null);
                                        navigate({
                                          page: 'product',
                                          productId: prod.id,
                                        });
                                      }}
                                      className="bg-[#F4F3EF] border border-[#141413]/12 p-3 flex sm:flex-col items-center gap-3 text-left sm:text-center hover:border-[#141413] transition-colors cursor-pointer"
                                    >
                                      <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                                        <StudioImage
                                          src={prod.images[0]}
                                          alt={prod.name}
                                          containerClassName="w-full h-full"
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-[#141413] truncate">
                                          {prod.name}
                                        </p>
                                        <p className="text-[11px] font-mono-num text-[#6E6D68]">
                                          {settings.currencySymbol}
                                          {pricing.finalPrice.toLocaleString()}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            <div className="mt-7 flex items-center justify-center gap-3">
                              <button
                                onClick={() => {
                                  const targetCat = openedCategory.id;
                                  setOpenedCategoryIdx(null);
                                  navigate({
                                    page: 'category',
                                    categoryId: targetCat,
                                  });
                                }}
                                className="px-7 py-3 rounded-full bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.2em] hover:bg-[#2B2B28] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                              >
                                <span>Open {openedCategory.name}</span>
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>

                  <button
                    onClick={() =>
                      setOpenedCategoryIdx(
                        (openedCategoryIdx + 1) % railCategories.length
                      )
                    }
                    aria-label="Next category"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#141413]/25 flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors shrink-0 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-center text-[11px] font-mono-num text-[#6E6D68]">
                Use ← → arrows to step through departments · ESC to close
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* =====================================================================
          INTERACTIVE SYSTEM SHOWCASE (Below Hero)
         ===================================================================== */}
      <section className="py-14 sm:py-20 border-b border-[#141413]/10 bg-[#EAE9E4]/55">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68] mb-1">
                01. INTERACTIVE SYSTEM SHOWCASE
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
                Inspect Flagship Hardware
              </h2>
            </div>
            <p className="text-xs text-[#6E6D68] font-mono-num">
              Select any system below to bring it into focus
            </p>
          </div>

          {/* Horizontal Selector Strip */}
          {showcaseProducts.length > 0 ? (
            <>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 border-b border-[#141413]/10">
                {showcaseProducts.map((item, idx) => {
                  const isSelected = selectedShowcaseIdx === idx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedShowcaseIdx(idx)}
                      className={`px-4 py-2 text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                        isSelected
                          ? 'bg-[#141413] text-[#F4F3EF]'
                          : 'bg-[#F4F3EF] text-[#5E5D59] hover:text-[#141413] border border-[#141413]/10'
                      }`}
                    >
                      <span className="font-mono-num text-[10px] opacity-65">
                        0{idx + 1}
                      </span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedShowcaseProduct && (() => {
                const pricing = getEffectivePricing(selectedShowcaseProduct);
                return (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedShowcaseProduct.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                    >
                      <div className="lg:col-span-6 flex items-center justify-center min-h-[240px] sm:min-h-[340px] bg-[#F4F3EF] border border-[#141413]/8 p-6">
                        <div className="w-full max-w-[300px] aspect-square flex items-center justify-center">
                          <StudioImage
                            src={selectedShowcaseProduct.images[0]}
                            alt={selectedShowcaseProduct.name}
                            containerClassName="w-full h-full flex items-center justify-center"
                            className="w-full h-full object-contain drop-shadow-[0_20px_28px_rgba(20,20,19,0.14)]"
                          />
                        </div>
                      </div>

                      <div className="lg:col-span-6 space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-num text-[#6E6D68]">
                          <span className="uppercase tracking-widest text-[#141413] font-semibold">
                            {selectedShowcaseProduct.brand}
                          </span>
                          <span>·</span>
                          <span>SKU {selectedShowcaseProduct.sku}</span>
                          <span>·</span>
                          <span className="text-[#1F6F43]">
                            {selectedShowcaseProduct.stock > 0
                              ? `In Stock (${selectedShowcaseProduct.stock})`
                              : 'Out of Stock'}
                          </span>
                        </div>

                        <h3 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
                          {selectedShowcaseProduct.name}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#5E5D59] leading-relaxed">
                          {selectedShowcaseProduct.shortDescription}
                        </p>

                        <p className="text-xs font-mono-num text-[#141413] py-2.5 border-y border-[#141413]/10">
                          {selectedShowcaseProduct.shortSpec}
                        </p>

                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-mono-num font-semibold text-[#141413]">
                            {settings.currencySymbol}
                            {pricing.finalPrice.toLocaleString()}
                          </span>
                          {pricing.hasDiscount && (
                            <span className="text-sm font-mono-num text-[#8E8D87] line-through">
                              {settings.currencySymbol}
                              {pricing.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            onClick={() =>
                              navigate({
                                page: 'product',
                                productId: selectedShowcaseProduct.id,
                              })
                            }
                            className="px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.18em] hover:bg-[#2B2B28] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            View Product
                          </button>
                          <button
                            onClick={() =>
                              addToCart(selectedShowcaseProduct.id, 1, true)
                            }
                            className="px-5 py-2.5 border border-[#141413]/25 text-[#141413] text-xs font-mono-num uppercase tracking-[0.18em] hover:border-[#141413] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                );
              })()}
            </>
          ) : (
            <div className="p-8 sm:p-12 bg-[#F4F3EF] border border-[#141413]/12 text-center space-y-3">
              <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#1F6F43] font-semibold">
                LIVE CATALOG · KENYATTA PIONEER BLDG, SHOP 514
              </p>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#141413]">
                Ready for Live Hardware Listings
              </h3>
              <p className="text-xs text-[#5E5D59] max-w-md mx-auto leading-relaxed">
                Publish your laptops, phones, monitors, and accessories from the
                Admin Dashboard to showcase them live in KSh on the storefront.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigate({ page: 'admin' })}
                  className="px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.18em] hover:bg-[#2B2B28] transition-colors cursor-pointer"
                >
                  Open Admin Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
