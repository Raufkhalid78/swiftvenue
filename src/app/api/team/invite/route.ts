import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, email, role } = await request.json();

    if (!eventId || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Confirm the requester owns this event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('user_id, title')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.user_id !== user.id) {
      return NextResponse.json({ error: 'Only the event owner can invite team members' }, { status: 403 });
    }

    // Look up the invitee by email
    const { data: invitee } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', email)
      .single();

    if (!invitee) {
      // No account yet — store a pending invite
      const { error: inviteError } = await supabase
        .from('event_collaborator_invites')
        .insert({ 
          event_id: eventId, 
          email, 
          role, 
          invited_by: user.id 
        });

      if (inviteError) {
        if (inviteError.code === '23505') {
          return NextResponse.json({ error: 'An invite is already pending for this email' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
      }

      // Send invite email (fire and forget, or await)
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'SwiftVenue <noreply@swiftvenue.com>', // Replace with verified domain
          to: email,
          subject: `You have been invited to collaborate on ${event.title}`,
          html: `<p>Hello!</p>
                 <p>You have been invited by ${user.email} to join the team for <strong>${event.title}</strong> on SwiftVenue.</p>
                 <p><a href="${siteUrl}/signup?redirect=/dashboard">Click here to sign up and accept the invite</a></p>`
        }).catch(console.error);
      }

      return NextResponse.json({ status: 'pending_signup', message: 'Invite sent! They need to sign up.' });
    }

    // Invitee already has an account, add them directly
    const { error: collabError } = await supabase
      .from('event_collaborators')
      .insert({ 
        event_id: eventId, 
        user_id: invitee.id, 
        role 
      });

    if (collabError) {
      if (collabError.code === '23505') {
        return NextResponse.json({ error: 'This person is already on the team' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
    }

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'SwiftVenue <noreply@swiftvenue.com>',
        to: email,
        subject: `You have been added to the team for ${event.title}`,
        html: `<p>Hello!</p>
               <p>You have been added by ${user.email} to the team for <strong>${event.title}</strong> on SwiftVenue.</p>
               <p><a href="${siteUrl}/dashboard">Click here to view your dashboard</a></p>`
      }).catch(console.error);
    }

    return NextResponse.json({ status: 'added', message: 'Team member added successfully.' });

  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
