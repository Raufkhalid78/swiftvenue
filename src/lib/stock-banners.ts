export interface StockBanner {
  id: string;
  category: 'tech' | 'business' | 'social' | 'gala' | 'music' | 'workshop' | 'sports';
  title: string;
  url: string;
  themeColor: string;
}

export const STOCK_BANNERS: StockBanner[] = [
  // Tech & Hackathon
  {
    id: 'tech-cyber',
    category: 'tech',
    title: 'Neon Cyber Grid',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#06b6d4',
  },
  {
    id: 'tech-developer',
    category: 'tech',
    title: 'Developer Terminal',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#10b981',
  },
  {
    id: 'tech-abstract',
    category: 'tech',
    title: 'Futuristic AI Mesh',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#6366f1',
  },

  // Business & Conferences
  {
    id: 'biz-keynote',
    category: 'business',
    title: 'Keynote Auditorium',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#0f172a',
  },
  {
    id: 'biz-modern',
    category: 'business',
    title: 'Modern Glass Architecture',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#2563eb',
  },

  // Social & Community Mixers
  {
    id: 'social-sunset',
    category: 'social',
    title: 'Rooftop Sunset Lounge',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#f97316',
  },
  {
    id: 'social-cocktails',
    category: 'social',
    title: 'Evening Cocktail Mixer',
    url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#8b5cf6',
  },
  {
    id: 'social-dinner',
    category: 'social',
    title: 'Private Garden Banquet',
    url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#059669',
  },

  // Gala & Luxury
  {
    id: 'gala-blacktie',
    category: 'gala',
    title: 'Midnight Gold Chandelier',
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#ca8a04',
  },
  {
    id: 'gala-velvet',
    category: 'gala',
    title: 'Grand Ballroom Arch',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#d97706',
  },

  // Music & Festivals
  {
    id: 'music-stage',
    category: 'music',
    title: 'Live Stage Laser Show',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#ec4899',
  },
  {
    id: 'music-crowd',
    category: 'music',
    title: 'Festival Golden Hour',
    url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#db2777',
  },

  // Workshop & Education
  {
    id: 'workshop-studio',
    category: 'workshop',
    title: 'Creative Design Studio',
    url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#0284c7',
  },
  {
    id: 'workshop-desk',
    category: 'workshop',
    title: 'Minimalist Workspace',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#475569',
  },

  // Sports & Wellness
  {
    id: 'sports-run',
    category: 'sports',
    title: 'Morning Marathon Track',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#16a34a',
  },
  {
    id: 'sports-yoga',
    category: 'sports',
    title: 'Outdoor Yoga Retreat',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#0d9488',
  },
];
