import { Product } from "../app/types";

// Convert database product (snake_case) to frontend product (camelCase)
export function dbToFrontendProduct(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    sku: dbProduct.sku,
    barcode: dbProduct.barcode || null,
    category: dbProduct.category,
    stock: dbProduct.stock,
    image: dbProduct.image,
    // Support both naming conventions
    priceRetail: dbProduct.price_retail || dbProduct.priceRetail || 0,
    priceWholesale: dbProduct.price_wholesale || dbProduct.priceWholesale || 0,
    priceModal: dbProduct.price_modal || dbProduct.priceModal || null,
    price_retail: dbProduct.price_retail || dbProduct.priceRetail || 0,
    price_wholesale: dbProduct.price_wholesale || dbProduct.priceWholesale || 0,
    price_modal: dbProduct.price_modal || dbProduct.priceModal || null,
    created_at: dbProduct.created_at,
    updated_at: dbProduct.updated_at,
  };
}

// Convert frontend product (camelCase) to database product (snake_case)
export function frontendToDbProduct(product: Partial<Product>): any {
  const dbProduct: any = {
    name: product.name,
    sku: product.sku,
    // Send null (not empty string) for missing barcode — DB unique constraint allows multiple NULLs
    barcode: product.barcode?.trim() || null,
    category: product.category,
    stock: product.stock,
    image: product.image,
  };

  // Handle both naming conventions
  if (product.priceRetail !== undefined) {
    dbProduct.price_retail = product.priceRetail;
  }
  if (product.price_retail !== undefined) {
    dbProduct.price_retail = product.price_retail;
  }
  if (product.priceWholesale !== undefined) {
    dbProduct.price_wholesale = product.priceWholesale;
  }
  if (product.price_wholesale !== undefined) {
    dbProduct.price_wholesale = product.price_wholesale;
  }
  if (product.priceModal !== undefined) {
    dbProduct.price_modal = product.priceModal;
  }
  if (product.price_modal !== undefined) {
    dbProduct.price_modal = product.price_modal;
  }

  return dbProduct;
}