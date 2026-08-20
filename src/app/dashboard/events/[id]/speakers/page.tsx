"use client";

import { useEffect, useState, use, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Edit2, GripVertical, Mic2, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function SpeakersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", title: "", bio: "", photo_url: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSpeakers();
  }, [resolvedParams.id]);

  async function loadSpeakers() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('event_speakers')
      .select('*')
      .eq('event_id', resolvedParams.id)
      .order('order_index', { ascending: true });
    
    setItems(data || []);
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
      const { default: imageCompression } = await import('browser-image-compression');
      const compressedFile = await imageCompression(file, options);
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session?.user?.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, compressedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath);
      setNewItem((prev) => ({ ...prev, photo_url: publicUrl }));
      toast.success("Photo uploaded successfully");
    } catch (error: any) {
      toast.error("Error uploading photo: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  async function handleAddItem() {
    if (!newItem.name) {
      toast.error("Speaker name is required");
      return;
    }
    
    const supabase = createClient();
    const { error } = await supabase.from('event_speakers').insert([{
      event_id: resolvedParams.id,
      ...newItem,
      order_index: items.length
    }]);

    if (error) {
      toast.error("Failed to add speaker");
    } else {
      toast.success("Speaker added!");
      setIsAdding(false);
      setNewItem({ name: "", title: "", bio: "", photo_url: "" });
      loadSpeakers();
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('event_speakers').delete().eq('id', id);
    toast.success("Speaker deleted");
    loadSpeakers();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Speakers & Hosts</h2>
          <p className="text-sm text-muted-foreground mt-1">Showcase the people speaking or hosting your event.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2" disabled={isAdding}>
          <PlusCircle className="w-4 h-4" /> Add Speaker
        </Button>
      </div>

      {isAdding && (
        <div className="p-6 border border-primary/50 bg-primary/5 rounded-xl space-y-4 animate-in fade-in zoom-in-95">
          <h3 className="font-medium">New Speaker</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Job Title / Organization (Optional)</Label>
              <Input value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} placeholder="e.g. CEO, Acme Corp" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Speaker Photo (Optional)</Label>
              {newItem.photo_url ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-border">
                  <Image src={newItem.photo_url} alt="Uploaded" fill className="object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-0 right-0 w-6 h-6 rounded-full opacity-80 hover:opacity-100"
                    onClick={() => setNewItem({...newItem, photo_url: ""})}
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
                        <span className="text-sm">Click to upload photo</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Biography (Optional)</Label>
              <Textarea value={newItem.bio} onChange={(e) => setNewItem({...newItem, bio: e.target.value})} placeholder="Brief bio..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Save Speaker</Button>
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
            <Mic2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg">No speakers yet</h3>
            <p className="text-muted-foreground mb-4">Add speakers, performers, or hosts for your event.</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">Add First Speaker</Button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-colors group">
              <div className="flex flex-col items-center justify-center text-muted-foreground/50 cursor-grab px-2">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 flex gap-4 items-center">
                {item.photo_url ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border shrink-0">
                    <Image src={item.photo_url} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mic2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  {item.title && <p className="text-sm font-medium text-muted-foreground mt-0.5">{item.title}</p>}
                  {item.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.bio}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
