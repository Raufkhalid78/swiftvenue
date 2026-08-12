import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RegistrationWidget } from "@/components/registration-widget";
import { headers } from "next/headers";
import { currencyForCountry } from "@/lib/currency-map";

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const headersList = await headers();
  const detectedCountry = headersList.get('x-detected-country') || 'PK';
  
  const service = createServiceClient();

  const targetCurrency = currencyForCountry(detectedCountry);
  let exchangeRate = 1;
  if (targetCurrency !== 'PKR') {
    const { data: rate } = await service.from('exchange_rates').select('rate_from_pkr').eq('currency_code', targetCurrency).single();
    if (rate) exchangeRate = rate.rate_from_pkr;
  }

  const { data: event, error } = await service
    .from("events")
    .select("id, title, status, ticket_price")
    .eq("slug", slug)
    .single();

  if (error || !event || event.status !== "published") {
    notFound();
  }

  let { data: ticketTypes } = await service
    .from("ticket_types")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (!ticketTypes || ticketTypes.length === 0) {
    ticketTypes = [{
      id: "fallback",
      event_id: event.id,
      name: "General Admission",
      price: event.ticket_price || 0,
      currency: "PKR",
      quantity_total: 1000,
      quantity_sold: 0,
      is_active: true
    }] as any;
  }

  // Seating Layout
  let seatingLayout = null;
  let seats: any[] = [];
  const { data: sl } = await service.from('seating_layouts').select('id, layout_data_json').eq('event_id', event.id).single();
  if (sl) {
    seatingLayout = sl.layout_data_json;
    const { data: s } = await service.from('seats').select('*').eq('layout_id', sl.id);
    seats = s || [];
  }

  return (
    <div className="w-full bg-transparent p-1 font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        body { background: transparent !important; }
      `}} />
      <RegistrationWidget 
        eventId={event.id} 
        eventTitle={event.title} 
        ticketTypes={ticketTypes || []} 
        targetCurrency={targetCurrency} 
        exchangeRate={exchangeRate} 
        seatingLayout={seatingLayout}
        seats={seats}
      />
    </div>
  );
}
