"use client";

import { useEffect, useState, use, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, GripVertical, Briefcase, UploadCloud, X, Link as LinkIcon, BarChart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import imageCompression from 'browser-image-compression';

export default function SponsorsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", logo_url: "", website_url: "", tier: "partner" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSponsors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  async function loadSponsors() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('event_sponsors')
      .select('*')
      .eq('event_id', resolvedParams.id)
      .order('order_index', { ascending: true });
    
    if (data) setItems(data);
    setLoading(false);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploadingImage(true);
      
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session?.user?.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, compressedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath);
      setNewItem((prev) => ({ ...prev, logo_url: publicUrl }));
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error("Error uploading logo: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  async function handleAddItem() {
    if (!newItem.name || !newItem.logo_url) {
      toast.error("Sponsor name and logo are required");
      return;
    }
    
    const supabase = createClient();
    const { error } = await supabase.from('event_sponsors').insert([{
      event_id: resolvedParams.id,
      ...newItem,
      order_index: items.length
    }]);

    if (error) {
      toast.error("Failed to add sponsor");
    } else {
      toast.success("Sponsor added!");
      setIsAdding(false);
      setNewItem({ name: "", logo_url: "", website_url: "", tier: "partner" });
      loadSponsors();
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('event_sponsors').delete().eq('id', id);
    toast.success("Sponsor deleted");
    loadSponsors();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Sponsors & Partners</h2>
          <p className="text-sm text-muted-foreground mt-1">Showcase the organizations supporting your event.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2" disabled={isAdding}>
          <PlusCircle className="w-4 h-4" /> Add Sponsor
        </Button>
      </div>

      {isAdding && (
        <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-6 animate-in fade-in zoom-in-95">
          <h3 className="text-lg font-semibold border-b border-border pb-3">New Sponsor</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sponsor Name</Label>
              <Input value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Acme Corp" />
            </div>
            
            <div className="space-y-2">
              <Label>Sponsorship Tier</Label>
              <Select value={newItem.tier} onValueChange={(val) => setNewItem({...newItem, tier: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title Sponsor (Largest)</SelectItem>
                  <SelectItem value="gold">Gold Sponsor (Medium)</SelectItem>
                  <SelectItem value="partner">Partner (Small)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Logo</Label>
              {newItem.logo_url ? (
                <div className="relative w-32 h-20 bg-white rounded-md overflow-hidden border border-border flex items-center justify-center p-2">
                  <Image src={newItem.logo_url} alt="Uploaded" fill className="object-contain p-2" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full opacity-80 hover:opacity-100 z-10"
                    onClick={() => setNewItem({...newItem, logo_url: ""})}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-24 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    {uploadingImage ? (
                      <span className="text-sm">Uploading...</span>
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6" />
                        <span className="text-sm">Click to upload logo</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Website URL (Optional)</Label>
              <Input type="url" value={newItem.website_url} onChange={(e) => setNewItem({...newItem, website_url: e.target.value})} placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Save Sponsor</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : items.length === 0 && !isAdding ? (
          <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg">No sponsors yet</h3>
            <p className="text-muted-foreground mb-4">Add partners and sponsors to feature them on the event page.</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">Add First Sponsor</Button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-colors group">
              <div className="flex flex-col items-center justify-center text-muted-foreground/50 cursor-grab px-2">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 flex gap-4 items-center">
                <div className="relative w-24 h-16 bg-white rounded border border-border shrink-0">
                  <Image src={item.logo_url} alt={item.name} fill className="object-contain p-2" />
                </div>
                <div>
                  <h4 className="font-bold flex items-center gap-2">
                    {item.name}
                    <span className="text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {item.tier}
                    </span>
                  </h4>
                  {item.website_url && <p className="text-sm text-blue-500 hover:underline mt-0.5">{item.website_url}</p>}
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-xs h-8"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/sponsors/${item.id}/leads`);
                    toast.success("Magic link copied to clipboard");
                  }}
                >
                  <LinkIcon className="w-3 h-3" /> Copy Link
                </Button>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-2">
                  <Link href={`/sponsors/${item.id}/leads`} target="_blank">
                    <BarChart className="w-3 h-3" /> Leads
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
