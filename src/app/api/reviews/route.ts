import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // Fetch approved reviews
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        rating,
        message,
        template_name,
        created_at,
        invitations!inner(
          partner1_name,
          partner2_name,
          venue
        )
      `)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { invitation_id, rating, message, template_name } = body;

    if (!invitation_id || !rating || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify the user actually owns this invitation before letting them review it
    const { data: inv } = await supabaseServer
      .from('invitations')
      .select('user_id')
      .eq('id', invitation_id)
      .single();

    if (!inv || inv.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        invitation_id,
        user_id: user.id,
        rating,
        message,
        template_name,
        is_approved: false
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'You have already submitted a review for this invitation.' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, review: data });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
