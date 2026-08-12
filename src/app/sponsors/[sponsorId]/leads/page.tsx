import React from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function SponsorLeadsPage({
  params
}: {
  params: Promise<{ sponsorId: string }>
}) {
  const resolvedParams = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  // Fetch sponsor details
  const { data: sponsor } = await supabase
    .from('event_sponsors')
    .select('name, logo_url')
    .eq('id', resolvedParams.sponsorId)
    .single();

  if (!sponsor) {
    return <div className="p-8 text-center">Sponsor not found</div>;
  }

  // Fetch leads count and recent leads
  const { data: leads } = await supabase
    .from('sponsor_leads')
    .select(`
      scanned_at,
      attendees(guest_name, guest_email)
    `)
    .eq('sponsor_id', resolvedParams.sponsorId)
    .order('scanned_at', { ascending: false });

  const leadsList = leads || [];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center space-y-4 pt-8">
        {sponsor.logo_url ? (
          <div className="relative w-32 h-20 mx-auto bg-white rounded-xl border p-2">
            <Image src={sponsor.logo_url} alt={sponsor.name} fill className="object-contain p-2" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
            <QrCode className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold font-display">{sponsor.name}</h1>
          <p className="text-muted-foreground">Sponsor Portal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-primary">{leadsList.length}</p>
            <p className="text-sm font-medium mt-1">Total Leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
            <Button asChild className="w-full" variant="outline">
              <Link href={`/sponsors/${resolvedParams.sponsorId}/scanner`}>
                <QrCode className="w-4 h-4 mr-2" />
                Open Scanner
              </Link>
            </Button>
            <Button asChild className="w-full">
              <a href={`/api/sponsors/${resolvedParams.sponsorId}/leads/export`} download>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leadsList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No leads collected yet.</p>
          ) : (
            <div className="space-y-4">
              {leadsList.slice(0, 10).map((lead: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{lead.attendees?.guest_name}</p>
                    <p className="text-sm text-muted-foreground">{lead.attendees?.guest_email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lead.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {leadsList.length > 10 && (
                <p className="text-center text-sm text-muted-foreground pt-4">
                  +{leadsList.length - 10} more (export to view all)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
