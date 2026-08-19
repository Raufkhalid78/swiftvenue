'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPromoCode(eventId: string, data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('promo_codes')
    .insert({
      event_id: eventId,
      code: data.code.toUpperCase(),
      discount_type: data.discount_type,
      discount_amount: data.discount_amount,
      max_uses: data.max_uses || null,
      valid_from: data.valid_from || null,
      valid_until: data.valid_until || null,
      applicable_ticket_type_ids: data.applicable_ticket_type_ids?.length ? data.applicable_ticket_type_ids : null,
      min_quantity: data.min_quantity ? Number(data.min_quantity) : 1,
      min_order_amount: data.min_order_amount ? Number(data.min_order_amount) : 0,
      is_active: data.is_active ?? true
    });

  if (error) {
    if (error.code === '23505') throw new Error('Promo code already exists for this event');
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/events/${eventId}/promos`);
  return { success: true };
}

export async function deletePromoCode(eventId: string, id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', id)
    .eq('event_id', eventId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}/promos`);
  return { success: true };
}

export async function togglePromoCodeStatus(eventId: string, id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('promo_codes')
    .update({ is_active: !currentStatus })
    .eq('id', id)
    .eq('event_id', eventId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}/promos`);
  return { success: true };
}
