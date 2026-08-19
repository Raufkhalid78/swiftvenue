'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Ticket, ArrowRight } from 'lucide-react';
import { PriceDisplay } from '@/components/price-display';

interface StickyMobileBookingBarProps {
  lowestPrice: number;
  isFree: boolean;
  hasMultipleTiers: boolean;
  eventTitle: string;
  onBookClick?: () => void;
}

export function StickyMobileBookingBar({
  lowestPrice,
  isFree,
  hasMultipleTiers,
  onBookClick,
}: StickyMobileBookingBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar once user scrolls down 120px
      if (window.scrollY > 120) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToRegistration = () => {
    if (onBookClick) {
      onBookClick();
      return;
    }

    const regElement = document.getElementById('register-section') || document.querySelector('[data-registration-widget]');
    if (regElement) {
      regElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Trigger click on widget open button if exists
      const triggerBtn = regElement.querySelector('button');
      if (triggerBtn) {
        setTimeout(() => triggerBtn.click(), 400);
      }
    } else {
      window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background/95 backdrop-blur-lg border-t border-border p-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {isFree ? 'Admission' : hasMultipleTiers ? 'Starts From' : 'Price'}
          </span>
          <div className="text-base font-bold text-foreground flex items-center gap-1">
            {isFree ? (
              <span className="text-emerald-600 dark:text-emerald-400">Free</span>
            ) : (
              <PriceDisplay amountPkr={lowestPrice} />
            )}
          </div>
        </div>

        <Button 
          onClick={scrollToRegistration} 
          size="sm"
          className="gap-1.5 shadow-md font-semibold px-5 rounded-full"
        >
          <Ticket className="w-4 h-4" />
          {isFree ? 'Register' : 'Get Tickets'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
