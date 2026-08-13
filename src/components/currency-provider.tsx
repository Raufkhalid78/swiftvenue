'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { currencyForCountry } from '@/lib/currency-map';

type CurrencyContextType = {
  targetCurrency: string;
  exchangeRate: number;
  isHydrated: boolean;
};

const CurrencyContext = createContext<CurrencyContextType>({ targetCurrency: 'PKR', exchangeRate: 1, isHydrated: false });

export function CurrencyProvider({ children, rates }: { children: React.ReactNode, rates: Record<string, number> }) {
  const [targetCurrency, setTargetCurrency] = useState('PKR');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let displayCurrency = '';
    let country = 'PK';
    
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split('; ');
      for (const c of cookies) {
        if (c.startsWith('display_currency=')) {
          displayCurrency = c.split('=')[1];
        }
        if (c.startsWith('x-detected-country=')) {
          country = c.split('=')[1];
        }
      }
    }
    
    const finalCurrency = displayCurrency || currencyForCountry(country);
    setTargetCurrency(finalCurrency);
    
    if (finalCurrency !== 'PKR' && rates[finalCurrency]) {
      setExchangeRate(rates[finalCurrency]);
    } else {
      setExchangeRate(1);
    }
    setIsHydrated(true);
  }, [rates]);

  return (
    <CurrencyContext.Provider value={{ targetCurrency, exchangeRate, isHydrated }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
