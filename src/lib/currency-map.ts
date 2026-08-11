export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  PK: 'PKR', US: 'USD', GB: 'GBP', CA: 'CAD', AE: 'AED', SA: 'SAR',
  IN: 'INR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  AU: 'AUD',
};

export function currencyForCountry(countryCode: string | null | undefined): string {
  return (countryCode && COUNTRY_TO_CURRENCY[countryCode.toUpperCase()]) || 'PKR';
}
