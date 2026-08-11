// Maps ISO 3166-1 alpha-2 country codes to ISO 4217 currency codes
export const countryToCurrency: Record<string, string> = {
  // North America
  US: 'USD',
  CA: 'CAD',
  
  // UK
  GB: 'GBP',
  
  // Eurozone
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR',
  FR: 'EUR', DE: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR',
  LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', NL: 'EUR',
  PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR',
  
  // Oceania
  AU: 'AUD',
  
  // Middle East
  AE: 'AED',
  SA: 'SAR',
  
  // Home
  PK: 'PKR',
};

// Supported display currencies (subset of the API response we actually want to show)
const SUPPORTED_CURRENCIES = ['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'AED', 'SAR', 'PKR'];

export function getCurrencyForCountry(countryCode: string | null): string {
  if (!countryCode) return 'PKR';
  
  const mapped = countryToCurrency[countryCode.toUpperCase()];
  if (mapped && SUPPORTED_CURRENCIES.includes(mapped)) {
    return mapped;
  }
  
  return 'PKR';
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
