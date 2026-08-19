import { describe, it, expect } from 'vitest';
import { TEMPLATES_REGISTRY } from '../templates-registry';
import { STOCK_BANNERS } from '../stock-banners';

export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function validateEventCreation(data: {
  title: string;
  slug: string;
  modality: 'in_person' | 'virtual' | 'hybrid';
  venue_name?: string;
  virtual_stream_url?: string;
  template_id: string;
}): { valid: boolean; error?: string } {
  if (!data.title || data.title.trim().length === 0) {
    return { valid: false, error: 'Event title is required.' };
  }

  const clean = sanitizeSlug(data.slug);
  if (clean.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters.' };
  }

  if (data.modality !== 'virtual' && (!data.venue_name || data.venue_name.trim().length === 0)) {
    return { valid: false, error: 'Venue name is required for in-person or hybrid events.' };
  }

  const validTemplates = new Set(TEMPLATES_REGISTRY.map(t => t.id));
  if (!validTemplates.has(data.template_id)) {
    return { valid: false, error: `Invalid template ID: ${data.template_id}` };
  }

  return { valid: true };
}

describe('Event Creation Rules & Validation', () => {
  it('correctly sanitizes and cleans custom event slugs', () => {
    expect(sanitizeSlug('Islamabad AI Summit 2026!')).toBe('islamabad-ai-summit-2026');
    expect(sanitizeSlug('  Tech & Developer Night --- ')).toBe('tech-developer-night');
    expect(sanitizeSlug('___Web3___Hackathon___')).toBe('web3-hackathon');
  });

  it('validates required fields for in-person event', () => {
    const res = validateEventCreation({
      title: 'Global Tech Meetup',
      slug: 'global-tech-meetup',
      modality: 'in_person',
      venue_name: 'Convention Center',
      template_id: 'tech_summit',
    });
    expect(res.valid).toBe(true);
  });

  it('fails validation when in-person event is missing venue name', () => {
    const res = validateEventCreation({
      title: 'Global Tech Meetup',
      slug: 'global-tech-meetup',
      modality: 'in_person',
      venue_name: '',
      template_id: 'modern',
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Venue name is required');
  });

  it('allows virtual event without physical venue', () => {
    const res = validateEventCreation({
      title: 'Online Masterclass',
      slug: 'online-masterclass',
      modality: 'virtual',
      virtual_stream_url: 'https://zoom.us/j/123456',
      template_id: 'virtual_stream',
    });
    expect(res.valid).toBe(true);
  });

  it('verifies all 9 templates exist in the registry with valid metadata', () => {
    expect(TEMPLATES_REGISTRY.length).toBe(9);
    const ids = TEMPLATES_REGISTRY.map(t => t.id);
    expect(ids).toContain('modern');
    expect(ids).toContain('tech_summit');
    expect(ids).toContain('social_mixer');
    expect(ids).toContain('virtual_stream');
    expect(ids).toContain('minimalist');
    expect(ids).toContain('gala');
    expect(ids).toContain('festival');
    expect(ids).toContain('workshop');
    expect(ids).toContain('classic');

    TEMPLATES_REGISTRY.forEach(t => {
      expect(t.name).toBeTruthy();
      expect(t.themeColorDefault).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.description.length).toBeGreaterThan(10);
    });
  });

  it('verifies curated stock banners are properly categorized', () => {
    expect(STOCK_BANNERS.length).toBeGreaterThanOrEqual(12);
    const categories = new Set(STOCK_BANNERS.map(b => b.category));
    expect(categories.has('tech')).toBe(true);
    expect(categories.has('business')).toBe(true);
    expect(categories.has('social')).toBe(true);
    expect(categories.has('gala')).toBe(true);
    expect(categories.has('music')).toBe(true);
  });
});
