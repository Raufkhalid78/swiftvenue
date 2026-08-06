import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { translateLimiter } from '@/lib/rate-limit'

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const { success } = await translateLimiter.limit(`translate_${ip}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { texts } = await request.json()

    if (!texts || typeof texts !== 'object') {
      return NextResponse.json({ error: 'texts object is required' }, { status: 400 })
    }

    try {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not configured')
      }

      const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const prompt = `You are a professional Urdu translator specializing in Pakistani wedding invitations. Translate all text values of the input JSON object to elegant, formal Urdu suitable for wedding invitations. Keep the JSON keys exactly identical. Do not translate names if they are already Urdu names (like Ahmed, Fatima, Ayesha) but write them in beautiful Urdu script. Translate addresses, timeline descriptions, welcome messages, dress codes, and blessings into high-quality, culturally appropriate Urdu.

Return ONLY a valid JSON object. Do not include markdown (do not wrap in backticks), do not include any explanatory text, just the raw JSON.

Input JSON to translate:
${JSON.stringify(texts)}`

      const { text } = await generateText({
        model: openrouter('google/gemini-2.5-flash'),
        prompt: prompt,
        maxTokens: 1500,
      })

      // Extract JSON block in case the AI wraps it in markdown or adds conversational text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanedText = jsonMatch ? jsonMatch[0] : text.replace(/```json\n?|\n?```/g, '').trim();

      let translations: Record<string, string> = {}
      try {
        translations = JSON.parse(cleanedText)
      } catch (parseErr) {
        console.warn('Failed to parse AI translation JSON:', parseErr, 'Raw text:', text)
        // Fallback gracefully if parsing fails
        translations = texts as Record<string, string>
      }

      return NextResponse.json({ translations })

    } catch (aiError) {
      console.warn('Translation service unavailable, returning originals:', (aiError as Error).message)
      return NextResponse.json({ translations: texts })
    }
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ translations: {} }, { status: 500 })
  }
}
