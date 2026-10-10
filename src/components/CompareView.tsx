import React from 'react';
import { ArrowLeft, ArrowLeftRight, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StudioImage } from './StudioImage';

export const CompareFloatingBar: React.FC = () => {
  const { products, compareIds, route, navigate, toggleCompare, clearCompare } =
    useStore();

  if (compareIds.length === 0 || route.page === 'compare') return null;

  const comparedProducts = products.filter((p) => compareIds.includes(p.id));
  if (comparedProducts.length === 0) return null;

  // Lift higher on product detail page on mobile so it never overlaps the sticky bottom bar
  const bottomOffsetClass =
    route.page === 'product'
      ? 'bottom-20 lg:bottom-4'
      : 'bottom-4';

  return (
    <div
      className={`fixed ${bottomOffsetClass} left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92vw] sm:w-[94vw] bg-[#141413] text-[#F4F3EF] px-4 py-3 shadow-2xl border border-[#F4F3EF]/15 flex items-center justify-between gap-3`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <ArrowLeftRight className="w-4 h-4 text-[#D94E34] shrink-0" />
        <span className="text-xs font-mono-num uppercase tracking-wider truncate">
          Compare ({comparedProducts.length}/4)
        </span>
        <div className="hidden sm:flex items-center gap-1.5">
          {comparedProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleCompare(p.id)}
              title={`Remove ${p.name}`}
              className="px-2 py-0.5 bg-[#2B2B28] text-[10px] font-mono-num truncate max-w-[110px] hover:bg-[#D94E34] transition-colors cursor-pointer"
            >
              {p.name} ×
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={clearCompare}
          className="px-2.5 py-1.5 text-[10px] font-mono-num uppercase tracking-wider text-[#A09F99] hover:text-[#F4F3EF] cursor-pointer"
        >
          Clear
        </button>
        <button
          onClick={() => navigate({ page: 'compare' })}
          className="px-4 py-1.5 bg-[#F4F3EF] text-[#141413] text-[11px] font-mono-num uppercase tracking-wider font-semibold hover:bg-[#EAE9E4] cursor-pointer whitespace-nowrap"
        >
          Compare Now
        </button>
      </div>
    </div>
  );
};

export const CompareView: React.FC = () => {
  const {
    products,
    compareIds,
    settings,
    navigate,
    addToCart,
    toggleCompare,
    clearCompare,
    getEffectivePricing,
  } = useStore();

  const comparedProducts = products.filter((p) => compareIds.includes(p.id));

  const specRows: Array<{ label: string; key: string }> = [
    { label: 'Brand', key: 'brand' },
    { label: 'Category', key: 'category' },
    { label: 'Condition', key: 'condition' },
    { label: 'Key Configuration', key: 'shortSpec' },
    { label: 'Processor / Silicon', key: 'processor' },
    { label: 'Memory (RAM)', key: 'ram' },
    { label: 'Storage Capacity', key: 'storage' },
    { label: 'Display / Screen', key: 'screenSize' },
    { label: 'Operating System', key: 'os' },
    { label: 'Graphics Engine', key: 'graphics' },
    { label: 'Connectivity / Ports', key: 'ports' },
    { label: 'Weight', key: 'weight' },
    { label: 'Warranty', key: 'warranty' },
  ];

  return (
    <div className="min-h-[80vh] max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      <div className="pb-8 border-b border-[#141413]/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68] mb-1">
            TECH SOKONI · SIDE-BY-SIDE SPECIFICATION MATRIX
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Compare Hardware Systems ({comparedProducts.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {comparedProducts.length > 0 && (
            <button
              onClick={clearCompare}
              className="px-4 py-2 border border-[#141413]/25 text-xs font-mono-num uppercase tracking-wider text-[#141413] flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
          <button
            onClick={() => navigate({ page: 'category', categoryId: 'all' })}
            className="px-4 py-2 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Add More Systems</span>
          </button>
        </div>
      </div>

      {comparedProducts.length > 0 ? (
        <div className="mt-8 overflow-x-auto border border-[#141413]/12 bg-[#F4F3EF]">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[#141413]/12 bg-[#EAE9E4]/60">
                <th className="p-4 w-48 text-xs font-mono-num uppercase tracking-wider text-[#6E6D68] align-top">
                  System Overview
                </th>
                {comparedProducts.map((prod) => {
                  const pricing = getEffectivePricing(prod);
                  return (
                    <th
                      key={prod.id}
                      className="p-4 border-l border-[#141413]/10 align-top min-w-[210px]"
                    >
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={() => toggleCompare(prod.id)}
                          aria-label="Remove from comparison"
                          className="p-1 text-[#6E6D68] hover:text-[#D94E34] cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          navigate({ page: 'product', productId: prod.id })
                        }
                        className="w-full h-36 bg-[#F4F3EF] p-4 flex items-center justify-center mb-3 cursor-pointer"
                      >
                        <StudioImage
                          src={prod.images[0]}
                          alt={prod.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain"
                        />
                      </button>
                      <p className="text-[10px] font-mono-num uppercase text-[#6E6D68]">
                        {prod.brand} · {prod.sku}
                      </p>
                      <button
                        onClick={() =>
                          navigate({ page: 'product', productId: prod.id })
                        }
                        className="text-left block mt-0.5 cursor-pointer"
                      >
                        <h3 className="text-sm font-semibold text-[#141413] hover:underline">
                          {prod.name}
                        </h3>
                      </button>
                      <div className="mt-2 flex items-baseline gap-2 font-mono-num">
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
                        onClick={() => addToCart(prod.id, 1, true)}
                        className="mt-3 w-full py-2 bg-[#141413] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141413]/10 text-xs">
              {specRows.map((row) => (
                <tr key={row.key} className="hover:bg-[#EAE9E4]/35">
                  <td className="p-4 font-mono-num text-[11px] uppercase tracking-wider text-[#6E6D68] bg-[#EAE9E4]/25">
                    {row.label}
                  </td>
                  {comparedProducts.map((prod) => {
                    const value =
                      row.key in prod
                        ? (prod as any)[row.key]
                        : prod.specs[row.key];
                    return (
                      <td
                        key={prod.id}
                        className="p-4 border-l border-[#141413]/10 text-[#141413] font-medium"
                      >
                        {value || '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <h2 className="font-editorial text-3xl text-[#141413]">
            No hardware systems selected for comparison.
          </h2>
          <p className="text-xs text-[#6E6D68] max-w-md mx-auto">
            Click &ldquo;+ Compare&rdquo; on any product card in the showroom to
            compare technical specifications side by side.
          </p>
          <button
            onClick={() => navigate({ page: 'category', categoryId: 'all' })}
            className="px-6 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest cursor-pointer"
          >
            Browse Catalog
          </button>
        </div>
      )}
    </div>
  );
};
