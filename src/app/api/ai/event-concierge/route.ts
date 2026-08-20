import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callOpenRouter, buildEventConciergeSystemPrompt, OpenRouterMessage } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, slug, messages } = body;

    if ((!eventId && !slug) || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request: eventId/slug and messages are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch Event Details
    let eventQuery = supabase.from('events').select('*');
    if (eventId) {
      eventQuery = eventQuery.eq('id', eventId);
    } else if (slug) {
      eventQuery = eventQuery.eq('slug', slug);
    }

    const { data: event, error: eventErr } = await eventQuery.single();
    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 2. Fetch Tickets, Speakers, Agenda, and FAQs in parallel
    const [ticketsRes, speakersRes, agendaRes, faqsRes] = await Promise.all([
      supabase.from('ticket_types').select('name, price, currency, description').eq('event_id', event.id),
      supabase.from('speakers').select('name, title, company, bio').eq('event_id', event.id),
      supabase.from('agenda_items').select('title, start_time, end_time, description').eq('event_id', event.id).order('start_time', { ascending: true }),
      supabase.from('faqs').select('question, answer').eq('event_id', event.id),
    ]);

    const systemPrompt = buildEventConciergeSystemPrompt({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      modality: event.modality,
      tickets: ticketsRes.data || [],
      speakers: speakersRes.data || [],
      agenda: agendaRes.data || [],
      faqs: faqsRes.data || [],
    });

    const conversation: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-8), // Keep context compact within token budget
    ];

    try {
      const reply = await callOpenRouter(conversation, { maxTokens: 1500, temperature: 0.6 });
      return NextResponse.json({ reply });
    } catch (aiErr: any) {
      console.warn('OpenRouter API call fallback:', aiErr.message);
      
      const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
      const tickets = ticketsRes.data || [];
      const speakers = speakersRes.data || [];
      const agenda = agendaRes.data || [];
      const faqs = faqsRes.data || [];

      let fallbackReply = '';

      // 1. Full Event Details / Overview request
      if (
        lastUserMsg.includes('detail') || 
        lastUserMsg.includes('about') || 
        lastUserMsg.includes('overview') || 
        lastUserMsg.includes('summary') || 
        lastUserMsg.includes('what is') ||
        lastUserMsg.includes('info') ||
        lastUserMsg.includes('explain')
      ) {
        const ticketSummary = tickets.length > 0
          ? tickets.map(t => `• **${t.name}**: ${t.currency || 'PKR'} ${Number(t.price).toLocaleString()}${t.description ? ` — _${t.description}_` : ''}`).join('\n')
          : `• **General Admission**: ${event.ticket_price ? `PKR ${Number(event.ticket_price).toLocaleString()}` : 'Free Entry'}`;

        fallbackReply = `Here is a summary of **${event.title}**:\n\n` +
          `📖 **About the Event**\n${event.description ? event.description.slice(0, 280) + (event.description.length > 280 ? '...' : '') : 'Join us for this premier event.'}\n\n` +
          `🗓 **Date & Time**\n• **Date**: ${event.date || 'TBA'}\n• **Time**: ${event.time || 'TBA'}\n• **Format**: ${event.modality === 'virtual' ? 'Virtual / Online Stream' : 'In-Person'}\n\n` +
          `📍 **Venue Location**\n• **${event.venue_name || 'Venue TBA'}**\n• ${event.venue_address || 'Address details provided on page'}\n\n` +
          `🎟 **Available Ticket Tiers**\n${ticketSummary}\n\n` +
          `👉 *For full speaker biographies, detailed agendas, and interactive map directions, explore the sections below on this page or click **"View & Buy Tickets"** to secure your pass!*`;
      } 
      // 2. Venue & Location
      else if (lastUserMsg.includes('where') || lastUserMsg.includes('location') || lastUserMsg.includes('venue') || lastUserMsg.includes('address') || lastUserMsg.includes('directions')) {
        fallbackReply = `**${event.title}** is taking place at:\n\n` +
          `📍 **${event.venue_name || 'Venue to be announced'}**\n` +
          `${event.venue_address ? `📌 Address: ${event.venue_address}\n\n` : '\n'}` +
          `You can view the interactive map and get turn-by-turn Google Maps directions in the **When & Where** section on this page!`;
      } 
      // 3. Date & Time
      else if (lastUserMsg.includes('when') || lastUserMsg.includes('time') || lastUserMsg.includes('date') || lastUserMsg.includes('start') || lastUserMsg.includes('schedule time')) {
        fallbackReply = `**${event.title}** schedule:\n\n` +
          `📅 **Date**: ${event.date || 'TBA'}\n` +
          `⏰ **Time**: ${event.time || 'TBA'}\n\n` +
          `You can save this date to your Google or Apple Calendar using the **Add to Calendar** button on this page.`;
      } 
      // 4. Tickets & Pricing
      else if (lastUserMsg.includes('ticket') || lastUserMsg.includes('price') || lastUserMsg.includes('cost') || lastUserMsg.includes('tier') || lastUserMsg.includes('buy') || lastUserMsg.includes('pass') || lastUserMsg.includes('fee')) {
        if (tickets.length > 0) {
          const list = tickets.map(t => `• **${t.name}**: ${t.currency || 'PKR'} ${Number(t.price).toLocaleString()}${t.description ? ` (${t.description})` : ''}`).join('\n');
          fallbackReply = `Here are the ticket options for **${event.title}**:\n\n${list}\n\nClick **"View & Buy Tickets"** below or use the "Get Tickets" button to reserve your spot!`;
        } else {
          fallbackReply = `Tickets for **${event.title}** are currently ${event.ticket_price ? `starting at **PKR ${Number(event.ticket_price).toLocaleString()}**` : '**Free Entry**'}. Click **"View & Buy Tickets"** on this page to register!`;
        }
      } 
      // 5. Speakers
      else if (lastUserMsg.includes('speaker') || lastUserMsg.includes('who is speaking') || lastUserMsg.includes('host') || lastUserMsg.includes('presenter')) {
        if (speakers.length > 0) {
          const list = speakers.map(s => `• **${s.name}**${s.title ? ` — ${s.title}` : ''}${s.company ? ` (${s.company})` : ''}`).join('\n');
          fallbackReply = `Featured speakers for **${event.title}**:\n\n${list}\n\nCheck out the full speaker section on this page for their complete bios!`;
        } else {
          fallbackReply = `Speaker announcements for **${event.title}** are coming soon. Check back on this page for the latest updates!`;
        }
      }
      // 6. Schedule / Agenda
      else if (lastUserMsg.includes('agenda') || lastUserMsg.includes('schedule') || lastUserMsg.includes('programme') || lastUserMsg.includes('sessions')) {
        if (agenda.length > 0) {
          const list = agenda.map(a => `• **${a.start_time || ''} - ${a.end_time || ''}**: ${a.title}${a.description ? ` (${a.description})` : ''}`).join('\n');
          fallbackReply = `Event Schedule for **${event.title}**:\n\n${list}\n\nSee the Agenda timeline below on this page for full session details!`;
        } else {
          fallbackReply = `The detailed schedule for **${event.title}** will be published shortly. Please check the Agenda section on this page.`;
        }
      }
      // 7. General inquiry
      else {
        fallbackReply = `For **${event.title}**, you can explore full details including available tickets, schedule, venue directions, and featured speakers directly on this page.\n\nFeel free to ask me specific questions about tickets, timings, or location!`;
      }

      return NextResponse.json({ reply: fallbackReply, fallback: true });
    }
  } catch (error: any) {
    console.error('Event Concierge API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
