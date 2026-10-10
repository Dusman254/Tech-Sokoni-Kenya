import React from 'react';
import { ArrowLeftRight, ArrowUpRight, Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { StudioImage } from './StudioImage';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'compact-list' | 'responsive';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  layout = 'responsive',
}) => {
  const {
    settings,
    wishlist,
    compareIds,
    navigate,
    addToCart,
    toggleWishlist,
    toggleCompare,
    getEffectivePricing,
  } = useStore();

  const pricing = getEffectivePricing(product);
  const isWishlisted = wishlist.includes(product.id);
  const isCompared = compareIds.includes(product.id);

  // Determine a single quiet status text indicator (Zero-Pill discipline)
  const statusLabel = pricing.hasDiscount
    ? `−${pricing.discountPercentage}%`
    : product.isNewArrival
    ? 'New'
    : product.condition !== 'New'
    ? product.condition
    : product.featured
    ? 'Featured'
    : null;

  // Horizontal layout block used on Mobile and when layout === 'compact-list'
  const renderHorizontalCard = (wrapperClass = '') => (
    <article
      className={`group bg-[#F4F3EF] border border-[#141413]/10 p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-5 transition-colors hover:border-[#141413]/30 ${wrapperClass}`}
    >
      {/* Left Thumbnail */}
      <button
        onClick={() => navigate({ page: 'product', productId: product.id })}
        className="w-24 h-24 sm:w-32 sm:h-32 bg-[#EAE9E4] shrink-0 p-2.5 flex items-center justify-center cursor-pointer relative"
      >
        <StudioImage
          src={product.images[0]}
          alt={product.name}
          containerClassName="w-full h-full"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </button>

      {/* Right Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono-num text-[#6E6D68]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="uppercase tracking-wider text-[#141413] font-semibold">
              {product.brand}
            </span>
            <span aria-hidden="true">·</span>
            <span>{product.stock > 0 ? 'In Stock' : 'Out'}</span>
            {statusLabel && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#D94E34] font-medium">{statusLabel}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => toggleCompare(product.id)}
              title="Compare Product"
              aria-label="Compare Product"
              className={`w-7 h-7 flex items-center justify-center border transition-colors cursor-pointer ${
                isCompared
                  ? 'border-[#141413] bg-[#141413] text-[#F4F3EF]'
                  : 'border-[#141413]/15 text-[#6E6D68] hover:text-[#141413]'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label="Toggle Wishlist"
              className={`w-7 h-7 flex items-center justify-center border transition-colors cursor-pointer ${
                isWishlisted
                  ? 'border-[#141413] bg-[#141413] text-[#F4F3EF]'
                  : 'border-[#141413]/15 text-[#6E6D68] hover:text-[#141413]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isWishlisted ? 'fill-current' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate({ page: 'product', productId: product.id })}
          className="mt-0.5 text-left block w-full cursor-pointer"
        >
          <h3 className="text-sm sm:text-base font-semibold text-[#141413] truncate group-hover:underline">
            {product.name}
          </h3>
        </button>

        <p className="text-[11px] text-[#6E6D68] mt-0.5 truncate">
          {product.shortSpec}
        </p>

        {product.variations && product.variations.length > 0 && (
          <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#141413]/70 mt-1 truncate">
            Options: {product.variations.map((v) => v.name).join(' · ')}
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 font-mono-num">
            <span className="text-sm sm:text-base font-semibold text-[#141413]">
              {settings.currencySymbol}
              {pricing.finalPrice.toLocaleString()}
            </span>
            {pricing.hasDiscount && (
              <span className="text-[11px] text-[#8E8D87] line-through">
                {settings.currencySymbol}
                {pricing.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product.id, 1, true)}
            disabled={product.stock <= 0}
            className="px-3 py-1.5 bg-[#141413] text-[#F4F3EF] text-[10px] sm:text-[11px] font-mono-num uppercase tracking-wider hover:bg-[#2B2B28] disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            + Add
          </button>
        </div>
      </div>
    </article>
  );

  if (layout === 'compact-list') {
    return renderHorizontalCard();
  }

  return (
    <>
      {/* On Mobile (< sm), always render sleek Horizontal Design to save vertical space */}
      {layout === 'responsive' && renderHorizontalCard('sm:hidden')}

      {/* On Tablet & Desktop (>= sm, or when layout === 'grid'), render Studio Gallery Card */}
      <article
        className={`group flex-col justify-between ${
          layout === 'responsive' ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div>
          {/* Large Studio Image Stage */}
          <div className="relative aspect-[4/3] w-full bg-[#EAE9E4] overflow-hidden mb-3.5">
            <button
              onClick={() =>
                navigate({ page: 'product', productId: product.id })
              }
              aria-label={`View ${product.name}`}
              className="w-full h-full p-6 flex items-center justify-center cursor-pointer"
            >
              <StudioImage
                src={product.images[0]}
                alt={product.name}
                containerClassName="w-full h-full flex items-center justify-center"
                className="w-full h-full object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-106"
              />
            </button>

            {/* Quiet Top Metadata Line + Compare & Wishlist Buttons */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              {statusLabel ? (
                <span className="px-2 py-0.5 bg-[#F4F3EF]/90 backdrop-blur-xs text-[10px] font-mono-num uppercase tracking-[0.16em] text-[#141413] font-medium">
                  {statusLabel}
                </span>
              ) : (
                <span />
              )}
              <div className="pointer-events-auto flex items-center gap-1.5 bg-[#F4F3EF]/85 backdrop-blur-xs px-1.5 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompare(product.id);
                  }}
                  title={isCompared ? 'Remove from compare' : 'Compare system'}
                  aria-label="Compare system"
                  className={`w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${
                    isCompared
                      ? 'bg-[#141413] text-[#F4F3EF]'
                      : 'text-[#141413]/75 hover:text-[#141413]'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 stroke-[1.6]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  aria-label={
                    isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
                  }
                  className="w-7 h-7 flex items-center justify-center text-[#141413]/75 hover:text-[#141413] transition-colors cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 stroke-[1.6] ${
                      isWishlisted ? 'fill-[#141413] text-[#141413]' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Subtle Hover Action Bar (Slides in smoothly on hover on desktop) */}
            <div className="hidden lg:flex absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[#EAE9E4] via-[#EAE9E4]/95 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 items-center justify-between gap-2">
              <button
                onClick={() =>
                  navigate({ page: 'product', productId: product.id })
                }
                className="flex-1 py-2 px-3 border border-[#141413]/25 bg-[#F4F3EF]/90 text-[#141413] text-[11px] font-mono-num uppercase tracking-[0.14em] hover:border-[#141413] transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>View</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => addToCart(product.id, 1, true)}
                disabled={product.stock <= 0}
                className="flex-1 py-2 px-3 bg-[#141413] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-[0.14em] hover:bg-[#2B2B28] disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>

          {/* Clean Unboxed Metadata Row */}
          <div className="flex items-center justify-between text-[11px] font-mono-num text-[#6E6D68]">
            <div className="flex items-center gap-1.5">
              <span className="uppercase tracking-[0.14em] text-[#141413] font-medium">
                {product.brand}
              </span>
              <span aria-hidden="true">·</span>
              <span>{product.condition}</span>
            </div>
            <span
              className={
                product.stock > 0 ? 'text-[#5E5D59]' : 'text-[#D94E34]'
              }
            >
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Product Title */}
          <button
            onClick={() => navigate({ page: 'product', productId: product.id })}
            className="mt-1 text-left block w-full cursor-pointer"
          >
            <h3 className="text-[16px] font-semibold text-[#141413] leading-snug truncate group-hover:opacity-75 transition-opacity">
              {product.name}
            </h3>
          </button>

          {/* Short Specification */}
          <p className="text-xs text-[#6E6D68] mt-1 truncate">
            {product.shortSpec}
          </p>

          {product.variations && product.variations.length > 0 && (
            <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#141413]/65 mt-1 truncate">
              Configurable: {product.variations.map((v) => v.name).join(' · ')}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 pt-2.5 border-t border-[#141413]/8 flex items-center justify-between">
          <div className="flex items-baseline gap-2 font-mono-num">
            <span className="text-[15px] font-semibold text-[#141413]">
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
            onClick={() => toggleCompare(product.id)}
            className={`text-[11px] font-mono-num uppercase tracking-wider cursor-pointer whitespace-nowrap ${
              isCompared
                ? 'text-[#D94E34] font-semibold'
                : 'text-[#6E6D68] hover:text-[#141413]'
            }`}
          >
            {isCompared ? '✓ Comparing' : '+ Compare'}
          </button>
        </div>
      </article>
    </>
  );
};
