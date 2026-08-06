import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createServiceClient()

    // Check if user already has a referral code
    const { data: existingCode } = await service
      .from('referral_codes')
      .select('code, discount_percent, current_uses, max_uses')
      .eq('user_id', user.id)
      .single()

    if (existingCode) {
      return NextResponse.json({ referralCode: existingCode })
    }

    // Generate a new code using their first name or generic prefix + random string
    const emailPrefix = user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'USER'
    const shortPrefix = emailPrefix.slice(0, 5)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const newCode = `${shortPrefix}${randomSuffix}5` // 5% discount code

    const { data: newReferralCode, error: insertError } = await service
      .from('referral_codes')
      .insert({
        user_id: user.id,
        code: newCode,
        discount_percent: 5, // Default discount they give to friends
        max_uses: 5, // Limited sharing to create scarcity
        current_uses: 0
      })
      .select('code, discount_percent, current_uses, max_uses')
      .single()

    if (insertError || !newReferralCode) {
      console.error('Failed to create referral code:', insertError)
      return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 })
    }

    return NextResponse.json({ referralCode: newReferralCode })

  } catch (error) {
    console.error('GET /api/user/referral error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
