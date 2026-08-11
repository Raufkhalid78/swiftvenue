'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AVAILABLE_CURRENCIES = ['PKR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'AED', 'SAR', 'INR'];

export function CurrencySwitcher({ defaultCurrency }: { defaultCurrency?: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrency] = useState('PKR');

  useEffect(() => {
    setMounted(true);
    const saved = Cookies.get('display_currency');
    if (saved) {
      setCurrency(saved);
    } else if (defaultCurrency) {
      setCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);

  if (!mounted) {
    return <div className="h-9 w-24 bg-muted animate-pulse rounded-md"></div>;
  }

  const handleValueChange = (val: string) => {
    setCurrency(val);
    Cookies.set('display_currency', val, { expires: 365, path: '/' });
    router.refresh();
  };

  return (
    <Select value={currency} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[120px] h-9 text-sm">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_CURRENCIES.map((code) => (
          <SelectItem key={code} value={code}>
            {code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
