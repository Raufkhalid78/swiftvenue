export interface TemplateMetadata {
  id: string;
  name: string;
  category: 'business' | 'social' | 'luxury' | 'education' | 'music';
  badge?: string;
  description: string;
  recommendedFor: string;
  themeColorDefault: string;
  previewClass: string;
}

export const TEMPLATES_REGISTRY: TemplateMetadata[] = [
  {
    id: 'modern',
    name: 'Modern Sidebar',
    category: 'business',
    badge: 'Popular',
    description: 'Clean sidebar registration, gradient hero, countdown timer, and 2-column layout.',
    recommendedFor: 'Corporate Summits, Conferences, Product Launches',
    themeColorDefault: '#0f172a',
    previewClass: 'from-slate-900/80 to-indigo-950/60',
  },
  {
    id: 'tech_summit',
    name: 'Tech & Hackathon',
    category: 'business',
    badge: 'New',
    description: 'Cyberpunk dark glassmorphism, terminal track badges, tiered sponsor grid, and hacker aesthetic.',
    recommendedFor: 'DevCons, Hackathons, AI Summits, Demo Days',
    themeColorDefault: '#06b6d4',
    previewClass: 'from-cyan-950 to-slate-950',
  },
  {
    id: 'social_mixer',
    name: 'Social Mixer',
    category: 'social',
    badge: 'New',
    description: 'Luma-inspired frosted floating cards, attendee avatar clusters, and mobile-first RSVP flow.',
    recommendedFor: 'Networking Mixers, Community Meetups, Club Gatherings',
    themeColorDefault: '#6366f1',
    previewClass: 'from-indigo-900/60 via-purple-900/40 to-slate-900',
  },
  {
    id: 'virtual_stream',
    name: 'Virtual Broadcast',
    category: 'education',
    badge: 'New',
    description: '16:9 stream player countdown, dynamic timezone converter, and downloadable resource slides.',
    recommendedFor: 'Webinars, Masterclasses, AMAs, Live Stream Events',
    themeColorDefault: '#3b82f6',
    previewClass: 'from-blue-950 via-slate-900 to-indigo-950',
  },
  {
    id: 'minimalist',
    name: 'Minimalist Clean',
    category: 'social',
    description: 'Centered typography, monochrome elegance, and zero-distraction layout.',
    recommendedFor: 'Private Dinners, Salons, Author Book Launches',
    themeColorDefault: '#18181b',
    previewClass: 'from-zinc-900 to-zinc-950',
  },
  {
    id: 'gala',
    name: 'Gala & Black-Tie',
    category: 'luxury',
    badge: 'Luxury',
    description: 'Deep midnight dark theme, gold accents, formal serif typography, and reserved table seating.',
    recommendedFor: 'Charity Galas, Award Ceremonies, Black-Tie Balls',
    themeColorDefault: '#ca8a04',
    previewClass: 'from-amber-950/80 via-zinc-950 to-black',
  },
  {
    id: 'festival',
    name: 'Festival & Concert',
    category: 'music',
    badge: 'Vibrant',
    description: 'Vibrant neon gradient, tilted cards, bold high-energy typography, and photo masonry.',
    recommendedFor: 'Concerts, Music Festivals, DJ Nights, Raves',
    themeColorDefault: '#ec4899',
    previewClass: 'from-pink-600/60 via-purple-600/40 to-indigo-950',
  },
  {
    id: 'workshop',
    name: 'Workshop & Class',
    category: 'education',
    description: 'Slate background, sticky header, agenda timeline bullets, and instructor spotlight.',
    recommendedFor: 'Bootcamps, Hands-on Training, Cooking/Art Classes',
    themeColorDefault: '#10b981',
    previewClass: 'from-emerald-950/60 to-slate-900',
  },
  {
    id: 'classic',
    name: 'Classic Conference',
    category: 'business',
    description: 'Traditional wide hero banner, academic serif headers, and structured schedule table.',
    recommendedFor: 'Academic Symposiums, Annual General Meetings, Expos',
    themeColorDefault: '#1e293b',
    previewClass: 'from-slate-800 to-slate-900',
  },
];
