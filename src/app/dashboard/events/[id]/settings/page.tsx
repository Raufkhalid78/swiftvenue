"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, AlertTriangle, Save, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EventSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadEvent() {
      const supabase = createClient();
      const { data } = await supabase.from('events').select('*').eq('id', resolvedParams.id).single();
      if (data) setEvent(data);
      setLoading(false);
    }
    loadEvent();
  }, [resolvedParams.id]);

  async function handleGeocode() {
    if (!event.venue_address && !event.venue_name) {
      toast.error("Please enter a venue address or name first.");
      return;
    }
    setGeocoding(true);
    try {
      const query = event.venue_address || event.venue_name;
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      
      let lat, lon;
      
      if (mapboxToken) {
        const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&access_token=${mapboxToken}&limit=1`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          lon = data.features[0].geometry.coordinates[0];
          lat = data.features[0].geometry.coordinates[1];
        }
      } else {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
          headers: {
            'User-Agent': 'SwiftVenue/1.0 (support@swiftvenuehq.com)'
          }
        });
        const data = await res.json();
        if (data && data.length > 0) {
          lat = data[0].lat;
          lon = data[0].lon;
        }
      }

      if (lat && lon) {
        setEvent({
          ...event,
          venue_lat: lat,
          venue_lng: lon
        });
        toast.success("Coordinates found!");
      } else {
        toast.error("Could not find coordinates for this address.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to geocoding service.");
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('events')
      .update({
        title: event.title,
        slug: event.slug,
        description: event.description,
        date: event.date,
        time: event.time,
        venue_name: event.venue_name,
        venue_address: event.venue_address,
        video_url: event.video_url,
        venue_lat: event.venue_lat ? parseFloat(event.venue_lat) : null,
        venue_lng: event.venue_lng ? parseFloat(event.venue_lng) : null,
        organizer_bio: event.organizer_bio,
        social_links: event.social_links
      })
      .eq('id', event.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update event details.");
    } else {
      toast.success("Event updated successfully!");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
    
    const supabase = createClient();
    await supabase.from('events').delete().eq('id', event.id);
    toast.success("Event deleted");
    router.push("/dashboard/events");
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl pb-12">
      <div>
        <h2 className="text-xl font-bold font-display">Event Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Update your event details or change its status.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold border-b border-border pb-3">Basic Information</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input value={event.title} onChange={e => setEvent({...event, title: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>URL Slug</Label>
            <Input value={event.slug} onChange={e => setEvent({...event, slug: e.target.value})} required />
            <p className="text-xs text-muted-foreground">swiftvenuehq.com/e/{event.slug}</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea 
              value={event.description || ''} 
              onChange={e => setEvent({...event, description: e.target.value})}
              rows={4} 
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold border-b border-border pb-3 pt-4">Date & Location</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={event.date} onChange={e => setEvent({...event, date: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input type="time" value={event.time} onChange={e => setEvent({...event, time: e.target.value})} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Venue Name</Label>
            <Input value={event.venue_name || ''} onChange={e => setEvent({...event, venue_name: e.target.value})} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Venue Address</Label>
            <Input value={event.venue_address || ''} onChange={e => setEvent({...event, venue_address: e.target.value})} required placeholder="123 Main St, City, Country" />
          </div>
          <div className="space-y-2 md:col-span-2 flex justify-start mb-2">
            <Button type="button" variant="outline" size="sm" onClick={handleGeocode} disabled={geocoding}>
              <MapPin className="w-4 h-4 mr-2" /> {geocoding ? 'Finding...' : 'Find Coordinates from Address'}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Latitude (Optional)</Label>
            <Input type="number" step="any" value={event.venue_lat || ''} onChange={e => setEvent({...event, venue_lat: e.target.value})} placeholder="34.0522" />
          </div>
          <div className="space-y-2">
            <Label>Longitude (Optional)</Label>
            <Input type="number" step="any" value={event.venue_lng || ''} onChange={e => setEvent({...event, venue_lng: e.target.value})} placeholder="-118.2437" />
          </div>
        </div>

        <h3 className="text-lg font-semibold border-b border-border pb-3 pt-4">Rich Media & Organizer</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label>Promo Video URL (Optional)</Label>
            <Input value={event.video_url || ''} onChange={e => setEvent({...event, video_url: e.target.value})} placeholder="https://youtube.com/..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Organizer Bio (Optional)</Label>
            <Textarea 
              value={event.organizer_bio || ''} 
              onChange={e => setEvent({...event, organizer_bio: e.target.value})}
              rows={3} 
              placeholder="Tell attendees about yourself or your organization..."
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram Handle</Label>
            <Input value={event.social_links?.instagram || ''} onChange={e => setEvent({...event, social_links: {...(event.social_links || {}), instagram: e.target.value}})} placeholder="@swiftvenue" />
          </div>
          <div className="space-y-2">
            <Label>Twitter/X Handle</Label>
            <Input value={event.social_links?.twitter || ''} onChange={e => setEvent({...event, social_links: {...(event.social_links || {}), twitter: e.target.value}})} placeholder="@swiftvenue" />
          </div>
        </div>

        <h3 className="text-lg font-semibold border-b border-border pb-3 pt-4">Visibility Status</h3>
        <div className="space-y-2">
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={event.status}
            onChange={e => setEvent({...event, status: e.target.value})}
          >
            <option value="draft" className="bg-background text-foreground">Draft (Hidden from public)</option>
            <option value="published" className="bg-background text-foreground">Published (Live & taking RSVPs)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </form>

      <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting this event will remove all associated agenda items, registered guests, and metrics. This action cannot be undone.
        </p>
        <Button variant="destructive" onClick={handleDelete} className="gap-2">
          <Trash2 className="w-4 h-4" /> Delete Event
        </Button>
      </div>
    </div>
  );
}
