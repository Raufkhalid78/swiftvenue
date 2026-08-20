'use client';

import Image from 'next/image';
import { 
  Calendar, 
  MapPin, 
  Terminal, 
  Cpu, 
  Code, 
  ArrowUpRight, 
  Users, 
  Sparkles, 
  Video 
} from 'lucide-react';
import { RegistrationWidget } from '@/components/registration-widget';
import { EventCountdown } from '@/components/event-countdown';
import { AddToCalendar } from '@/components/add-to-calendar';
import { SocialShare } from '@/components/social-share';
import { SaveButton } from '@/components/save-button';
import { PublicAgenda } from '@/components/public-agenda';
import { EventWeather } from '@/components/event-weather';
import { PriceDisplay } from '@/components/price-display';

export function TechSummitTemplate({
  event,
  ticketTypes,
  seatingLayout,
  seats,
  speakers,
  agendaItems,
  sponsors,
  faqs,
  gallery,
  attendeeCount,
  lowestPrice,
  isFree,
  priceRangeLabel,
}: any) {
  return (
    <div className="bg-[#050811] text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-black font-sans">
      {/* Glow Header Background */}
      <div className="relative overflow-hidden border-b border-cyan-500/20 bg-gradient-to-b from-cyan-950/40 via-slate-950 to-[#050811]">
        {/* Subtle Cyber Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Terminal Status Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>SYS_INIT // {event.type?.toUpperCase() || 'TECH_SUMMIT'}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_35px_rgba(6,182,212,0.25)] max-w-4xl uppercase">
              {event.title}
            </h1>

            {/* Time & Venue Meta Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-mono text-slate-300">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>{event.date} {event.time && `@ ${event.time}`}</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                {event.modality === 'virtual' ? <Video className="w-4 h-4 text-cyan-400" /> : <MapPin className="w-4 h-4 text-cyan-400" />}
                <span>{event.venue_name}</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold">
                <PriceDisplay amountPkr={lowestPrice} />
              </div>
            </div>

            {/* Countdown & Social Actions */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-2 px-4 shadow-lg">
                <EventCountdown targetDate={`${event.date}T${event.time}`} />
              </div>
              <div className="flex items-center gap-2">
                <AddToCalendar event={event} />
                <SocialShare title={event.title} />
                <SaveButton eventId={event.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner Visual */}
      {event.hero_image_url && (
        <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
          <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-slate-950">
            <Image 
              src={event.hero_image_url} 
              alt={event.title} 
              fill 
              priority 
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-transparent" />
          </div>
        </div>
      )}

      {/* Main Content & Registration Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-12 gap-12">
        {/* Left Column (8 cols): Event Intel, Agenda, Speakers */}
        <div className="lg:col-span-8 space-y-16">
          {/* Overview */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest">
              <Terminal className="w-4 h-4" /> Description & Briefing
            </div>
            <h2 className="text-2xl font-bold font-mono text-white">About The Summit</h2>
            <div className="prose prose-invert prose-cyan max-w-none text-slate-300 leading-relaxed font-normal">
              {event.description?.split('\n').map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* Speakers Lineup */}
          {speakers && speakers.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest">
                <Cpu className="w-4 h-4" /> Keynote Speakers & Mentors
              </div>
              <h2 className="text-2xl font-bold font-mono text-white">Featured Engineers & Leaders</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {speakers.map((s: any) => (
                  <div key={s.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex items-center gap-4 group">
                    {s.photo_url ? (
                      <Image src={s.photo_url} alt={s.name} width={64} height={64} className="w-16 h-16 rounded-xl object-cover border border-slate-700 group-hover:border-cyan-400 transition-colors" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-cyan-400">
                        {s.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white font-mono text-base">{s.name}</h4>
                      <p className="text-xs text-cyan-400/90 font-mono mt-0.5">{s.title || 'Keynote Speaker'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Agenda & Tracks */}
          {agendaItems && agendaItems.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest">
                <Code className="w-4 h-4" /> Protocol & Schedule
              </div>
              <h2 className="text-2xl font-bold font-mono text-white">Tracks & Breakouts</h2>
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <PublicAgenda items={agendaItems} />
              </div>
            </section>
          )}

          {/* Gallery */}
          {gallery && gallery.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4" /> Visual Logs
              </div>
              <h2 className="text-2xl font-bold font-mono text-white">Past Highlights</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((g: any) => (
                  <div key={g.id} className="relative aspect-video rounded-xl overflow-hidden border border-slate-800">
                    <Image src={g.image_url} alt="Summit gallery" fill className="object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          {faqs && faqs.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-mono text-white">Frequently Answered Questions</h2>
              <div className="space-y-3">
                {faqs.map((f: any) => (
                  <div key={f.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-cyan-300 font-mono text-sm">{f.question}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (4 cols): Sticky Ticket Reservation */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-8 space-y-6">
            {/* Registration Box */}
            <div id="register-section" className="p-6 rounded-2xl bg-slate-900/90 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-bold">
                  [ ACCESS_PASS ]
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {isFree ? 'Free Pass' : `${priceRangeLabel}`}
                </span>
              </div>

              <RegistrationWidget 
                eventId={event.id} 
                eventTitle={event.title} 
                ticketTypes={ticketTypes || []} 
                seatingLayout={seatingLayout} 
                seats={seats} 
              />

              {attendeeCount !== null && attendeeCount >= 3 && (
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-400/90 pt-2 border-t border-slate-800/80">
                  <Users className="w-3.5 h-3.5" />
                  <span>{attendeeCount} engineers & hackers registered</span>
                </div>
              )}
            </div>

            {/* Venue / Location Map Box */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" /> Coordinates
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{event.venue_name}</h4>
                <p className="text-xs text-slate-400 mt-1">{event.venue_address}</p>
              </div>

              {((event.venue_lat && event.venue_lng) || event.venue_address || event.venue_name) && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-slate-800 w-full aspect-video">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venue_lat && event.venue_lng ? `${event.venue_lat},${event.venue_lng}` : `${event.venue_name || ''} ${event.venue_address || ''}`.trim())}&z=15&output=embed`}
                      className="w-full h-full grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all"
                      loading="lazy"
                      title="Summit Venue Map"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue_lat && event.venue_lng ? `${event.venue_lat},${event.venue_lng}` : `${event.venue_name || ''} ${event.venue_address || ''}`.trim())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-cyan-400 hover:underline"
                    >
                      View on Google Maps <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  {event.venue_lat && event.venue_lng && (
                    <EventWeather lat={event.venue_lat} lng={event.venue_lng} date={event.date} />
                  )}
                </div>
              )}
            </div>

            {/* Sponsors Grid */}
            {sponsors && sponsors.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Backed By Industry Partners
                </span>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {sponsors.map((s: any) => (
                    <div key={s.id} className="h-10 w-24 relative flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all">
                      <Image src={s.logo_url} alt={s.name} width={120} height={60} className="max-h-full max-w-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
