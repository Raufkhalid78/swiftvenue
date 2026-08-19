import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { code, eventId, ticketTypeId, quantity = 1, orderAmount = 0 } = await request.json();

    if (!code || !eventId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    const { data: promo, error } = await service
      .from("promo_codes")
      .select("*")
      .eq("event_id", eventId)
      .ilike("code", code)
      .single();

    if (error || !promo) {
      return NextResponse.json(
        { error: "Invalid promo code" },
        { status: 404 }
      );
    }

    if (!promo.is_active) {
      return NextResponse.json(
        { error: "Promo code is no longer active" },
        { status: 400 }
      );
    }

    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return NextResponse.json(
        { error: "Promo code usage limit reached" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return NextResponse.json(
        { error: "Promo code is not valid yet" },
        { status: 400 }
      );
    }

    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return NextResponse.json(
        { error: "Promo code has expired" },
        { status: 400 }
      );
    }

    // Check tier restriction
    if (promo.applicable_ticket_type_ids && Array.isArray(promo.applicable_ticket_type_ids) && promo.applicable_ticket_type_ids.length > 0) {
      if (ticketTypeId && !promo.applicable_ticket_type_ids.includes(ticketTypeId)) {
        return NextResponse.json(
          { error: "This promo code is not valid for the selected ticket tier" },
          { status: 400 }
        );
      }
    }

    // Check min quantity requirement
    if (promo.min_quantity && quantity < promo.min_quantity) {
      return NextResponse.json(
        { error: `This promo code requires a minimum of ${promo.min_quantity} tickets` },
        { status: 400 }
      );
    }

    // Check min order amount
    if (promo.min_order_amount && orderAmount > 0 && orderAmount < Number(promo.min_order_amount)) {
      return NextResponse.json(
        { error: `This promo code requires a minimum order of Rs. ${Number(promo.min_order_amount).toLocaleString()}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      discount_type: promo.discount_type,
      discount_amount: promo.discount_amount,
    });
  } catch (error: any) {
    console.error("POST /api/promo/validate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
