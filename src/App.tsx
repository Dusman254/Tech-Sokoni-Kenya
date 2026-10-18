/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFoundView } from './components/NotFoundView';
import { Header } from './components/Header';
import { ShowroomStage } from './components/ShowroomStage';
import { HomeEditorialSections } from './components/HomeEditorialSections';
import { CategoryView } from './components/CategoryView';
import { ProductDetailView } from './components/ProductDetailView';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientPortalView } from './components/ClientPortalView';
import { TrackShipmentView } from './components/TrackShipmentView';
import { CompareFloatingBar, CompareView } from './components/CompareView';
import { SearchOverlay } from './components/SearchOverlay';
import { CartAndCheckout } from './components/CartAndCheckout';
import { BookViewingModal } from './components/BookViewingModal';
import {
  Footer,
  InfoSectionView,
  WishlistView,
} from './components/FooterAndSecondaryViews';
import {
  CategoryCatalogSkeleton,
  ProductDetailSkeleton,
  ShowroomRailSkeleton,
} from './components/Skeletons';

const StorefrontRouter: React.FC = () => {
  const { route, isRouteLoading, toastMessage, compareIds } = useStore();
  const hasCompareBar = compareIds.length > 0 && route.page !== 'compare';
  const whatsappBottomClass =
    route.page === 'product'
      ? hasCompareBar
        ? 'bottom-36 lg:bottom-20'
        : 'bottom-20 lg:bottom-6'
      : hasCompareBar
      ? 'bottom-20 sm:bottom-20'
      : 'bottom-5 sm:bottom-6';

  const routeKey =
    route.page === 'category'
      ? `cat-${route.categoryId}`
      : route.page === 'product'
      ? `prod-${route.productId}`
      : route.page === 'info'
      ? `info-${route.section}`
      : route.page;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F3EF] text-[#141413]">
      <Header />

      <main className="flex-1">
        {isRouteLoading ? (
          route.page === 'home' ? (
            <ShowroomRailSkeleton />
          ) : route.page === 'product' ? (
            <ProductDetailSkeleton />
          ) : (
            <CategoryCatalogSkeleton />
          )
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={routeKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {route.page === 'home' && (
                <>
                  <ShowroomStage />
                  <HomeEditorialSections />
                </>
              )}

              {route.page === 'category' && (
                <CategoryView categoryId={route.categoryId} />
              )}

              {route.page === 'deals' && (
                <CategoryView categoryId="all" dealsOnly />
              )}

              {route.page === 'product' && (
                <ProductDetailView productId={route.productId} />
              )}

              {route.page === 'client-portal' && <ClientPortalView />}

              {route.page === 'track-shipment' && (
                <TrackShipmentView initialOrderId={route.orderId} />
              )}

              {route.page === 'compare' && <CompareView />}

              {route.page === 'wishlist' && <WishlistView />}

              {route.page === 'admin' && <AdminDashboard />}

              {route.page === 'info' && (
                <InfoSectionView section={route.section} />
              )}

              {route.page === 'book-viewing' && (
                <BookViewingModal standalonePage />
              )}

              {/* 404 Route Fallback */}
              {![
                'home',
                'category',
                'deals',
                'product',
                'client-portal',
                'track-shipment',
                'book-viewing',
                'compare',
                'wishlist',
                'admin',
                'info',
              ].includes(route.page) && <NotFoundView />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <Footer />
      <CompareFloatingBar />
      <SearchOverlay />
      <CartAndCheckout />

      {/* Floating WhatsApp Concierge Button (+254 792 620 789) — Positioned cleanly above mobile bottom bars */}
      {route.page !== 'admin' && (
        <a
          href="https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20would%20like%20to%20inquire%20about%20an%20order%20or%20product."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Tech Sokoni on WhatsApp (+254 792 620 789)"
          className={`fixed right-4 sm:right-6 z-30 bg-[#1F6F43] text-[#F4F3EF] hover:bg-[#185835] shadow-lg border border-[#F4F3EF]/20 px-3.5 py-2.5 flex items-center gap-2 transition-all duration-200 ${whatsappBottomClass}`}
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span className="text-[11px] font-mono-num uppercase tracking-wider font-medium">
            WhatsApp
          </span>
        </a>
      )}

      {/* Quiet Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-6 z-50 px-4 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider shadow-lg border border-[#F4F3EF]/15"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <StorefrontRouter />
      </StoreProvider>
    </ErrorBoundary>
  );
}
