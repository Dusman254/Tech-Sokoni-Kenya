import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CategoryId } from '../types/store';
import { StudioImage } from './StudioImage';

type PricePresetId = 'all' | 'under-500' | '500-1500' | '1500-2500' | 'over-2500' | 'custom';
type SortOptionId = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

const KEYWORD_CHIPS = [
  'MacBook',
  'M4 Max',
  'OLED',
  'HP',
  'Dell',
  '1TB SSD',
  'LaserJet',
  'RTX',
  '5G',
  'ANC',
];

export const SearchOverlay: React.FC = () => {
  const {
    products,
    categories,
    settings,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    navigate,
    getEffectivePricing,
    addToCart,
  } = useStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // Filter states within SearchOverlay
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [pricePreset, setPricePreset] = useState<PricePresetId>('all');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOptionId>('relevance');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const queryTokens = useMemo(
    () => normalizedQuery.split(/\s+/).filter(Boolean),
    [normalizedQuery]
  );

  // Compute effective numeric min/max price bounds from preset or custom inputs (in KSh)
  const effectivePriceBounds = useMemo(() => {
    if (pricePreset === 'under-500') return { min: 0, max: 25000 };
    if (pricePreset === '500-1500') return { min: 25000, max: 75000 };
    if (pricePreset === '1500-2500') return { min: 75000, max: 150000 };
    if (pricePreset === 'over-2500') return { min: 150000, max: Infinity };
    if (pricePreset === 'custom') {
      const parsedMin = minPriceInput.trim() !== '' ? Number(minPriceInput) : 0;
      const parsedMax =
        maxPriceInput.trim() !== '' ? Number(maxPriceInput) : Infinity;
      return {
        min: Number.isNaN(parsedMin) ? 0 : Math.max(0, parsedMin),
        max: Number.isNaN(parsedMax) ? Infinity : Math.max(0, parsedMax),
      };
    }
    return { min: 0, max: Infinity };
  }, [pricePreset, minPriceInput, maxPriceInput]);

  const hasActiveFilters =
    normalizedQuery.length > 0 ||
    selectedCategory !== 'all' ||
    pricePreset !== 'all' ||
    minPriceInput.trim() !== '' ||
    maxPriceInput.trim() !== '' ||
    inStockOnly ||
    sortBy !== 'relevance';

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPricePreset('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setInStockOnly(false);
    setSortBy('relevance');
    inputRef.current?.focus();
  };

  const handleSelectPricePreset = (preset: PricePresetId) => {
    setPricePreset(preset);
    if (preset !== 'custom') {
      setMinPriceInput('');
      setMaxPriceInput('');
    }
  };

  // Live filtered products across keyword tokens, category filter, and price range filter
  const matchedProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      // 1. Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // 2. Stock filter
      if (inStockOnly && p.stock <= 0) {
        return false;
      }

      // 3. Price range filter (using effective final price)
      const pricing = getEffectivePricing(p);
      if (
        pricing.finalPrice < effectivePriceBounds.min ||
        pricing.finalPrice > effectivePriceBounds.max
      ) {
        return false;
      }

      // 4. Keyword search filter (matches all tokens across name, brand, category, SKU, condition, description, and specs)
      if (queryTokens.length > 0) {
        const specString = Object.values(p.specs).filter(Boolean).join(' ');
        const categoryName =
          categories.find((c) => c.id === p.category)?.name || p.category;
        const haystack =
          `${p.name} ${p.brand} ${p.category} ${categoryName} ${p.sku} ${p.condition} ${p.shortSpec} ${p.shortDescription} ${p.description} ${specString}`.toLowerCase();

        return queryTokens.every((token) => haystack.includes(token));
      }

      return true;
    });

    // Sort results
    const sorted = [...filtered];
    if (sortBy === 'price-asc') {
      sorted.sort(
        (a, b) =>
          getEffectivePricing(a).finalPrice - getEffectivePricing(b).finalPrice
      );
    } else if (sortBy === 'price-desc') {
      sorted.sort(
        (a, b) =>
          getEffectivePricing(b).finalPrice - getEffectivePricing(a).finalPrice
      );
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    }

    // If no filters are active at all, show top 6 featured systems; otherwise show all matching systems
    if (!hasActiveFilters) {
      return sorted.slice(0, 6);
    }
    return sorted;
  }, [
    products,
    categories,
    selectedCategory,
    inStockOnly,
    effectivePriceBounds,
    queryTokens,
    sortBy,
    hasActiveFilters,
    getEffectivePricing,
  ]);

  // Category counts based on current keyword and price filters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    categories.forEach((c) => {
      counts[c.id] = 0;
    });

    products.forEach((p) => {
      if (inStockOnly && p.stock <= 0) return;
      const pricing = getEffectivePricing(p);
      if (
        pricing.finalPrice < effectivePriceBounds.min ||
        pricing.finalPrice > effectivePriceBounds.max
      ) {
        return;
      }
      if (queryTokens.length > 0) {
        const specString = Object.values(p.specs).filter(Boolean).join(' ');
        const categoryName =
          categories.find((c) => c.id === p.category)?.name || p.category;
        const haystack =
          `${p.name} ${p.brand} ${p.category} ${categoryName} ${p.sku} ${p.condition} ${p.shortSpec} ${p.shortDescription} ${p.description} ${specString}`.toLowerCase();
        if (!queryTokens.every((token) => haystack.includes(token))) {
          return;
        }
      }
      counts.all = (counts.all || 0) + 1;
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    return counts;
  }, [products, categories, inStockOnly, effectivePriceBounds, queryTokens, getEffectivePricing]);

  // Live category & brand combination suggestions
  const liveSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [
        { label: 'HP Laptops', query: 'HP', categoryId: 'laptops' as CategoryId },
        { label: 'HP Printers', query: 'HP', categoryId: 'printers' as CategoryId },
        { label: 'Apple M4 Max Workstations', query: 'M4 Max', categoryId: 'laptops' as CategoryId },
        { label: '6K Reference Monitors', query: '6K', categoryId: 'monitors' as CategoryId },
        { label: 'Titanium Smartphones', query: 'Titanium', categoryId: 'phones' as CategoryId },
        { label: 'Wi-Fi 7 Mesh Networking', query: 'Wi-Fi 7', categoryId: 'networking' as CategoryId },
      ];
    }

    const suggestions: Array<{
      label: string;
      query: string;
      categoryId?: CategoryId;
    }> = [];

    const matchingBrands = Array.from(
      new Set(
        products
          .filter((p) => p.brand.toLowerCase().includes(normalizedQuery))
          .map((p) => p.brand)
      )
    );

    matchingBrands.forEach((brand) => {
      categories.forEach((cat) => {
        const hasMatch = products.some(
          (p) => p.brand === brand && p.category === cat.id
        );
        if (hasMatch) {
          suggestions.push({
            label: `${brand} ${cat.name}`,
            query: brand,
            categoryId: cat.id,
          });
        }
      });
    });

    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(normalizedQuery)) {
        suggestions.push({
          label: `All ${cat.name}`,
          query: '',
          categoryId: cat.id,
        });
      }
    });

    return suggestions.slice(0, 6);
  }, [normalizedQuery, products, categories]);

  if (!isSearchOpen) return null;

  const pricePresets: Array<{ id: PricePresetId; label: string }> = [
    { id: 'all', label: 'All Prices' },
    { id: 'under-500', label: `Under ${settings.currencySymbol}25,000` },
    {
      id: '500-1500',
      label: `${settings.currencySymbol}25,000 – ${settings.currencySymbol}75,000`,
    },
    {
      id: '1500-2500',
      label: `${settings.currencySymbol}75,000 – ${settings.currencySymbol}150,000`,
    },
    { id: 'over-2500', label: `${settings.currencySymbol}150,000+` },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Tech Sokoni Catalog"
      className="fixed inset-0 z-50 bg-[#F4F3EF]/98 backdrop-blur-xl overflow-y-auto"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-[#141413]/12">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#141413]" />
            <span className="text-xs font-mono-num uppercase tracking-[0.22em] text-[#6E6D68]">
              TECH SOKONI · KEYWORD, CATEGORY & PRICE SEARCH
            </span>
          </div>
          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <button
                onClick={handleResetAllFilters}
                className="flex items-center gap-1.5 text-xs font-mono-num uppercase tracking-wider text-[#D94E34] hover:opacity-80 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#141413]/15 text-xs font-mono-num uppercase tracking-[0.18em] text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors cursor-pointer"
            >
              <span>Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Keyword Search Input */}
        <div className="py-6 border-b border-[#141413]/15">
          <div className="flex items-center gap-3 sm:gap-4">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#6E6D68] shrink-0 stroke-[1.5]" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword, model, brand (HP, Apple, Dell), SKU, or spec..."
              className="w-full bg-transparent font-editorial text-xl sm:text-3xl md:text-4xl text-[#141413] placeholder:text-[#8E8D87] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 bg-[#EAE9E4] text-xs font-mono-num uppercase tracking-widest text-[#141413] hover:bg-[#141413] hover:text-[#F4F3EF] transition-colors cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Keyword Filter Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] mr-1.5">
              Keywords:
            </span>
            {KEYWORD_CHIPS.map((kw) => {
              const isSelected =
                searchQuery.trim().toLowerCase() === kw.toLowerCase();
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() =>
                    setSearchQuery(isSelected ? '' : kw)
                  }
                  className={`px-2.5 py-1 text-[11px] font-mono-num transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                      : 'bg-[#EAE9E4]/70 text-[#141413] border-[#141413]/12 hover:border-[#141413]/40'
                  }`}
                >
                  {kw}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category & Price Range Filter Bar */}
        <div className="py-5 border-b border-[#141413]/12 space-y-4">
          {/* 1. Category Filter Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
                Filter by Category
              </span>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] hover:text-[#141413] cursor-pointer"
                >
                  Show All Categories
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-mono-num uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedCategory === 'all'
                    ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                    : 'bg-[#EAE9E4]/60 text-[#5E5D59] border-[#141413]/12 hover:text-[#141413]'
                }`}
              >
                All Categories ({categoryCounts.all || 0})
              </button>
              {categories.map((cat) => {
                const count = categoryCounts[cat.id] || 0;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(active ? 'all' : cat.id)
                    }
                    className={`px-3 py-1.5 text-xs font-mono-num uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer border ${
                      active
                        ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                        : 'bg-[#EAE9E4]/60 text-[#5E5D59] border-[#141413]/12 hover:text-[#141413]'
                    }`}
                  >
                    {cat.shortLabel || cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Price Range Filter & Custom Min/Max + Sort */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end pt-1">
            {/* Price Brackets */}
            <div className="lg:col-span-6">
              <span className="block text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68] mb-2">
                Filter by Price Range
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {pricePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPricePreset(preset.id)}
                    className={`px-3 py-1.5 text-xs font-mono-num whitespace-nowrap transition-colors cursor-pointer border ${
                      pricePreset === preset.id
                        ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                        : 'bg-[#EAE9E4]/60 text-[#5E5D59] border-[#141413]/12 hover:text-[#141413]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Min / Max Price Inputs */}
            <div className="lg:col-span-4">
              <span className="block text-[10px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68] mb-2">
                Custom Price Range ({settings.currencySymbol})
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono-num text-[#6E6D68]">
                    Min
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={minPriceInput}
                    onChange={(e) => {
                      setMinPriceInput(e.target.value);
                      setPricePreset('custom');
                    }}
                    placeholder="0"
                    className="w-full bg-[#EAE9E4]/70 border border-[#141413]/15 pl-10 pr-2.5 py-1.5 text-xs font-mono-num text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono-num text-[#6E6D68]">
                    Max
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={maxPriceInput}
                    onChange={(e) => {
                      setMaxPriceInput(e.target.value);
                      setPricePreset('custom');
                    }}
                    placeholder="Any"
                    className="w-full bg-[#EAE9E4]/70 border border-[#141413]/15 pl-10 pr-2.5 py-1.5 text-xs font-mono-num text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>
              </div>
            </div>

            {/* Sort & Stock Filter */}
            <div className="lg:col-span-2 flex sm:flex-row lg:flex-col gap-2">
              <label className="flex items-center gap-2 text-xs font-mono-num text-[#141413] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-[#141413]"
                />
                <span>In Stock Only</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOptionId)}
                aria-label="Sort filtered products"
                className="w-full bg-[#EAE9E4]/70 border border-[#141413]/15 px-2.5 py-1.5 text-xs font-mono-num text-[#141413] focus:outline-none"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Split */}
        <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Live Suggestions & Department Shortcuts */}
          <div className="lg:col-span-3 space-y-4">
            <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
              {normalizedQuery ? 'Suggested Departments' : 'Quick Searches'}
            </p>
            <div className="divide-y divide-[#141413]/8 border-t border-b border-[#141413]/10">
              {liveSuggestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (item.categoryId) {
                      setSelectedCategory(item.categoryId);
                    }
                    if (item.query !== undefined) {
                      setSearchQuery(item.query);
                    }
                  }}
                  className="w-full py-3 flex items-center justify-between text-left text-xs sm:text-sm text-[#141413] hover:pl-1.5 transition-all cursor-pointer"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#6E6D68] shrink-0" />
                </button>
              ))}
            </div>

            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  navigate({ page: 'category', categoryId: selectedCategory });
                }}
                className="w-full py-2.5 px-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider flex items-center justify-between cursor-pointer"
              >
                <span>Open Full Category View</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Matching Hardware Systems */}
          <div className="lg:col-span-9 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
                {hasActiveFilters
                  ? `Filtered Hardware Systems (${matchedProducts.length})`
                  : 'Featured Showroom Systems'}
              </p>
              {hasActiveFilters && (
                <p className="text-xs font-mono-num text-[#5E5D59]">
                  {selectedCategory !== 'all' &&
                    `Category: ${
                      categories.find((c) => c.id === selectedCategory)?.name ||
                      selectedCategory
                    } · `}
                  {pricePreset !== 'all' &&
                    `Price: ${
                      effectivePriceBounds.min > 0
                        ? `${settings.currencySymbol}${effectivePriceBounds.min.toLocaleString()}`
                        : `${settings.currencySymbol}0`
                    } – ${
                      effectivePriceBounds.max < Infinity
                        ? `${settings.currencySymbol}${effectivePriceBounds.max.toLocaleString()}`
                        : 'Max'
                    }`}
                </p>
              )}
            </div>

            {matchedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchedProducts.map((product) => {
                  const pricing = getEffectivePricing(product);
                  const categoryLabel =
                    categories.find((c) => c.id === product.category)
                      ?.shortLabel || product.category;

                  return (
                    <div
                      key={product.id}
                      className="bg-[#EAE9E4]/70 hover:bg-[#EAE9E4] border border-[#141413]/12 p-4 flex items-center gap-4 text-left transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate({ page: 'product', productId: product.id });
                        }}
                        className="w-20 h-20 bg-[#F4F3EF] p-2 shrink-0 flex items-center justify-center cursor-pointer"
                      >
                        <StudioImage
                          src={product.images[0]}
                          alt={product.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain"
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68] truncate">
                          {product.brand} · {categoryLabel} · {product.sku}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSearchOpen(false);
                            navigate({ page: 'product', productId: product.id });
                          }}
                          className="text-sm font-semibold text-[#141413] hover:underline truncate block w-full text-left mt-0.5 cursor-pointer"
                        >
                          {product.name}
                        </button>
                        <p className="text-xs text-[#6E6D68] truncate mt-0.5">
                          {product.shortSpec}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-mono-num font-semibold text-[#141413]">
                              {settings.currencySymbol}
                              {pricing.finalPrice.toLocaleString()}
                            </span>
                            {pricing.hasDiscount && (
                              <span className="text-[10px] font-mono-num text-[#8E8D87] line-through">
                                {settings.currencySymbol}
                                {pricing.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(product.id, 1, true)}
                            className="px-2.5 py-1 bg-[#141413] text-[#F4F3EF] text-[10px] font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 px-4 text-center border border-[#141413]/10 bg-[#EAE9E4]/40 space-y-3">
                <p className="text-sm font-medium text-[#141413]">
                  No hardware systems matched your current keyword, category, or
                  price filters.
                </p>
                <p className="text-xs text-[#6E6D68]">
                  Try broadening your price range, switching category to &ldquo;All
                  Categories&rdquo;, or searching for &ldquo;HP&rdquo;,
                  &ldquo;MacBook&rdquo;, &ldquo;OLED&rdquo;, or &ldquo;Printer&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
