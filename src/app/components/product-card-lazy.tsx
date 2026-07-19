import { memo } from "react";
import { Scan } from "lucide-react";
import { Product } from "../types";

// 🔥 Placeholder image as base64 SVG
const placeholderImage = "https://i.ibb.co.com/GvsmxH9Y/avrilmart-app-icon.png";

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

// 🔥 Grid View Card dengan Lazy Loading Image
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
      className="bg-white rounded-lg p-4 hover:shadow-lg hover:border-[#E05D43] transition-all text-left border border-gray-200 flex flex-col"
    >
      {/* Product Image with lazy loading */}
      <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
        <img
          src={product.image || placeholderImage}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover ${!product.image || product.image === placeholderImage || product.image.includes('unsplash.com') ? 'grayscale opacity-40' : ''}`}
        />
      </div>
      
      {/* Product Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2 truncate">
          SKU: {product.sku}
        </p>
        {product.barcode && (
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1 truncate">
            <Scan className="w-3 h-3 flex-shrink-0" />
            {product.barcode}
          </p>
        )}
        <div className={`text-xs font-medium mb-3 ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
          Stok: {product.stock}
        </div>
      </div>
      
      {/* Price & Category */}
      <div>
        <div className="text-lg font-bold text-[#E05D43] mb-1">
          Rp {displayPrice.toLocaleString("id-ID")}
        </div>
        <div className="text-xs text-gray-400 truncate">
          {product.category}
        </div>
      </div>
    </button>
  );
});

ProductGridCard.displayName = "ProductGridCard";
