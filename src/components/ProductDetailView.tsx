import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { StudioImage } from './StudioImage';

interface ProductDetailViewProps {
  productId: string;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
}) => {
  const {
    products,
    categories,
    settings,
    wishlist,
    compareIds,
    navigate,
    addToCart,
    toggleWishlist,
    toggleCompare,
    setIsCheckoutOpen,
    getEffectivePricing,
    addProductReview,
  } = useStore();

  const product = products.find((p) => p.id === productId) || products[0];
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string>
  >({});
  const [activeTab, setActiveTab] = useState<
    'description' | 'specifications' | 'delivery' | 'warranty' | 'reviews'
  >('specifications');

  // Initialize default variations when product changes
  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    if (!product?.variations || product.variations.length === 0) {
      setSelectedVariations({});
      return;
    }
    const defaults: Record<string, string> = {};
    for (const group of product.variations) {
      const baseOpt =
        group.options.find((o) => o.priceDelta === 0) || group.options[0];
      if (baseOpt) {
        defaults[group.name] = baseOpt.label;
      }
    }
    setSelectedVariations(defaults);
  }, [product?.id]);

  // Review submission state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRole, setReviewRole] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  if (!product) return null;

  const pricing = getEffectivePricing(product);
  const isWishlisted = wishlist.includes(product.id);
  const categoryInfo = categories.find((c) => c.id === product.category);

  // Calculate total price delta from selected variations
  const variationPriceDelta = useMemo(() => {
    if (!product.variations) return 0;
    let delta = 0;
    for (const group of product.variations) {
      const chosenLabel = selectedVariations[group.name];
      const match = group.options.find((o) => o.label === chosenLabel);
      if (match) {
        delta += match.priceDelta;
      }
    }
    return delta;
  }, [product.variations, selectedVariations]);

  const configuredFinalPrice = Math.max(
    1,
    pricing.finalPrice + variationPriceDelta
  );
  const configuredOriginalPrice = Math.max(
    1,
    pricing.originalPrice + variationPriceDelta
  );

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const fallbackRelated =
    relatedProducts.length > 0
      ? relatedProducts
      : products.filter((p) => p.id !== product.id).slice(0, 3);

  const specEntries = Object.entries(product.specs).filter(
    ([_, val]) => Boolean(val)
  );

  const handleBuyNow = () => {
    addToCart(
      product.id,
      quantity,
      false,
      Object.keys(selectedVariations).length > 0
        ? selectedVariations
        : undefined,
      variationPriceDelta
    );
    setIsCheckoutOpen(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;
    addProductReview(product.id, {
      author: reviewAuthor.trim(),
      role: reviewRole.trim() || 'Verified Buyer',
      title: reviewTitle.trim() || 'Exceptional Hardware',
      comment: reviewComment.trim(),
      rating: reviewRating,
    });
    setReviewAuthor('');
    setReviewRole('');
    setReviewTitle('');
    setReviewComment('');
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-24">
      {/* Breadcrumb & Back Navigation */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4 sm:py-5 border-b border-[#141413]/10 flex items-center justify-between gap-4 text-xs font-mono-num text-[#6E6D68]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap min-w-0">
          <button
            onClick={() => navigate({ page: 'home' })}
            className="hover:text-[#141413] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Showroom</span>
          </button>
          <span aria-hidden="true">/</span>
          {categoryInfo && (
            <>
              <button
                onClick={() =>
                  navigate({ page: 'category', categoryId: categoryInfo.id })
                }
                className="hover:text-[#141413] transition-colors cursor-pointer shrink-0"
              >
                {categoryInfo.name}
              </button>
              <span aria-hidden="true">/</span>
            </>
          )}
          <span className="text-[#141413] truncate max-w-[160px] sm:max-w-[260px]">
            {product.name}
          </span>
        </div>

        <span className="hidden sm:inline shrink-0">SKU: {product.sku}</span>
      </div>

      {/* Main Editorial PDP Split Layout */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* LEFT: Large Product Gallery */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
            <div className="aspect-square sm:aspect-[4/3] w-full showroom-canvas border border-[#141413]/10 p-8 sm:p-14 flex items-center justify-center relative">
              <StudioImage
                src={product.images[selectedImageIdx] || product.images[0]}
                alt={product.name}
                priority
                containerClassName="w-full h-full flex items-center justify-center"
                className="w-full h-full object-contain drop-shadow-[0_24px_32px_rgba(20,20,19,0.14)]"
              />
              {pricing.hasDiscount && (
                <div className="absolute top-5 left-5 text-xs font-mono-num uppercase tracking-[0.2em] text-[#D94E34]">
                  {pricing.badgeLabel}
                </div>
              )}
            </div>

            {/* Thumbnail Strip if multiple images */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-20 bg-[#EAE9E4] p-2 border transition-colors cursor-pointer shrink-0 ${
                      selectedImageIdx === idx
                        ? 'border-[#141413]'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <StudioImage
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Contiguous Purchase & Specification Module */}
          <div className="lg:col-span-5 space-y-6">
            {/* Brand · Condition · Rating */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-num text-[#6E6D68]">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-[0.18em] text-[#141413] font-semibold">
                  {product.brand}
                </span>
                <span aria-hidden="true">·</span>
                <span>{product.condition}</span>
              </div>

              <button
                onClick={() => setActiveTab('reviews')}
                className="flex items-center gap-1 text-[#141413] hover:underline cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-[#141413]" />
                <span>{product.rating.toFixed(1)}</span>
                <span className="text-[#6E6D68]">
                  ({product.reviewCount} reviews)
                </span>
              </button>
            </div>

            {/* Product Name */}
            <h1 className="font-editorial text-3xl sm:text-5xl text-[#141413] leading-[1.08] tracking-tight">
              {product.name}
            </h1>

            {/* Price & Availability */}
            <div className="pb-6 border-b border-[#141413]/10 space-y-2">
              <div className="flex flex-wrap items-baseline gap-3 font-mono-num">
                <span className="text-2xl sm:text-3xl font-semibold text-[#141413]">
                  {settings.currencySymbol}
                  {configuredFinalPrice.toLocaleString()}
                </span>
                {pricing.hasDiscount && (
                  <>
                    <span className="text-base text-[#8E8D87] line-through">
                      {settings.currencySymbol}
                      {configuredOriginalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#D94E34] uppercase tracking-wider">
                      Save {settings.currencySymbol}
                      {pricing.discountAmount.toLocaleString()} (
                      {pricing.discountPercentage}%)
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono-num">
                {product.stock > 0 ? (
                  <span className="text-[#1F6F43] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      In Stock — {product.stock} units ready for immediate
                      dispatch
                    </span>
                  </span>
                ) : (
                  <span className="text-[#D94E34]">
                    Currently Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Short Description */}
            <p className="text-sm text-[#5E5D59] leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Interactive Product Variations Selector (Storage, RAM, Color, Screen Size, etc.) */}
            {product.variations && product.variations.length > 0 && (
              <div className="bg-[#EAE9E4]/45 border border-[#141413]/12 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono-num uppercase tracking-[0.18em] text-[#141413] font-semibold">
                    Configure System Variations
                  </p>
                  {variationPriceDelta !== 0 && (
                    <span className="text-[11px] font-mono-num text-[#1F6F43]">
                      {variationPriceDelta > 0
                        ? `+${settings.currencySymbol}${variationPriceDelta} config`
                        : `−${settings.currencySymbol}${Math.abs(
                            variationPriceDelta
                          )} config`}
                    </span>
                  )}
                </div>

                {product.variations.map((group) => {
                  const currentVal = selectedVariations[group.name];
                  return (
                    <div key={group.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono-num">
                        <span className="uppercase tracking-wider text-[#6E6D68]">
                          {group.name}
                        </span>
                        <span className="text-[#141413] font-semibold">
                          {currentVal}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((opt) => {
                          const isSelected = currentVal === opt.label;
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              onClick={() =>
                                setSelectedVariations((prev) => ({
                                  ...prev,
                                  [group.name]: opt.label,
                                }))
                              }
                              className={`px-3 py-2 text-xs font-mono-num border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#141413] text-[#F4F3EF] border-[#141413]'
                                  : 'bg-[#F4F3EF] text-[#141413] border-[#141413]/20 hover:border-[#141413]'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {opt.priceDelta !== 0 && (
                                <span
                                  className={`ml-1.5 text-[10px] ${
                                    isSelected
                                      ? 'text-[#F4F3EF]/80'
                                      : 'text-[#6E6D68]'
                                  }`}
                                >
                                  ({opt.priceDelta > 0 ? '+' : '−'}
                                  {settings.currencySymbol}
                                  {Math.abs(opt.priceDelta)})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Key Specifications Snapshot */}
            <div className="bg-[#EAE9E4]/65 border border-[#141413]/10 p-4 space-y-2.5">
              <p className="text-[11px] font-mono-num uppercase tracking-[0.18em] text-[#6E6D68]">
                Key Hardware Specifications
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {specEntries.slice(0, 6).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex flex-col border-b border-[#141413]/6 pb-1.5"
                  >
                    <span className="text-[10px] font-mono-num uppercase text-[#6E6D68]">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-[#141413] font-medium truncate">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity + Add to Cart + Buy Now + WhatsApp + Compare & Wishlist (Well-Spaced Mobile & Desktop Layout) */}
            <div className="space-y-3.5 pt-2">
              {/* Row 1: Quantity Stepper + Spacious Add to Cart */}
              <div className="flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-[#141413]/25 bg-[#F4F3EF] h-12 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-full flex items-center justify-center text-[#141413] hover:bg-[#141413]/5 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-mono-num text-xs font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stock || 10, q + 1)
                      )
                    }
                    aria-label="Increase quantity"
                    className="w-10 h-full flex items-center justify-center text-[#141413] hover:bg-[#141413]/5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart (Full remaining width — never pressed against icon buttons) */}
                <button
                  type="button"
                  onClick={() =>
                    addToCart(
                      product.id,
                      quantity,
                      true,
                      Object.keys(selectedVariations).length > 0
                        ? selectedVariations
                        : undefined,
                      variationPriceDelta
                    )
                  }
                  disabled={product.stock <= 0}
                  className="flex-1 h-12 px-5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.18em] hover:bg-[#2B2B28] disabled:opacity-40 transition-colors flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Add to Cart</span>
                </button>
              </div>

              {/* Row 2: Buy Now (Direct Express Checkout) */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="w-full h-12 border border-[#141413] text-[#141413] text-xs font-mono-num uppercase tracking-[0.18em] hover:bg-[#141413] hover:text-[#F4F3EF] disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
              >
                Buy Now — Express Checkout
              </button>

              {/* Row 3: Compare & Wishlist Side-by-Side with Clear Labels & Generous Spacing */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toggleCompare(product.id)}
                  aria-label="Compare System"
                  className={`h-11 px-4 border flex items-center justify-center gap-2 text-xs font-mono-num uppercase tracking-wider transition-colors cursor-pointer ${
                    compareIds.includes(product.id)
                      ? 'border-[#141413] bg-[#141413] text-[#F4F3EF]'
                      : 'border-[#141413]/25 bg-[#F4F3EF] text-[#141413] hover:border-[#141413]'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {compareIds.includes(product.id) ? 'Comparing' : 'Compare'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Toggle Wishlist"
                  className={`h-11 px-4 border flex items-center justify-center gap-2 text-xs font-mono-num uppercase tracking-wider transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'border-[#141413] bg-[#141413] text-[#F4F3EF]'
                      : 'border-[#141413]/25 bg-[#F4F3EF] text-[#141413] hover:border-[#141413]'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isWishlisted ? 'fill-current' : ''
                    }`}
                  />
                  <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
                </button>
              </div>

              {/* Row 4: Direct WhatsApp Order / Inquiry Button */}
              <a
                href={`https://wa.me/254792620789?text=${encodeURIComponent(
                  `Hello Tech Sokoni! I would like to order / inquire about: ${product.name} (SKU: ${product.sku}) at ${settings.currencySymbol}${configuredFinalPrice.toLocaleString()}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 bg-[#1F6F43] text-[#F4F3EF] hover:bg-[#185835] transition-colors flex items-center justify-center gap-2 text-xs font-mono-num uppercase tracking-wider px-4"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Order or Inquire on WhatsApp (+254 792 620 789)</span>
              </a>
            </div>

            {/* Authentic Tech Sokoni Showroom & Payment Guarantee Box */}
            <div className="pt-4 border-t border-[#141413]/10 text-xs text-[#5E5D59] space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#141413] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#141413]">
                    Nairobi CBD Showroom — Kenyatta Pioneer Building
                  </p>
                  <p className="text-[11px] text-[#6E6D68]">
                    Along Kenyatta Avenue, 5th Floor, Shop Number 514 (Next to
                    I&amp;M Building) · Tel: +254 792 620 789
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#141413] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#141413]">
                    Inspect First — Pay on Delivery or Lipa Na M-Pesa (Till: 9309020)
                  </p>
                  <p className="text-[11px] text-[#6E6D68]">
                    2-hour express dispatch within Nairobi &amp; 100% Free
                    Shipping nationwide across all 47 counties.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1F6F43] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#6E6D68]">
                  <strong className="text-[#141413]">Warranty:</strong>{' '}
                  {product.specs.warranty} (100% genuine factory-verified
                  hardware)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BELOW: Editorial Information Sections (Description, Specifications, Delivery, Warranty, Reviews) */}
        <div className="mt-16 sm:mt-20 pt-10 sm:pt-12 border-t border-[#141413]/12">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar border-b border-[#141413]/10 pb-4">
            {(
              [
                { id: 'specifications', label: 'Technical Specifications' },
                { id: 'description', label: 'Editorial Overview' },
                { id: 'delivery', label: 'Delivery & Payment' },
                { id: 'warranty', label: 'Warranty & Care' },
                {
                  id: 'reviews',
                  label: `Reviews (${product.reviews.length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-mono-num uppercase tracking-[0.18em] pb-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'text-[#141413] font-semibold border-b-2 border-[#141413]'
                    : 'text-[#6E6D68] hover:text-[#141413]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8 sm:py-10 max-w-4xl">
            {activeTab === 'specifications' && (
              <div className="divide-y divide-[#141413]/10 border-t border-b border-[#141413]/10">
                {specEntries.map(([key, val]) => (
                  <div
                    key={key}
                    className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-sm"
                  >
                    <span className="font-mono-num text-xs uppercase tracking-wider text-[#6E6D68]">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="sm:col-span-2 text-[#141413] font-medium break-words">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'description' && (
              <div className="space-y-4 text-base text-[#141413]/90 leading-relaxed">
                <h3 className="font-editorial text-3xl text-[#141413]">
                  Designed for sustained performance.
                </h3>
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="space-y-4 text-sm text-[#5E5D59] leading-relaxed">
                <p className="text-[#141413] font-semibold">
                  {product.deliveryInfo}
                </p>
                <p>
                  We ship nationwide across all 47 counties of Kenya with 100%
                  Free Shipping. Nairobi addresses qualify for same-day 2-hour
                  express courier delivery, or direct pickup at our Nairobi CBD
                  showroom: Kenyatta Pioneer Building, 5th Floor, Shop 514
                  (along Kenyatta Avenue, next to I&amp;M Building).
                </p>
                <p>
                  <strong>Payment on Delivery &amp; Lipa Na M-Pesa:</strong> You
                  may inspect your physical package and hardware upon arrival
                  before paying via Cash or M-Pesa (Buy Goods Till No:{' '}
                  <strong>9309020</strong>).
                </p>
              </div>
            )}

            {activeTab === 'warranty' && (
              <div className="space-y-4 text-sm text-[#5E5D59] leading-relaxed">
                <p className="text-[#141413] font-semibold">
                  {product.specs.warranty}
                </p>
                <p>
                  Every hardware system sold by Tech Sokoni is 100% genuine,
                  factory-verified, and backed by our 1-Year Local &amp;
                  Manufacturer Warranty with direct service support at Kenyatta
                  Pioneer Building, 5th Floor, Shop 514, Nairobi CBD.
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-10">
                {product.reviews.length > 0 ? (
                  <div className="divide-y divide-[#141413]/10">
                    {product.reviews.map((rev) => (
                      <div key={rev.id} className="py-6 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono-num text-[#6E6D68]">
                          <span>
                            <strong className="text-[#141413]">
                              {rev.author}
                            </strong>{' '}
                            · {rev.role}
                          </span>
                          <span>
                            {'★'.repeat(rev.rating)} · {rev.date}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-[#141413]">
                          {rev.title}
                        </h4>
                        <p className="text-sm text-[#5E5D59] leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6E6D68]">
                    No client reviews recorded yet for this configuration.
                  </p>
                )}

                {/* Add Review Form */}
                <form
                  onSubmit={handleReviewSubmit}
                  className="bg-[#EAE9E4]/65 border border-[#141413]/10 p-6 space-y-4"
                >
                  <h4 className="font-editorial text-2xl text-[#141413]">
                    Submit a Client Review
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      className="bg-[#F4F3EF] border border-[#141413]/15 px-3 py-2 text-xs text-[#141413]"
                    />
                    <input
                      type="text"
                      placeholder="Role / Studio (e.g. Lead Developer)"
                      value={reviewRole}
                      onChange={(e) => setReviewRole(e.target.value)}
                      className="bg-[#F4F3EF] border border-[#141413]/15 px-3 py-2 text-xs text-[#141413]"
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="bg-[#F4F3EF] border border-[#141413]/15 px-3 py-2 text-xs text-[#141413]"
                    >
                      <option value={5}>5 Stars — Reference Grade</option>
                      <option value={4}>4 Stars — Recommended</option>
                      <option value={3}>3 Stars — Satisfactory</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Review Headline"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-3 py-2 text-xs text-[#141413]"
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder="Share your experience with build quality, thermals, and workflow..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-[#F4F3EF] border border-[#141413]/15 px-3 py-2 text-xs text-[#141413]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest cursor-pointer"
                  >
                    Publish Review
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        <div className="mt-12 pt-12 border-t border-[#141413]/12">
          <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68] mb-2">
            COMPLEMENTARY HARDWARE
          </p>
          <h2 className="font-editorial text-3xl text-[#141413] mb-8">
            Related Systems
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {fallbackRelated.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Add-to-Cart Bar (<= 15% viewport height cap) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#F4F3EF]/95 backdrop-blur-md border-t border-[#141413]/15 px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#141413] truncate max-w-[180px]">
            {product.name}
          </p>
          <p className="text-xs font-mono-num text-[#141413]">
            {settings.currencySymbol}
            {configuredFinalPrice.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() =>
            addToCart(
              product.id,
              quantity,
              true,
              Object.keys(selectedVariations).length > 0
                ? selectedVariations
                : undefined,
              variationPriceDelta
            )
          }
          disabled={product.stock <= 0}
          className="px-5 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest cursor-pointer whitespace-nowrap"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};
