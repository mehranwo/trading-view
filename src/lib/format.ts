export function formatPrice(price: number, decimals: number = 2): string {
  return price.toFixed(decimals);
}

export function formatSize(size: number): string {
  if (size >= 1000) {
    return (size / 1000).toFixed(3) + 'K';
  }
  return size.toFixed(4);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

