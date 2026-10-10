import React from 'react';
import { ArrowLeft, Compass, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const NotFoundView: React.FC = () => {
  const { navigate } = useStore();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-[#EAE9E4]/60 border border-[#141413]/15 p-8 text-center space-y-6">
        <div className="w-14 h-14 bg-[#141413] text-[#F4F3EF] flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-mono-num uppercase tracking-[0.24em] text-[#6E6D68]">
            TECH SOKONI · STATUS 404
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
            System Not In Catalog
          </h1>
          <p className="text-xs text-[#5E5D59] leading-relaxed">
            The hardware configuration or page you requested does not exist in our active Nairobi inventory.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => navigate({ page: 'home' })}
            className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.18em] hover:bg-[#2B2B28] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Flagship Showroom</span>
          </button>

          <button
            onClick={() => navigate({ page: 'category', categoryId: 'laptops' })}
            className="w-full py-2.5 border border-[#141413]/25 text-[#141413] hover:border-[#141413] text-xs font-mono-num uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse Laptops Catalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
