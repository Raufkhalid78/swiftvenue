import { describe, it, expect } from 'vitest';
import { CustomQuestion } from '@/app/dashboard/events/[id]/tickets/page';

export function validateAttendeeResponses(
  questions: CustomQuestion[],
  responses: Record<string, any>
): { valid: boolean; missingQuestion?: string } {
  for (const q of questions) {
    if (q.required) {
      const val = responses[q.id];
      if (val === undefined || val === null || val === '') {
        return { valid: false, missingQuestion: q.label };
      }
    }
  }
  return { valid: true };
}

export function formatResponsesForCSV(
  attendees: Array<{ custom_responses?: Record<string, any> }>,
  customKeys: string[]
): string[][] {
  return attendees.map(att => {
    return customKeys.map(k => {
      const val = att.custom_responses?.[k];
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      return val ? String(val) : '';
    });
  });
}

describe('Custom Registration Questions & Form Builder Validation', () => {
  const sampleQuestions: CustomQuestion[] = [
    { id: 'q_tshirt', label: 'T-Shirt Size', type: 'select', options: ['S', 'M', 'L', 'XL'], required: true },
    { id: 'q_company', label: 'Company Name', type: 'text', required: true },
    { id: 'q_dietary', label: 'Dietary Restrictions', type: 'text', required: false },
    { id: 'q_terms', label: 'Agree to Code of Conduct', type: 'checkbox', required: true },
  ];

  it('fails validation when a required field is missing', () => {
    const responses = {
      q_tshirt: 'L',
      // q_company is missing
      q_terms: true,
    };

    const res = validateAttendeeResponses(sampleQuestions, responses);
    expect(res.valid).toBe(false);
    expect(res.missingQuestion).toBe('Company Name');
  });

  it('passes validation when all required fields are provided and optional field is omitted', () => {
    const responses = {
      q_tshirt: 'M',
      q_company: 'Acme Corp',
      q_terms: true,
    };

    const res = validateAttendeeResponses(sampleQuestions, responses);
    expect(res.valid).toBe(true);
  });

  it('formats custom responses accurately for CSV export with booleans converted', () => {
    const attendees = [
      {
        custom_responses: {
          q_tshirt: 'XL',
          q_company: 'Google',
          q_terms: true,
        },
      },
      {
        custom_responses: {
          q_tshirt: 'S',
          q_company: 'Vercel',
          q_terms: false,
        },
      },
    ];

    const keys = ['q_tshirt', 'q_company', 'q_terms', 'q_dietary'];
    const csvRows = formatResponsesForCSV(attendees, keys);

    expect(csvRows).toEqual([
      ['XL', 'Google', 'Yes', ''],
      ['S', 'Vercel', 'No', ''],
    ]);
  });
});
