import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter, OpenRouterMessage } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    // Authenticate Organizer
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, action, tone = 'exciting', customPrompt = '' } = await request.json();

    if (!eventId || !action) {
      return NextResponse.json({ error: 'eventId and action are required' }, { status: 400 });
    }

    // Verify Event Ownership
    const { data: event, error: eventErr } = await service
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 403 });
    }

    // Fetch related tickets and speakers for rich context
    const [ticketsRes, speakersRes] = await Promise.all([
      service.from('ticket_types').select('name, price, currency').eq('event_id', event.id),
      service.from('speakers').select('name, title, company').eq('event_id', event.id),
    ]);

    const ticketSummary = (ticketsRes.data || []).map(t => `${t.name} (${t.currency} ${t.price})`).join(', ');
    const speakerSummary = (speakersRes.data || []).map(s => `${s.name} (${s.title || ''})`).join(', ');

    let systemPrompt = '';
    let userInstruction = '';

    switch (action) {
      case 'generate_email':
        systemPrompt = `You are a world-class event marketing copywriter. Generate a high-converting promotional broadcast email for the event "${event.title}". Include a compelling subject line, teaser hook, key event highlights, ticket call-to-action, and signature. Tone: ${tone}. Strict max 1500 tokens.`;
        userInstruction = `Event: ${event.title}\nDate: ${event.date} at ${event.time}\nLocation: ${event.venue_name}, ${event.venue_address}\nOverview: ${event.description}\nTickets: ${ticketSummary || 'General Admission'}\n${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}`;
        break;

      case 'generate_social':
        systemPrompt = `You are an expert social media manager. Generate engaging promotional social media posts for "${event.title}". Provide 3 distinct post variations: 1 for LinkedIn (professional, thought-leadership), 1 for Instagram (visual hook, emojis), and 1 for X/Twitter (concise, high-energy thread starter). Include relevant hashtags. Strict max 1500 tokens.`;
        userInstruction = `Event: ${event.title}\nDate: ${event.date}\nLocation: ${event.venue_name}\nOverview: ${event.description}\nSpeakers: ${speakerSummary || 'Industry leaders'}\n${customPrompt ? `Additional notes: ${customPrompt}` : ''}`;
        break;

      case 'generate_faq':
        systemPrompt = `You are an event operations specialist. Generate 5 comprehensive, realistic FAQs for "${event.title}". Return the result as a JSON array of objects with keys "question" and "answer". Format strictly as valid JSON with no markdown wrapping so it can be parsed.`;
        userInstruction = `Event: ${event.title}\nCategory: ${event.type}\nFormat: ${event.modality}\nLocation: ${event.venue_name}, ${event.venue_address}\nDescription: ${event.description}\nTickets: ${ticketSummary}\n${customPrompt ? `Focus areas: ${customPrompt}` : ''}`;
        break;

      case 'generate_agenda':
        systemPrompt = `You are a master event planner. Draft a structured, engaging schedule/agenda for the event "${event.title}". Break it down into clear time blocks (Registration, Keynotes, Panels, Networking, Closing) appropriate for the event type. Strict max 1500 tokens.`;
        userInstruction = `Event: ${event.title}\nStart Time: ${event.time || '10:00 AM'}\nFormat: ${event.modality}\nDescription: ${event.description}\nSpeakers: ${speakerSummary}\n${customPrompt ? `Requirements: ${customPrompt}` : ''}`;
        break;

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInstruction },
    ];

    try {
      const generatedContent = await callOpenRouter(messages, { maxTokens: 1500, temperature: 0.7 });
      return NextResponse.json({ success: true, result: generatedContent, action });
    } catch (aiErr: any) {
      console.warn('OpenRouter API call fallback for organizer copilot:', aiErr.message);

      // Fallback templated responses if API key is not configured
      let fallbackResult = '';
      if (action === 'generate_email') {
        fallbackResult = `Subject: 🚀 You're Invited: ${event.title}\n\nHi there,\n\nWe are excited to officially invite you to ${event.title} happening on ${event.date} at ${event.venue_name}.\n\nJoin fellow creators and professionals for an unforgettable experience. Secure your tickets before spots fill up!\n\nBest regards,\n${event.title} Team`;
      } else if (action === 'generate_social') {
        fallbackResult = `📢 Big Announcement!\n\nWe're thrilled to host ${event.title} on ${event.date}.\n\n📍 ${event.venue_name}\n🎟️ Tickets now live: Reserve yours today!\n\n#Events #${event.type || 'Networking'} #SwiftVenue`;
      } else {
        fallbackResult = `Generated content outline for ${event.title} on ${event.date}.`;
      }

      return NextResponse.json({ success: true, result: fallbackResult, fallback: true, action });
    }
  } catch (error: any) {
    console.error('Organizer Co-Pilot API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
