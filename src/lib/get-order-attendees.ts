import { SupabaseClient } from '@supabase/supabase-js';

export async function getOrderAttendees(supabase: SupabaseClient, orderId: string) {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select(`id, events (title, date, time, venue_name, venue_address)`)
    .eq('id', orderId)
    .single();

  if (orderErr || !order) throw new Error('Order not found');

  const { data: attendees, error: attErr } = await supabase
    .from('attendees')
    .select('id, guest_name, guest_email')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (attErr || !attendees || attendees.length === 0) {
    throw new Error('No attendees found for this order');
  }

  // Handle single and multiple events case gracefully depending on schema relationships
  const event = Array.isArray(order.events) ? order.events[0] : order.events;
  return { event, attendees };
}
