export const V900_ORIGINAL_PRICE = 12630.53
export const V900_SALE_PRICE = 11999
export const V900_PALLET_FORK_PRICE = 1764

export const V900_DISCOUNT_PERCENT = Math.round(
  ((V900_ORIGINAL_PRICE - V900_SALE_PRICE) / V900_ORIGINAL_PRICE) * 100
)

export const formatV900Price = (price: number) =>
  price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
