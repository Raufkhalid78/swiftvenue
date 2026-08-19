'use client';

import Image from 'next/image';
import { 
  Calendar, 
  Video, 
  Clock, 
  Globe, 
  Users, 
  Play, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';
import { RegistrationWidget } from '@/components/registration-widget';
import { EventCountdown } from '@/components/event-countdown';
import { AddToCalendar } from '@/components/add-to-calendar';
import { SocialShare } from '@/components/social-share';
import { SaveButton } from '@/components/save-button';
import { PublicAgenda } from '@/components/public-agenda';

export function VirtualStreamTemplate({
  event,
  ticketTypes,
  seatingLayout,
  seats,
  speakers,
  agendaItems,
  sponsors: _sponsors,
  faqs,
  gallery: _gallery,
  attendeeCount,
  lowestPrice: _lowestPrice,
  isFree: _isFree,
  priceRangeLabel: _priceRangeLabel,
}: any) {
  const platform = event.virtual_platform || 'Online Stream';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border-b border-blue-500/20 py-3 px-4 text-center">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500 text-white font-bold uppercase tracking-wider text-[10px]">
            <Video className="w-3 h-3" /> Live Broadcast
          </span>
          <span className="text-slate-300">
            Hosted via <strong className="text-white capitalize">{platform}</strong> • Full HD recording sent to all registrants
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Stream Hero Header & Teaser Player */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Copy (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                Virtual Masterclass
              </span>
              <div className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-xs">
                <EventCountdown targetDate={`${event.date}T${event.time}`} />
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-display">
              {event.title}
            </h1>

            {/* Timezone Converter Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-blue-400" /> {event.date}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-blue-400" /> {event.time || '18:00 UTC'}
                </span>
              </div>
              <div className="text-[11px] text-blue-400 flex items-center gap-1.5 pt-1 border-t border-slate-800">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>Timezone: {event.timezone || 'UTC+5 (Pakistan Standard Time)'}</span>
              </div>
            </div>

            {/* Social & Calendar Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <AddToCalendar event={event} />
              <SocialShare title={event.title} />
              <SaveButton eventId={event.id} />
            </div>
          </div>

          {/* Right Stream Video Teaser Box (6 cols) */}
          <div className="lg:col-span-6">
            <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.2)] bg-slate-900 group">
              {event.hero_image_url ? (
                <Image 
                  src={event.hero_image_url} 
                  alt={event.title} 
                  fill 
                  priority 
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-950">
                  <Video className="w-16 h-16 text-blue-500/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-white ml-1" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base drop-shadow-md">Live Stream Broadcast</h4>
                  <p className="text-xs text-slate-300">Link provided upon registration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content & RSVP Grid */}
        <div className="grid lg:grid-cols-12 gap-12 pt-6">
          {/* Left Column (7 cols): Description, Speakers, Agenda */}
          <div className="lg:col-span-7 space-y-12">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display text-white">Session Overview</h2>
              <div className="prose prose-invert prose-blue max-w-none text-slate-300 text-sm leading-relaxed">
                {event.description?.split('\n').map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            {/* Instructors / Speakers */}
            {speakers && speakers.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold font-display text-white">Session Instructors</h2>
                <div className="space-y-3">
                  {speakers.map((s: any) => (
                    <div key={s.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
                      {s.photo_url ? (
                        <Image src={s.photo_url} alt={s.name} width={56} height={56} className="w-14 h-14 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-base">{s.name}</h4>
                        <p className="text-xs text-blue-400 mt-0.5">{s.title || 'Speaker'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Agenda Timeline */}
            {agendaItems && agendaItems.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold font-display text-white">Session Agenda</h2>
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                  <PublicAgenda items={agendaItems} />
                </div>
              </section>
            )}

            {/* FAQs */}
            {faqs && faqs.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold font-display text-white">Common Questions</h2>
                <div className="space-y-3">
                  {faqs.map((f: any) => (
                    <div key={f.id} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                      <h4 className="font-bold text-blue-400 text-sm">{f.question}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (5 cols): Registration Widget */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-8 space-y-6">
              <div id="register-section" className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-blue-500/30 shadow-2xl space-y-6">
                <div className="text-center space-y-1 border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-bold font-display text-white">Reserve Stream Access</h3>
                  <p className="text-xs text-slate-400">Instant pass with calendar invite & video link</p>
                </div>

                <RegistrationWidget 
                  eventId={event.id} 
                  eventTitle={event.title} 
                  ticketTypes={ticketTypes || []} 
                  seatingLayout={seatingLayout} 
                  seats={seats} 
                />

                {attendeeCount !== null && attendeeCount >= 3 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>{attendeeCount} people registered for the stream</span>
                  </div>
                )}
              </div>

              {/* What is Included Pill */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3 text-xs">
                <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                  Registration Includes:
                </span>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Live Interactive Video Stream & Q&A
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> Downloadable Slide Decks & Notes
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" /> Full HD On-Demand Replay Recording
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
