
export interface OrderData {
  id: string;
  event_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  ticket_type_id: string;
  quantity?: number;
  platform_fee_amount?: number;
}

export function calculateAttendeesToCreate(order: OrderData) {
  const quantity = Math.max(1, order.quantity || 1);
  return Array.from({ length: quantity }).map(() => ({
    event_id: order.event_id,
    guest_name: order.guest_name,
    guest_email: order.guest_email,
    guest_phone: order.guest_phone || null,
    ticket_type_id: order.ticket_type_id,
    status: 'registered',
    order_id: order.id
  }));
}

export function calculateCommission(platformFeeAmount: number | undefined | null, commissionRate: number = 0.30): number {
  return Number(platformFeeAmount || 0) * commissionRate;
}
