import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const service = createServiceClient()

    // Query from system_stats first
    const { data, error } = await service
      .from('system_stats')
      .select('invitations_count, rsvps_count, wishes_count')
      .eq('id', 1)
      .single()

    if (error || !data) {
      console.warn('system_stats table not yet migrated, falling back to direct table counts. Error:', error?.message)
      // Fallback: Count active records directly from tables
      const [invResult, rsvpResult, wishResult] = await Promise.all([
        service.from('invitations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        service.from('rsvps').select('id', { count: 'exact', head: true }),
        service.from('wishes').select('id', { count: 'exact', head: true }),
      ])

      return NextResponse.json({
        invitations: invResult.count ?? 0,
        rsvps: rsvpResult.count ?? 0,
        wishes: wishResult.count ?? 0,
      })
    }

    return NextResponse.json({
      invitations: data.invitations_count,
      rsvps: data.rsvps_count,
      wishes: data.wishes_count,
    }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
    })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ invitations: 0, rsvps: 0, wishes: 0 })
  }
}
