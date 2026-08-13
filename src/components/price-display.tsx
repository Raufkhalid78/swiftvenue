'use client';
import { useCurrency } from './currency-provider';
import { useEffect, useState } from 'react';

interface PriceDisplayProps {
  amountPkr: number;
}

export function PriceDisplay({ amountPkr }: PriceDisplayProps) {
  const { targetCurrency, exchangeRate, isHydrated } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isHydrated) {
    // Avoid hydration mismatch by rendering default PKR state initially
    return <span>Rs {amountPkr.toLocaleString()}</span>;
  }

  if (targetCurrency === 'PKR') {
    return <span>Rs {amountPkr.toLocaleString()}</span>;
  }

  const converted = amountPkr * exchangeRate;
  const formatted = new Intl.NumberFormat('en', { style: 'currency', currency: targetCurrency }).format(converted);

  return (
    <span title={`Rs ${amountPkr.toLocaleString()} PKR — you'll be charged in PKR; your bank sets the final exchange rate`}>
      <span className="text-muted-foreground text-sm mr-1">≈</span>{formatted}
    </span>
  );
}
