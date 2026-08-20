import { describe, it, expect } from 'vitest';
import {
  buildEventConciergeSystemPrompt,
  MAX_OPENROUTER_TOKENS,
  DEFAULT_OPENROUTER_MODEL,
  EventContextData,
} from '@/lib/openrouter';

describe('AI Assistant & OpenRouter System Prompt Integration', () => {
  it('enforces maximum token limit of 1500', () => {
    expect(MAX_OPENROUTER_TOKENS).toBe(1500);
  });

  it('uses default OpenRouter model', () => {
    expect(DEFAULT_OPENROUTER_MODEL).toBe('google/gemini-2.0-flash-001');
  });

  it('builds a comprehensive, grounded system prompt from event data', () => {
    const mockEvent: EventContextData = {
      title: 'Islamabad Tech Summit 2027',
      description: 'The premier technology conference in the capital.',
      date: '2027-03-15',
      time: '09:00 AM',
      venue_name: 'Jinnah Convention Centre',
      venue_address: 'Club Road, Islamabad',
      modality: 'in_person',
      tickets: [
        { name: 'Early Bird Pass', price: 2500, currency: 'PKR', description: 'Access to all keynotes' },
        { name: 'VIP All-Access', price: 8000, currency: 'PKR', description: 'VIP lounge + speaker dinner' },
      ],
      speakers: [
        { name: 'Dr. Sarah Khan', title: 'VP of AI', company: 'DeepTech', bio: 'AI researcher' },
      ],
      agenda: [
        { start_time: '09:00', end_time: '10:00', title: 'Opening Keynote', description: 'Future of Agentic AI' },
      ],
      faqs: [
        { question: 'Is parking available on-site?', answer: 'Yes, free parking is available at Gate 2.' },
      ],
    };

    const prompt = buildEventConciergeSystemPrompt(mockEvent);

    expect(prompt).toContain('Islamabad Tech Summit 2027');
    expect(prompt).toContain('Jinnah Convention Centre');
    expect(prompt).toContain('Early Bird Pass: PKR 2,500');
    expect(prompt).toContain('VIP All-Access: PKR 8,000');
    expect(prompt).toContain('Dr. Sarah Khan, VP of AI at DeepTech');
    expect(prompt).toContain('09:00 - 10:00: Opening Keynote');
    expect(prompt).toContain('Is parking available on-site?');
    expect(prompt).toContain('1,500 tokens');
  });

  it('gracefully handles missing optional fields in event context', () => {
    const minimalEvent: EventContextData = {
      title: 'Community Meetup',
    };

    const prompt = buildEventConciergeSystemPrompt(minimalEvent);

    expect(prompt).toContain('Community Meetup');
    expect(prompt).toContain('TBA');
    expect(prompt).toContain('General Admission');
  });
});
