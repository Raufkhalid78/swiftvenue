import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, socialId, promotionPlan } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!promotionPlan?.trim()) {
      return NextResponse.json({ error: 'Promotion plan description is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const service = createServiceClient()
    const { error } = await service.from('affiliate_applications').insert({
      user_id: user?.id || null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      social_id: socialId?.trim() || null,
      promotion_plan: promotionPlan.trim(),
      status: 'pending',
    })

    if (error) {
      console.error('Affiliate insert error:', error)
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('POST /api/affiliate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
