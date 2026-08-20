export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-001';
export const MAX_OPENROUTER_TOKENS = 1500;

/**
 * Calls OpenRouter chat completion API with strict 1500 token limit.
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = options.model || process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
  const maxTokens = Math.min(options.maxTokens || MAX_OPENROUTER_TOKENS, MAX_OPENROUTER_TOKENS);
  const temperature = options.temperature ?? 0.7;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://swiftvenuehq.com',
      'X-Title': 'SwiftVenue AI Assistant',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenRouter AI model');
  }

  return content.trim();
}

export interface EventContextData {
  title: string;
  description?: string | null;
  date?: string | null;
  time?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  modality?: string | null;
  tickets?: { name: string; price: number; currency: string; description?: string }[];
  speakers?: { name: string; title?: string; company?: string; bio?: string }[];
  agenda?: { title: string; start_time?: string; end_time?: string; description?: string }[];
  faqs?: { question: string; answer: string }[];
}

/**
 * Builds a grounded system prompt for attendee concierge inquiries.
 */
export function buildEventConciergeSystemPrompt(event: EventContextData): string {
  const ticketInfo = (event.tickets || [])
    .map(t => `- ${t.name}: ${t.currency} ${Number(t.price).toLocaleString()} ${t.description ? `(${t.description})` : ''}`)
    .join('\n');

  const speakerInfo = (event.speakers || [])
    .map(s => `- ${s.name}${s.title ? `, ${s.title}` : ''}${s.company ? ` at ${s.company}` : ''}${s.bio ? `: ${s.bio}` : ''}`)
    .join('\n');

  const agendaInfo = (event.agenda || [])
    .map(a => `- ${a.start_time || ''} - ${a.end_time || ''}: ${a.title} ${a.description ? `(${a.description})` : ''}`)
    .join('\n');

  const faqInfo = (event.faqs || [])
    .map(f => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n');

  return `You are the official AI Event Assistant and Concierge for "${event.title}".
Your purpose is to answer attendee questions accurately, politely, and concisely, and guide them to purchase the right ticket.

EVENT DETAILS:
- Title: ${event.title}
- Date: ${event.date || 'TBA'}
- Time: ${event.time || 'TBA'}
- Format/Modality: ${event.modality || 'In-Person'}
- Venue: ${event.venue_name || 'TBA'} (${event.venue_address || 'Address provided upon registration'})
- Overview: ${event.description || 'No additional description provided.'}

AVAILABLE TICKET TIERS:
${ticketInfo || 'General Admission'}

FEATURED SPEAKERS:
${speakerInfo || 'Speaker line-up to be announced.'}

SCHEDULE & AGENDA:
${agendaInfo || 'Full schedule to be updated shortly.'}

FREQUENTLY ASKED QUESTIONS (FAQS):
${faqInfo || 'None specified.'}

GUIDELINES:
1. DO NOT repeat greetings or introduce yourself on every reply (NEVER say "Hi there! I am the AI assistant for..."). Answer questions directly, naturally, and professionally.
2. If the user asks for details or an overview of the event, provide a well-structured summary including:
   - Key highlights & overview
   - Date, Time & Venue
   - Ticket tiers & pricing
   - And invite them to check the event page sections below for more details or click "View & Buy Tickets".
3. If asked about the venue or location, provide the exact venue name and address.
4. If asked about tickets or recommendations, break down the available ticket tiers and prices.
5. If asked about schedule or speakers, share the agenda items and speaker details.
6. Only answer questions related to this event using the context above. If unrelated, politely redirect back to "${event.title}".
7. Format responses with clean Markdown bullet points and bold highlights for excellent readability.
8. Keep responses concise and impactful under 1,500 tokens.`;
}
