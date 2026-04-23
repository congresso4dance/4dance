/**
 * Centralized pricing logic for 4Dance Elite.
 * Ensures consistent progressive discounts across frontend (useCart) and backend (api/checkout).
 */

export const BASE_PHOTO_PRICE = 10.00;

export function calculateUnitPrice(count: number): number {
  if (count >= 20) return 7.00;  // 30% discount
  if (count >= 10) return 8.00;  // 20% discount
  if (count >= 5)  return 9.00;  // 10% discount
  return BASE_PHOTO_PRICE;
}

export function calculateDiscountInfo(count: number, currentTotal: number) {
  const unitPrice = calculateUnitPrice(count);
  const discountedTotal = count * unitPrice;
  const originalTotal = count * BASE_PHOTO_PRICE;
  const savings = originalTotal - discountedTotal;
  
  return {
    unitPrice,
    discountedTotal,
    originalTotal,
    savings,
    discountPercentage: Math.round(((originalTotal - discountedTotal) / originalTotal) * 100) || 0
  };
}
