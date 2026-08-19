import { NextResponse } from 'next/server';

interface GenerateEventRequest {
  prompt: string;
  eventType?: string;
  modality?: string;
}

export async function POST(request: Request) {
  try {
    const body: GenerateEventRequest = await request.json();
    const { prompt, eventType = 'corporate', modality = 'in_person' } = body;

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json({ error: 'Please provide a topic or prompt for your event' }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();
    const promptLower = cleanPrompt.toLowerCase();

    // Determine category & optimal template based on keywords
    let category = eventType;
    let recommendedTemplate = 'modern';
    let themeColor = '#0f172a'; // slate

    if (promptLower.includes('hackathon') || promptLower.includes('tech') || promptLower.includes('ai') || promptLower.includes('developer') || promptLower.includes('code')) {
      category = 'corporate';
      recommendedTemplate = 'tech_summit';
      themeColor = '#06b6d4'; // cyan
    } else if (promptLower.includes('mixer') || promptLower.includes('social') || promptLower.includes('networking') || promptLower.includes('meetup') || promptLower.includes('community')) {
      category = 'social';
      recommendedTemplate = 'social_mixer';
      themeColor = '#6366f1'; // indigo
    } else if (promptLower.includes('webinar') || promptLower.includes('stream') || promptLower.includes('virtual') || promptLower.includes('online') || modality === 'virtual') {
      category = 'educational';
      recommendedTemplate = 'virtual_stream';
      themeColor = '#3b82f6'; // blue
    } else if (promptLower.includes('gala') || promptLower.includes('charity') || promptLower.includes('black tie') || promptLower.includes('dinner') || promptLower.includes('awards')) {
      category = 'cultural';
      recommendedTemplate = 'gala';
      themeColor = '#ca8a04'; // gold
    } else if (promptLower.includes('festival') || promptLower.includes('concert') || promptLower.includes('party') || promptLower.includes('music') || promptLower.includes('dj')) {
      category = 'cultural';
      recommendedTemplate = 'festival';
      themeColor = '#ec4899'; // pink
    } else if (promptLower.includes('workshop') || promptLower.includes('masterclass') || promptLower.includes('bootcamp') || promptLower.includes('training')) {
      category = 'educational';
      recommendedTemplate = 'workshop';
      themeColor = '#10b981'; // emerald
    }

    // Capitalize Title Words
    const titleWords = cleanPrompt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const title = titleWords.length > 50 ? `${titleWords.slice(0, 48)}...` : titleWords;

    // Generate Rich Description
    const description = `✨ Join us for ${title}!

Get ready for an extraordinary gathering designed to connect industry leaders, passionate creators, and innovative thinkers. Whether you're here to discover cutting-edge insights, expand your network, or experience unforgettable moments, this event has been crafted to deliver maximum value.

🎯 What to Expect:
• Keynote presentations and interactive panel discussions with top subject-matter experts.
• Hands-on networking sessions and curated breakout discussions.
• Live Q&A opportunities with speakers and industry pioneers.
• Full access to event resources, recordings, and digital attendee passes.

Reserve your ticket today to secure your spot! Early registration is highly recommended as capacity is limited.`;

    const suggestedSlug = cleanPrompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    return NextResponse.json({
      title,
      slug: suggestedSlug,
      description,
      category,
      recommendedTemplate,
      themeColor,
    });
  } catch (error: any) {
    console.error('AI event generator error:', error);
    return NextResponse.json({ error: 'Failed to generate event content' }, { status: 500 });
  }
}
