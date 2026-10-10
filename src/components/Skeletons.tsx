import React from 'react';

export const ProductCardSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3 animate-pulse">
    <div className="aspect-[4/3] w-full bg-[#E5E4DE] rounded-sm" />
    <div className="flex items-center justify-between pt-1">
      <div className="h-3 w-20 bg-[#E5E4DE] rounded-xs" />
      <div className="h-3 w-14 bg-[#E5E4DE] rounded-xs" />
    </div>
    <div className="h-5 w-3/4 bg-[#DCDAD3] rounded-xs" />
    <div className="h-3.5 w-1/2 bg-[#E5E4DE] rounded-xs" />
    <div className="h-4 w-24 bg-[#DCDAD3] rounded-xs mt-1" />
  </div>
);

export const ShowroomRailSkeleton: React.FC = () => (
  <div className="w-full min-h-[76vh] flex flex-col justify-between px-6 py-12 animate-pulse">
    <div className="max-w-xl mx-auto text-center space-y-3">
      <div className="h-3 w-28 bg-[#DCDAD3] mx-auto rounded-xs" />
      <div className="h-10 w-80 bg-[#DCDAD3] mx-auto rounded-xs" />
    </div>
    <div className="max-w-6xl mx-auto w-full my-12">
      <div className="h-3.5 w-full bg-[#D5D3CC] rounded-full mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-center">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-[#E5E4DE] rounded-sm" />
        ))}
      </div>
    </div>
    <div className="h-9 w-44 bg-[#DCDAD3] mx-auto rounded-full" />
  </div>
);

export const CategoryCatalogSkeleton: React.FC = () => (
  <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 animate-pulse">
    <div className="space-y-4 pb-10 border-b border-[#141413]/10">
      <div className="h-3 w-24 bg-[#E5E4DE]" />
      <div className="h-10 w-72 bg-[#DCDAD3]" />
      <div className="h-4 w-96 max-w-full bg-[#E5E4DE]" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const ProductDetailSkeleton: React.FC = () => (
  <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-7 aspect-square bg-[#E5E4DE] rounded-sm" />
      <div className="lg:col-span-5 space-y-5 pt-4">
        <div className="h-3 w-24 bg-[#E5E4DE]" />
        <div className="h-9 w-4/5 bg-[#DCDAD3]" />
        <div className="h-6 w-32 bg-[#DCDAD3]" />
        <div className="h-20 w-full bg-[#E5E4DE]" />
        <div className="h-12 w-full bg-[#DCDAD3]" />
      </div>
    </div>
  </div>
);
