import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SeatingBuilder } from "./seating-builder";

export default async function SeatingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: event },
    { data: layout },
    { data: ticketTypes }
  ] = await Promise.all([
    supabase.from("events").select("id, title").eq("id", id).single(),
    supabase.from("seating_layouts").select("id, layout_data_json").eq("event_id", id).single(),
    supabase.from("ticket_types").select("id, name, price").eq("event_id", id).eq("is_active", true)
  ]);

  if (!event) notFound();

  // Fetch existing seats if layout exists
  let seats: any[] = [];
  if (layout?.id) {
    const { data: s } = await supabase.from('seats').select('*').eq('layout_id', layout.id);
    seats = s || [];
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Seating Map</h1>
        <p className="text-muted-foreground">Design your venue layout and assign ticket tiers to specific seats.</p>
      </div>

      <SeatingBuilder 
        eventId={id} 
        initialLayout={layout?.layout_data_json || { rows: 10, cols: 20 }} 
        initialSeats={seats}
        ticketTypes={ticketTypes || []}
      />
    </div>
  );
}
