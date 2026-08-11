import { currencyForCountry } from '@/lib/currency-map';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface PriceDisplayProps {
  amountPkr: number;
  detectedCountry?: string;
}

export async function PriceDisplay({ amountPkr, detectedCountry }: PriceDisplayProps) {
  const cookieStore = await cookies();
  const overrideCurrency = cookieStore.get('display_currency')?.value;
  
  const targetCurrency = overrideCurrency || currencyForCountry(detectedCountry);

  if (targetCurrency === 'PKR') {
    return <span>Rs {amountPkr.toLocaleString()}</span>;
  }

  const supabase = await createClient();
  const { data: rate } = await supabase
    .from('exchange_rates')
    .select('rate_from_pkr')
    .eq('currency_code', targetCurrency)
    .single();

  if (!rate) {
    return <span>Rs {amountPkr.toLocaleString()}</span>; // graceful fallback if a rate is somehow missing
  }

  const converted = amountPkr * rate.rate_from_pkr;
  const formatted = new Intl.NumberFormat('en', { style: 'currency', currency: targetCurrency }).format(converted);

  return (
    <span title={`Rs ${amountPkr.toLocaleString()} PKR — you'll be charged in PKR; your bank sets the final exchange rate`}>
      <span className="text-muted-foreground text-sm mr-1">≈</span>{formatted}
    </span>
  );
}
