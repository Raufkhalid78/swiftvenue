'use client';

import Image from 'next/image';
import { 
  Calendar, 
  MapPin, 
  Sparkles, 
  Heart, 
  ArrowUpRight,
} from 'lucide-react';
import { RegistrationWidget } from '@/components/registration-widget';
import { EventCountdown } from '@/components/event-countdown';
import { AddToCalendar } from '@/components/add-to-calendar';
import { SocialShare } from '@/components/social-share';
import { SaveButton } from '@/components/save-button';
import { PublicAgenda } from '@/components/public-agenda';
import { EventWeather } from '@/components/event-weather';
import { PriceDisplay } from '@/components/price-display';

export function SocialMixerTemplate({
  event,
  ticketTypes,
  seatingLayout,
  seats,
  speakers,
  agendaItems,
  sponsors: _sponsors,
  faqs: _faqs,
  gallery,
  attendeeCount,
  lowestPrice,
  isFree,
  priceRangeLabel,
}: any) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Ambient Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden pointer-events-none -z-0 opacity-40">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-indigo-600/50 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-600/40 rounded-full blur-[140px]" />
        <div className="absolute top-60 left-1/3 w-80 h-80 bg-pink-600/30 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 relative z-10 space-y-10">
        {/* Centered Hero Header Card */}
        <div className="bg-slate-900/70 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 text-center">
          {/* Category Pill & Countdown */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> {event.type || 'Social'} Gathering
            </span>
            <div className="bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50 text-xs">
              <EventCountdown targetDate={`${event.date}T${event.time}`} />
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight font-display">
            {event.title}
          </h1>

          {/* Social Proof Attendee Counter */}
          {attendeeCount !== null && attendeeCount >= 2 && (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-800/70 border border-slate-700/60 shadow-inner">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold">A</div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold">Z</div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold">R</div>
              </div>
              <span className="text-xs font-medium text-slate-300">
                <strong className="text-white font-bold">{attendeeCount} people</strong> are attending
              </span>
            </div>
          )}

          {/* Hero Banner (if uploaded) */}
          {event.hero_image_url && (
            <div className="relative aspect-[21/10] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
              <Image 
                src={event.hero_image_url} 
                alt={event.title} 
                fill 
                priority 
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover" 
              />
            </div>
          )}

          {/* Event Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Date & Time</span>
                <span className="text-xs font-bold text-white mt-0.5">{event.date}</span>
                {event.time && <span className="text-[11px] text-indigo-400">{event.time}</span>}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Location</span>
                <span className="text-xs font-bold text-white mt-0.5 line-clamp-1">{event.venue_name}</span>
                <span className="text-[11px] text-slate-400 line-clamp-1">{event.venue_address || 'City Center'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Admission</span>
                <span className="text-xs font-bold text-white mt-0.5">
                  {isFree ? 'Free RSVP' : <PriceDisplay amountPkr={lowestPrice} />}
                </span>
                <span className="text-[11px] text-slate-400">{priceRangeLabel ? 'Starting tier' : 'Verified entry'}</span>
              </div>
            </div>
          </div>

          {/* Social Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <AddToCalendar event={event} />
            <SocialShare title={event.title} />
            <SaveButton eventId={event.id} />
          </div>
        </div>

        {/* 2-Column Story & RSVP Section */}
        <div className="grid md:grid-cols-12 gap-8">
          {/* Left: About & Speakers (7 cols) */}
          <div className="md:col-span-7 space-y-8">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5">
              <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                About The Gathering
              </h2>
              <div className="prose prose-invert prose-indigo text-slate-300 text-sm leading-relaxed">
                {event.description?.split('\n').map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Host / Speakers Spotlight */}
            {speakers && speakers.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-lg font-bold text-white">Featured Hosts & Guests</h3>
                <div className="space-y-3">
                  {speakers.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                      {s.photo_url ? (
                        <Image src={s.photo_url} alt={s.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-sm">{s.name}</h4>
                        <p className="text-xs text-indigo-400">{s.title || 'Host'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda */}
            {agendaItems && agendaItems.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-lg font-bold text-white">Event Schedule</h3>
                <PublicAgenda items={agendaItems} />
              </div>
            )}

            {/* Photo Gallery */}
            {gallery && gallery.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-lg font-bold text-white">Atmosphere</h3>
                <div className="grid grid-cols-2 gap-3">
                  {gallery.map((g: any) => (
                    <div key={g.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800">
                      <Image src={g.image_url} alt="Mixer photo" fill className="object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Registration & Venue (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div id="register-section" className="bg-slate-900/80 backdrop-blur-2xl border-2 border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-bold font-display text-white">Join The Guestlist</h3>
                <p className="text-xs text-slate-400">Select your ticket tier and reserve your pass.</p>
              </div>

              <RegistrationWidget 
                eventId={event.id} 
                eventTitle={event.title} 
                ticketTypes={ticketTypes || []} 
                seatingLayout={seatingLayout} 
                seats={seats} 
              />
            </div>

            {/* Venue Box */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">Venue Details</span>
                <h4 className="font-bold text-white text-sm">{event.venue_name}</h4>
                <p className="text-xs text-slate-400">{event.venue_address}</p>
              </div>

              {((event.venue_lat && event.venue_lng) || event.venue_address || event.venue_name) && (
                <div className="space-y-3 pt-1">
                  <div className="rounded-2xl overflow-hidden border border-slate-800 w-full aspect-video">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venue_lat && event.venue_lng ? `${event.venue_lat},${event.venue_lng}` : `${event.venue_name || ''} ${event.venue_address || ''}`.trim())}&z=15&output=embed`}
                      className="w-full h-full opacity-80 hover:opacity-100 transition-opacity"
                      loading="lazy"
                      title="Mixer Venue Map"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue_lat && event.venue_lng ? `${event.venue_lat},${event.venue_lng}` : `${event.venue_name || ''} ${event.venue_address || ''}`.trim())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-indigo-400 hover:underline inline-flex items-center gap-1"
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
          </div>
        </div>
      </div>
    </div>
  );
}
