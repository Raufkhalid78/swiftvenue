import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { chatLimiter } from '@/lib/rate-limit';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
export const runtime = 'edge';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = await chatLimiter.limit(ip);
    
    if (!success) {
      return new Response('Too many requests. Please wait a moment.', { status: 429 });
    }

    const { messages } = await req.json();

    const systemPrompt = `You are the official customer support assistant for SwiftVenue, an elegant and premium event ticketing platform. Your tone should be helpful, polite, professional, and welcoming.

SwiftVenue provides a beautiful platform for event organizers to create, manage, and sell tickets for their events. 

Key Features of SwiftVenue:
- Event Creation: Organizers can create customized event pages with modern, minimalist, or classic templates.
- Ticketing & Checkout: Seamless checkout experience with Safepay integration for domestic and international payments in multiple currencies.
- Promo Codes: Organizers can create percentage or fixed-amount discount codes.
- Waitlists: When an event sells out, guests can join a waitlist.
- QR Code Check-in: Organizers can scan guest tickets at the door using our built-in QR scanner.
- Broadcast Messaging: Organizers can send mass email updates to all their attendees.
- Analytics & Dashboard: Real-time insights into ticket sales and check-ins.

If a customer asks a complex question you cannot answer, or if they explicitly ask to speak to a human, apologize and politely tell them they can reach our human support team directly at support@swiftvenuehq.com. Keep your answers reasonably concise. Never make up features or pricing that isn't listed here.`;

    const result = await streamText({
      model: openrouter('google/gemini-2.5-flash'),
      system: systemPrompt,
      messages: messages,
      maxTokens: 1500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('Error processing chat request', { status: 500 });
  }
}
