import { memo, useState } from "react";
import { Scan, Package } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  priceType: "retail" | "wholesale";
  onClick: (product: Product) => void;
}

// 🔥 Memoized Product Card untuk prevent unnecessary re-renders
export const ProductCard = memo(({ product, priceType, onClick }: ProductCardProps) => {
  const retailPrice = product.priceRetail || product.price_retail || 0;
  const wholesalePrice = product.priceWholesale || product.price_wholesale || 0;
  const displayPrice = priceType === "retail" ? retailPrice : wholesalePrice;

  return (
    <button
      onClick={() => onClick(product)}
      className="w-full bg-white rounded-lg px-4 py-3 hover:bg-gray-50 hover:border-[#E05D43] transition-all text-left border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-semibold text-base text-gray-900 mb-1 truncate">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>SKU: {product.sku}</span>
            {product.barcode && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Scan className="w-3 h-3" />
                  {product.barcode}
                </span>
              </>
            )}
            <span>•</span>
            <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
              Stok: {product.stock}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold text-[#E05D43]">
            Rp {displayPrice.toLocaleString("id-ID")}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {product.category}
          </div>
        </div>
      </div>
    </button>
  );
});

ProductCard.displayName = "ProductCard";

// 🔥 Grid View Card - Proportional, clean, modern centered card with smooth hover effect
interface ProductGridCardProps {
  product: Product;
  priceType: "retail" | "wholesale";
  onClick: (product: Product) => void;
}

export const ProductGridCard = memo(({ product, priceType, onClick }: ProductGridCardProps) => {
  const retailPrice = product.priceRetail || product.price_retail || 0;
  const wholesalePrice = product.priceWholesale || product.price_wholesale || 0;
  const displayPrice = priceType === "retail" ? retailPrice : wholesalePrice;

  return (
    <button
      onClick={() => onClick(product)}
      className="bg-white hover:bg-[#FFF5F2] rounded-xl px-3.5 py-3.5 min-h-[98px] sm:min-h-[108px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md border border-gray-200/90 hover:border-[#E05D43]/60 transition-all duration-150 text-center flex flex-col items-center justify-center active:scale-[0.98] group cursor-pointer"
    >
      <h3 className="font-semibold text-[13px] sm:text-sm text-gray-800 group-hover:text-gray-950 leading-snug line-clamp-2 transition-colors">
        {product.name}
      </h3>
      <div className="text-sm sm:text-[15px] font-bold text-[#E05D43] group-hover:text-[#C54D33] tabular-nums tracking-tight mt-1.5 transition-colors">
        Rp {displayPrice.toLocaleString("id-ID")}
      </div>
      <div className="w-full text-[10px] font-medium text-gray-400 group-hover:text-[#E05D43]/75 tracking-wide uppercase mt-1 truncate transition-colors">
        {product.category}
      </div>
    </button>
  );
});

ProductGridCard.displayName = "ProductGridCard";
