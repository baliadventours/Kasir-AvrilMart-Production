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

// 🔥 Grid View Card - Clean centered typography card with hover background effect (no images)
interface ProductGridCardProps {
  product: Product;
  priceType: "retail" | "wholesale";
  onClick: (product: Product) => void;
}

export const ProductGridCard = memo(({ product, priceType, onClick }: ProductGridCardProps) => {
  const retailPrice = product.priceRetail || product.price_retail || 0;
  const wholesalePrice = product.priceWholesale || product.price_wholesale || 0;
  const displayPrice = priceType === "retail" ? retailPrice : wholesalePrice;
  const isLowStock = product.stock < 10;

  return (
    <button
      onClick={() => onClick(product)}
      className="bg-white hover:bg-[#FFF0EC] rounded-xl p-4 sm:p-5 min-h-[140px] sm:min-h-[155px] shadow-sm hover:shadow-md border border-gray-200 hover:border-[#E05D43] transition-all duration-200 text-center flex flex-col items-center justify-between active:scale-[0.97] group cursor-pointer relative overflow-hidden"
    >
      {/* Top Category Label */}
      <div className="w-full text-[11px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#E05D43] transition-colors truncate">
        {product.category || "Umum"}
      </div>

      {/* Centered Product Name & Price */}
      <div className="my-auto py-2 w-full flex flex-col items-center justify-center">
        <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-[#9E2F19] leading-snug line-clamp-2 mb-2 transition-colors">
          {product.name}
        </h3>
        <div className="text-lg sm:text-xl font-extrabold text-[#E05D43] group-hover:text-[#C54D33] tabular-nums tracking-tight transition-colors">
          Rp {displayPrice.toLocaleString("id-ID")}
        </div>
      </div>

      {/* Bottom SKU & Stock Info */}
      <div className="w-full pt-2 border-t border-gray-100 group-hover:border-[#E05D43]/25 flex items-center justify-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
        <span className="font-mono truncate max-w-[55%]">{product.sku}</span>
        <span>·</span>
        <span className={isLowStock ? "text-red-600 font-semibold" : "text-emerald-600 font-medium"}>
          Stok {product.stock}
        </span>
      </div>
    </button>
  );
});

ProductGridCard.displayName = "ProductGridCard";
