import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Heart,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Header: React.FC = () => {
  const {
    cart,
    wishlist,
    compareIds,
    currentClient,
    route,
    navigate,
    setIsCartOpen,
    setIsSearchOpen,
  } = useStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigation
  const handleMobileNav = (action: () => void) => {
    setMobileMenuOpen(false);
    action();
  };

  const desktopLinks: Array<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = [
    {
      label: 'Shop',
      isActive: route.page === 'category' && route.categoryId === 'all',
      onClick: () => navigate({ page: 'category', categoryId: 'all' }),
    },
    {
      label: 'Laptops',
      isActive: route.page === 'category' && route.categoryId === 'laptops',
      onClick: () => navigate({ page: 'category', categoryId: 'laptops' }),
    },
    {
      label: 'Phones',
      isActive: route.page === 'category' && route.categoryId === 'phones',
      onClick: () => navigate({ page: 'category', categoryId: 'phones' }),
    },
    {
      label: 'Desktops',
      isActive: route.page === 'category' && route.categoryId === 'desktops',
      onClick: () => navigate({ page: 'category', categoryId: 'desktops' }),
    },
    {
      label: 'Printers',
      isActive: route.page === 'category' && route.categoryId === 'printers',
      onClick: () => navigate({ page: 'category', categoryId: 'printers' }),
    },
    {
      label: 'Accessories',
      isActive: route.page === 'category' && route.categoryId === 'accessories',
      onClick: () => navigate({ page: 'category', categoryId: 'accessories' }),
    },
  ];

  const mobileCategories: Array<{
    label: string;
    subtitle: string;
    onClick: () => void;
  }> = [
    {
      label: 'Shop All',
      subtitle: 'Complete curated catalog',
      onClick: () => navigate({ page: 'category', categoryId: 'all' }),
    },
    {
      label: 'Laptops',
      subtitle: 'Work. Create. Perform.',
      onClick: () => navigate({ page: 'category', categoryId: 'laptops' }),
    },
    {
      label: 'Phones',
      subtitle: 'Stay connected.',
      onClick: () => navigate({ page: 'category', categoryId: 'phones' }),
    },
    {
      label: 'Desktops',
      subtitle: 'Built for productivity.',
      onClick: () => navigate({ page: 'category', categoryId: 'desktops' }),
    },
    {
      label: 'Monitors',
      subtitle: 'See every detail.',
      onClick: () => navigate({ page: 'category', categoryId: 'monitors' }),
    },
    {
      label: 'Printers',
      subtitle: 'Print with confidence.',
      onClick: () => navigate({ page: 'category', categoryId: 'printers' }),
    },
    {
      label: 'Tablets',
      subtitle: 'Sketch. Note. Present.',
      onClick: () => navigate({ page: 'category', categoryId: 'tablets' }),
    },
    {
      label: 'Accessories',
      subtitle: 'Complete your setup.',
      onClick: () => navigate({ page: 'category', categoryId: 'accessories' }),
    },
    {
      label: 'Networking',
      subtitle: 'Multi-gigabit Wi-Fi 7 mesh.',
      onClick: () => navigate({ page: 'category', categoryId: 'networking' }),
    },
    {
      label: 'Deals',
      subtitle: 'Tech Sokoni active privileges',
      onClick: () => navigate({ page: 'deals' }),
    },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-[#F4F3EF]/92 backdrop-blur-md border-b border-[#141413]/10 shadow-[0_2px_20px_rgba(20,20,19,0.03)]'
            : 'bg-transparent border-b border-[#141413]/6'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* ZONE 1: Brand Title (Single Element Wordmark) */}
          <button
            onClick={() => navigate({ page: 'home' })}
            className="text-left text-base sm:text-lg font-semibold tracking-[0.18em] uppercase text-[#141413] hover:opacity-75 transition-opacity whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#141413]"
          >
            TECH SOKONI
          </button>

          {/* ZONE 2: Desktop Center Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[#5E5D59]"
          >
            {desktopLinks.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  item.isActive
                    ? 'text-[#141413] font-semibold'
                    : 'hover:text-[#141413]'
                }`}
              >
                {item.label}
                <span
                  className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#141413] transition-transform duration-200 origin-left ${
                    item.isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            ))}
          </nav>

          {/* ZONE 3: Desktop Right Actions & Mobile Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search catalog"
              className="flex items-center gap-1.5 px-2.5 py-2 text-[13px] font-medium text-[#141413] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              <Search className="w-4 h-4 stroke-[1.6]" />
              <span className="hidden xl:inline">Search</span>
            </button>

            {/* Compare (Desktop) */}
            {compareIds.length > 0 && (
              <button
                onClick={() => navigate({ page: 'compare' })}
                aria-label="Compare Systems"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 text-[13px] font-medium text-[#141413] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeftRight className="w-4 h-4 stroke-[1.6]" />
                <span className="font-mono-num text-[11px] text-[#D94E34]">
                  ({compareIds.length})
                </span>
              </button>
            )}

            {/* Client Account Portal (Desktop) */}
            <button
              onClick={() => navigate({ page: 'client-portal' })}
              aria-label="Client Account Portal"
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-2 text-[13px] font-medium transition-opacity cursor-pointer whitespace-nowrap shrink-0 ${
                route.page === 'client-portal'
                  ? 'text-[#D94E34] font-semibold'
                  : 'text-[#141413] hover:opacity-70'
              }`}
            >
              <User className="w-4 h-4 stroke-[1.6]" />
              <span className="hidden xl:inline">
                {currentClient ? currentClient.name.split(' ')[0] : 'Account'}
              </span>
            </button>

            {/* Wishlist (Desktop) */}
            <button
              onClick={() => navigate({ page: 'wishlist' })}
              aria-label="Wishlist"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 text-[13px] font-medium text-[#141413] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              <Heart
                className={`w-4 h-4 stroke-[1.6] ${
                  wishlist.length > 0 ? 'fill-[#141413]' : ''
                }`}
              />
              <span className="hidden xl:inline">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="font-mono-num text-[11px] text-[#6E6D68]">
                  ({wishlist.length})
                </span>
              )}
            </button>

            {/* Cart (Desktop & Mobile) */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping Cart"
              className="flex items-center gap-1.5 px-2.5 py-2 text-[13px] font-medium text-[#141413] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 stroke-[1.6]" />
              <span className="hidden xl:inline">Cart</span>
              <span className="font-mono-num text-[12px]">
                ({totalCartItems})
              </span>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden flex items-center justify-center w-10 h-10 text-[#141413] hover:bg-[#141413]/5 rounded-sm transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5 stroke-[1.6]" />
            </button>
          </div>
        </div>
      </header>

      {/* FULL-SCREEN MOBILE EDITORIAL NAVIGATION */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-50 bg-[#F4F3EF] flex flex-col justify-between overflow-y-auto animate-fadeIn"
        >
          {/* Top Bar */}
          <div className="px-4 sm:px-8 h-16 flex items-center justify-between border-b border-[#141413]/10 shrink-0">
            <button
              onClick={() => handleMobileNav(() => navigate({ page: 'home' }))}
              className="text-base font-semibold tracking-[0.18em] uppercase text-[#141413]"
            >
              TECH SOKONI
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleMobileNav(() => {
                    setIsSearchOpen(true);
                  })
                }
                aria-label="Search"
                className="w-11 h-11 flex items-center justify-center text-[#141413]"
              >
                <Search className="w-5 h-5 stroke-[1.6]" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="w-11 h-11 flex items-center justify-center text-[#141413]"
              >
                <X className="w-5 h-5 stroke-[1.6]" />
              </button>
            </div>
          </div>

          {/* Mobile Category List with generous touch targets */}
          <div className="flex-1 px-6 py-8 max-w-xl w-full mx-auto">
            <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68] mb-4">
              Showroom Departments
            </p>
            <div className="divide-y divide-[#141413]/8 border-t border-b border-[#141413]/10">
              {mobileCategories.map((cat, idx) => (
                <button
                  key={cat.label}
                  onClick={() => handleMobileNav(cat.onClick)}
                  className="w-full py-4 flex items-center justify-between text-left group active:bg-[#141413]/5 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono-num text-[11px] text-[#8E8D87]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-editorial text-3xl text-[#141413] tracking-tight">
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#6E6D68] pl-7 mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6E6D68] group-hover:text-[#141413] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              ))}
            </div>

            {/* Secondary Account, Compare & Wishlist Actions on Mobile */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={() =>
                  handleMobileNav(() => navigate({ page: 'client-portal' }))
                }
                className="min-h-[48px] px-4 py-3 bg-[#141413] text-[#F4F3EF] flex items-center justify-between text-xs font-medium uppercase tracking-wider cursor-pointer"
              >
                <span>{currentClient ? 'Client Portal' : 'Sign In / Sign Up'}</span>
                <User className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  handleMobileNav(() => navigate({ page: 'compare' }))
                }
                className="min-h-[48px] px-4 py-3 border border-[#141413]/15 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[#141413] cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Compare</span>
                </span>
                <span className="font-mono-num">({compareIds.length})</span>
              </button>
            </div>

            <a
              href="https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20would%20like%20to%20inquire%20about%20your%20products."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 min-h-[46px] px-4 py-3 bg-[#1F6F43] text-[#F4F3EF] flex items-center justify-between text-xs font-mono-num uppercase tracking-wider"
            >
              <span>WhatsApp Orders: +254 792 620 789</span>
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>

          {/* Bottom Contact Strip */}
          <div className="px-6 py-5 border-t border-[#141413]/10 text-xs text-[#6E6D68] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>
              Kenyatta Pioneer Bldg, 5th Floor, Shop 514, Kenyatta Ave, Nairobi CBD
            </span>
            <span className="font-mono-num text-[#141413]">
              Till: 9309020 · +254 792 620 789
            </span>
          </div>
        </div>
      )}
    </>
  );
};
