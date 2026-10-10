import React, { useEffect, useMemo, useState } from 'react';
import { Grid, List, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CategoryId, ProductCondition } from '../types/store';
import { ProductCard } from './ProductCard';

interface CategoryViewProps {
  categoryId: CategoryId | 'all';
  dealsOnly?: boolean;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categoryId,
  dealsOnly = false,
}) => {
  const {
    products,
    categories,
    activeOffers,
    navigate,
    getEffectivePricing,
    getCategoryFilters,
    setCategoryFilters,
    resetCategoryFilters,
  } = useStore();

  const catKey = dealsOnly ? 'deals' : String(categoryId);
  const currentFilters = getCategoryFilters(catKey);

  const selectedBrand = currentFilters.brand;
  const selectedPriceBand = currentFilters.priceBand;
  const selectedCondition = currentFilters.condition;
  const inStockOnly = currentFilters.inStockOnly;
  const selectedRam = currentFilters.ram;
  const selectedStorage = currentFilters.storage;
  const selectedOs = currentFilters.os;
  const sortBy = currentFilters.sortBy;

  const setSelectedBrand = (brand: string) =>
    setCategoryFilters(catKey, { brand });
  const setSelectedPriceBand = (priceBand: string) =>
    setCategoryFilters(catKey, { priceBand });
  const setSelectedCondition = (condition: ProductCondition | 'all') =>
    setCategoryFilters(catKey, { condition });
  const setInStockOnly = (inStock: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof inStock === 'function' ? inStock(inStockOnly) : inStock;
    setCategoryFilters(catKey, { inStockOnly: nextVal });
  };
  const setSelectedRam = (ram: string) =>
    setCategoryFilters(catKey, { ram });
  const setSelectedStorage = (storage: string) =>
    setCategoryFilters(catKey, { storage });
  const setSelectedOs = (os: string) =>
    setCategoryFilters(catKey, { os });
  const setSortBy = (
    nextSort: 'featured' | 'price-asc' | 'price-desc' | 'rating'
  ) => setCategoryFilters(catKey, { sortBy: nextSort });

  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  // Default to 'compact-list' (List View) on Mobile and Tablet (< 1024px), 'grid' on Desktop (>= 1024px)
  const [viewMode, setViewMode] = useState<'grid' | 'compact-list'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024
      ? 'compact-list'
      : 'grid'
  );
  const [userOverrodeView, setUserOverrodeView] = useState<boolean>(false);

  useEffect(() => {
    if (userOverrodeView) return;
    const handleResize = () => {
      setViewMode(window.innerWidth < 1024 ? 'compact-list' : 'grid');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userOverrodeView]);

  const currentCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  // Base products for this category or deals view
  const baseProducts = useMemo(() => {
    return products.filter((p) => {
      if (dealsOnly && !getEffectivePricing(p).hasDiscount) return false;
      if (categoryId !== 'all' && p.category !== categoryId) return false;
      return true;
    });
  }, [products, categoryId, dealsOnly, activeOffers]);

  // Dynamic facet values extracted from baseProducts
  const brands = useMemo(
    () => Array.from(new Set(baseProducts.map((p) => p.brand))).sort(),
    [baseProducts]
  );

  const ramOptions = useMemo(
    () =>
      Array.from(
        new Set(
          baseProducts
            .map((p) => p.specs.ram)
            .filter((v): v is string => Boolean(v))
        )
      ),
    [baseProducts]
  );

  const storageOptions = useMemo(
    () =>
      Array.from(
        new Set(
          baseProducts
            .map((p) => p.specs.storage)
            .filter((v): v is string => Boolean(v))
        )
      ),
    [baseProducts]
  );

  const osOptions = useMemo(
    () =>
      Array.from(
        new Set(
          baseProducts
            .map((p) => p.specs.os)
            .filter((v): v is string => Boolean(v))
        )
      ),
    [baseProducts]
  );

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    const list = baseProducts.filter((p) => {
      const pricing = getEffectivePricing(p);
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (selectedCondition !== 'all' && p.condition !== selectedCondition)
        return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (selectedRam !== 'all' && p.specs.ram !== selectedRam) return false;
      if (selectedStorage !== 'all' && p.specs.storage !== selectedStorage)
        return false;
      if (selectedOs !== 'all' && p.specs.os !== selectedOs) return false;

      if (selectedPriceBand === 'under-25k' && pricing.finalPrice >= 25000)
        return false;
      if (
        selectedPriceBand === '25k-75k' &&
        (pricing.finalPrice < 25000 || pricing.finalPrice > 75000)
      )
        return false;
      if (
        selectedPriceBand === '75k-150k' &&
        (pricing.finalPrice < 75000 || pricing.finalPrice > 150000)
      )
        return false;
      if (selectedPriceBand === 'over-150k' && pricing.finalPrice <= 150000)
        return false;

      return true;
    });

    return [...list].sort((a, b) => {
      const priceA = getEffectivePricing(a).finalPrice;
      const priceB = getEffectivePricing(b).finalPrice;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return b.rating - a.rating;
      return Number(b.featured) - Number(a.featured);
    });
  }, [
    baseProducts,
    selectedBrand,
    selectedCondition,
    inStockOnly,
    selectedRam,
    selectedStorage,
    selectedOs,
    selectedPriceBand,
    sortBy,
    activeOffers,
  ]);

  const activeFilterCount = [
    selectedBrand !== 'all',
    selectedPriceBand !== 'all',
    selectedCondition !== 'all',
    inStockOnly,
    selectedRam !== 'all',
    selectedStorage !== 'all',
    selectedOs !== 'all',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    resetCategoryFilters(catKey);
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF]">
      {/* Category Editorial Header */}
      <section className="showroom-canvas border-b border-[#141413]/10 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-mono-num uppercase tracking-[0.24em] text-[#6E6D68] mb-2">
              {dealsOnly
                ? 'TECH SOKONI DEALS · ACTIVE PRIVILEGES'
                : currentCategory
                ? `TECH SOKONI · ${currentCategory.shortLabel}`
                : 'TECH SOKONI · COMPLETE ARCHIVE'}
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141413] tracking-tight text-balance">
              {dealsOnly
                ? 'Tech Sokoni Deals'
                : currentCategory
                ? currentCategory.editorialHeadline
                : 'Technology curated for work, studio and everyday life.'}
            </h1>
            <p className="text-sm text-[#5E5D59] mt-3 max-w-2xl leading-relaxed">
              {dealsOnly
                ? 'Live promotional offers and hardware privileges managed directly from the Tech Sokoni Showroom.'
                : currentCategory
                ? currentCategory.description
                : 'Browse our complete hardware collection across laptops, smartphones, desktops, reference monitors, printers, and precision accessories.'}
            </p>
          </div>

          {/* Horizontal Department Switcher */}
          {!dealsOnly && (
            <div className="mt-8 pt-6 border-t border-[#141413]/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => navigate({ page: 'category', categoryId: 'all' })}
                className={`px-3.5 py-2 text-xs font-mono-num uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  categoryId === 'all'
                    ? 'bg-[#141413] text-[#F4F3EF]'
                    : 'bg-[#F4F3EF]/80 text-[#5E5D59] hover:text-[#141413] border border-[#141413]/10'
                }`}
              >
                All Systems
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    navigate({ page: 'category', categoryId: cat.id })
                  }
                  className={`px-3.5 py-2 text-xs font-mono-num uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    categoryId === cat.id
                      ? 'bg-[#141413] text-[#F4F3EF]'
                      : 'bg-[#F4F3EF]/80 text-[#5E5D59] hover:text-[#141413] border border-[#141413]/10'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Minimalist Filter & Sort Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#141413]/10">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFiltersDrawer((prev) => !prev)}
              className={`px-4 py-2 text-xs font-mono-num uppercase tracking-[0.15em] border flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                showFiltersDrawer || activeFilterCount > 0
                  ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                  : 'border-[#141413]/20 text-[#141413] hover:border-[#141413]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                Specifications & Filters
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </span>
            </button>

            {/* Quick Brand Buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedBrand === 'all'
                    ? 'text-[#141413] underline underline-offset-4 font-semibold'
                    : 'text-[#6E6D68] hover:text-[#141413]'
                }`}
              >
                All Brands
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedBrand === b
                      ? 'text-[#141413] underline underline-offset-4 font-semibold'
                      : 'text-[#6E6D68] hover:text-[#141413]'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-mono-num text-[#D94E34] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Right: Count, Sort, and Grid/List Toggle */}
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-xs font-mono-num text-[#6E6D68]">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'system' : 'systems'}
            </span>

            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as typeof sortBy)
              }
              className="bg-transparent border border-[#141413]/20 px-3 py-1.5 text-xs font-mono-num text-[#141413] focus:outline-none focus:border-[#141413] cursor-pointer"
            >
              <option value="featured">Sort: Curated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            <div className="flex items-center border border-[#141413]/20">
              <button
                onClick={() => {
                  setUserOverrodeView(true);
                  setViewMode('grid');
                }}
                aria-label="Grid view"
                title="Grid view"
                className={`p-1.5 transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#141413] text-[#F4F3EF]'
                    : 'text-[#6E6D68] hover:text-[#141413]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setUserOverrodeView(true);
                  setViewMode('compact-list');
                }}
                aria-label="Compact list view"
                title="List view (Default on Mobile & Tablet)"
                className={`p-1.5 transition-colors cursor-pointer ${
                  viewMode === 'compact-list'
                    ? 'bg-[#141413] text-[#F4F3EF]'
                    : 'text-[#6E6D68] hover:text-[#141413]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Minimalist Specification Filter Matrix */}
        {showFiltersDrawer && (
          <div className="py-6 border-b border-[#141413]/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 bg-[#EAE9E4]/50 px-5 my-4">
            {/* Brand */}
            <div>
              <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-2">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-2 text-xs text-[#141413]"
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-2">
                Price Range
              </label>
              <select
                value={selectedPriceBand}
                onChange={(e) => setSelectedPriceBand(e.target.value)}
                className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-2 text-xs text-[#141413]"
              >
                <option value="all">Any Price (KSh)</option>
                <option value="under-25k">Under KSh 25,000</option>
                <option value="25k-75k">KSh 25,000 – KSh 75,000</option>
                <option value="75k-150k">KSh 75,000 – KSh 150,000</option>
                <option value="over-150k">KSh 150,000+</option>
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-2">
                Condition
              </label>
              <select
                value={selectedCondition}
                onChange={(e) =>
                  setSelectedCondition(
                    e.target.value as ProductCondition | 'all'
                  )
                }
                className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-2 text-xs text-[#141413]"
              >
                <option value="all">All Conditions</option>
                <option value="New">New</option>
                <option value="Refurbished">Refurbished</option>
                <option value="Used">Used</option>
              </select>
            </div>

            {/* Memory (RAM) */}
            <div>
              <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-2">
                Memory (RAM)
              </label>
              <select
                value={selectedRam}
                onChange={(e) => setSelectedRam(e.target.value)}
                className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-2 text-xs text-[#141413]"
              >
                <option value="all">Any RAM</option>
                {ramOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Storage */}
            <div>
              <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-2">
                Storage
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-2 text-xs text-[#141413]"
              >
                <option value="all">Any Capacity</option>
                {storageOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Operating System & Availability */}
            <div>
              <label className="block text-[11px] font-mono-num uppercase tracking-wider text-[#6E6D68] mb-2">
                OS & Availability
              </label>
              <div className="space-y-2">
                <select
                  value={selectedOs}
                  onChange={(e) => setSelectedOs(e.target.value)}
                  className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-2.5 py-1.5 text-xs text-[#141413]"
                >
                  <option value="all">All Platforms</option>
                  {osOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-[#141413] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[#141413]"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Product Catalog Display */}
        {filteredProducts.length > 0 ? (
          viewMode === 'compact-list' ? (
            <div className="mt-6 max-w-4xl space-y-3.5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  layout="compact-list"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="grid" />
              ))}
            </div>
          )
        ) : (
          <div className="py-20 text-center max-w-md mx-auto">
            <p className="font-mono-num text-xs uppercase tracking-widest text-[#6E6D68]">
              TECH SOKONI ARCHIVE
            </p>
            <h3 className="font-editorial text-3xl text-[#141413] mt-2">
              No matching configurations found
            </h3>
            <p className="text-xs text-[#5E5D59] mt-2">
              Adjust or reset your specification filters to view available
              hardware systems.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-6 px-6 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
