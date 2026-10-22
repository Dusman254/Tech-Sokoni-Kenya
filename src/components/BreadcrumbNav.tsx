import React, { useMemo } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CategoryId } from '../types/store';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export const BreadcrumbNav: React.FC = () => {
  const { route, navigate, categories, products } = useStore();

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = { all: 'All Hardware Systems' };
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const items: BreadcrumbItem[] = useMemo(() => {
    const list: BreadcrumbItem[] = [
      {
        label: 'Home',
        onClick: () => navigate({ page: 'home' }),
      },
    ];

    switch (route.page) {
      case 'home':
        // On home, show that we are in the main flagship showroom
        list[0].active = true;
        break;

      case 'category': {
        list.push({
          label: 'Catalog',
          onClick: () => navigate({ page: 'category', categoryId: 'all' }),
        });
        const catName = categoryNameMap[route.categoryId] || 'Category';
        list.push({
          label: catName,
          active: true,
        });
        break;
      }

      case 'deals':
        list.push({
          label: 'Catalog',
          onClick: () => navigate({ page: 'category', categoryId: 'all' }),
        });
        list.push({
          label: 'Special Deals & Allocations',
          active: true,
        });
        break;

      case 'product': {
        const prod = products.find((p) => p.id === route.productId);
        if (prod) {
          const catId = prod.category as CategoryId;
          const catName = categoryNameMap[catId] || 'Hardware';
          list.push({
            label: catName,
            onClick: () => navigate({ page: 'category', categoryId: catId }),
          });
          list.push({
            label: prod.name,
            active: true,
          });
        } else {
          list.push({
            label: 'Hardware System',
            active: true,
          });
        }
        break;
      }

      case 'client-portal': {
        list.push({
          label: 'Client Account',
          onClick: () => navigate({ page: 'client-portal', tab: 'orders' }),
        });
        const tabNames: Record<string, string> = {
          orders: 'Detailed Receipts',
          history: 'Order History',
          profile: 'Delivery Profile',
          track: 'Shipment Tracker',
        };
        const currentTab = route.tab || 'orders';
        list.push({
          label: tabNames[currentTab] || 'Portal',
          active: true,
        });
        break;
      }

      case 'track-shipment':
        list.push({
          label: 'Client Services',
          onClick: () => navigate({ page: 'client-portal' }),
        });
        list.push({
          label: route.orderId ? `Track ${route.orderId}` : 'Track Shipment',
          active: true,
        });
        break;

      case 'book-viewing': {
        list.push({
          label: 'Showroom Concierge',
          onClick: () => navigate({ page: 'home' }),
        });
        list.push({
          label: 'In-Person Laptop Viewing',
          active: true,
        });
        break;
      }

      case 'compare':
        list.push({
          label: 'Hardware Comparison',
          active: true,
        });
        break;

      case 'wishlist':
        list.push({
          label: 'Client Account',
          onClick: () => navigate({ page: 'client-portal' }),
        });
        list.push({
          label: 'Saved Wishlist',
          active: true,
        });
        break;

      case 'admin':
        list.push({
          label: 'Showroom Operations',
          active: true,
        });
        break;

      case 'info': {
        list.push({
          label: 'Showroom Details',
          onClick: () => navigate({ page: 'home' }),
        });
        const sectionTitles: Record<string, string> = {
          about: 'About Tech Sokoni',
          delivery: 'Nationwide Delivery',
          returns: 'Returns & Replacements',
          warranty: 'Hardware Warranty',
          faq: 'Frequently Asked Questions',
          contact: 'Showroom & Contact',
          privacy: 'Privacy Policy',
          terms: 'Terms of Service',
        };
        list.push({
          label: sectionTitles[route.section] || 'Information',
          active: true,
        });
        break;
      }

      default:
        list.push({
          label: 'Showroom',
          active: true,
        });
        break;
    }

    return list;
  }, [route, navigate, categoryNameMap, products]);

  // Don't render redundant lone Home crumb when user is already on the hero of home page
  if (route.page === 'home') {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="bg-[#EAE9E4]/65 border-b border-[#141413]/10 py-2.5 px-4 sm:px-8 transition-colors select-none"
    >
      <div className="max-w-[1440px] mx-auto flex items-center overflow-x-auto no-scrollbar whitespace-nowrap text-[11px] font-mono-num">
        <ol className="flex items-center gap-1.5 sm:gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;

            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5 sm:gap-2">
                {index > 0 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="w-3.5 h-3.5 text-[#8E8D87] shrink-0"
                  />
                )}

                {item.active || isLast ? (
                  <span
                    aria-current="page"
                    className="font-semibold text-[#141413] tracking-tight truncate max-w-[200px] sm:max-w-[340px]"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="text-[#6E6D68] hover:text-[#141413] transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                  >
                    {isFirst && <Home className="w-3 h-3 text-[#6E6D68]" />}
                    <span className="truncate max-w-[160px] sm:max-w-[240px]">{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
