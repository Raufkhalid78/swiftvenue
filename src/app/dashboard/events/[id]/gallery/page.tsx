"use client";

import { useEffect, useState, use, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, ImageIcon, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";

export default function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ image_url: "", caption: "", is_post_event: false });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGallery();
  }, [resolvedParams.id]);

  async function loadGallery() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('event_gallery')
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
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
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
      setNewItem((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Error uploading image: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  async function handleAddItem() {
    if (!newItem.image_url) {
      toast.error("Please upload an image");
      return;
    }
    
    const supabase = createClient();
    const { error } = await supabase.from('event_gallery').insert([{
      event_id: resolvedParams.id,
      ...newItem,
      order_index: items.length
    }]);

    if (error) {
      toast.error("Failed to add image");
    } else {
      toast.success("Image added!");
      setIsAdding(false);
      setNewItem({ image_url: "", caption: "", is_post_event: false });
      loadGallery();
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('event_gallery').delete().eq('id', id);
    toast.success("Image deleted");
    loadGallery();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Photo Gallery</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload promo photos or post-event highlights.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2" disabled={isAdding}>
          <PlusCircle className="w-4 h-4" /> Add Photo
        </Button>
      </div>

      {isAdding && (
        <div className="p-6 border border-primary/50 bg-primary/5 rounded-xl space-y-4 animate-in fade-in zoom-in-95">
          <h3 className="font-medium">New Photo</h3>
          <div className="space-y-4">
            
            <div className="space-y-2">
              <Label>Image</Label>
              {newItem.image_url ? (
                <div className="relative w-full max-w-sm aspect-video bg-muted rounded-md overflow-hidden border border-border flex items-center justify-center">
                  <Image src={newItem.image_url} alt="Uploaded" fill className="object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-80 hover:opacity-100 z-10"
                    onClick={() => setNewItem({...newItem, image_url: ""})}
                  >
                    <X className="w-4 h-4" />
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
                    className="w-full max-w-sm aspect-video border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    {uploadingImage ? (
                      <span className="text-sm">Uploading...</span>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">Click to upload photo</span>
                        <span className="text-xs">JPG, PNG up to 5MB</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 max-w-sm">
              <Label>Caption (Optional)</Label>
              <Input value={newItem.caption} onChange={(e) => setNewItem({...newItem, caption: e.target.value})} placeholder="e.g. Crowd from last year" />
            </div>

            <div className="flex items-center gap-3 py-2">
              <Switch 
                checked={newItem.is_post_event} 
                onCheckedChange={(checked) => setNewItem({...newItem, is_post_event: checked})}
                id="post-event"
              />
              <Label htmlFor="post-event" className="cursor-pointer">
                This is a post-event highlight photo
                <p className="text-xs text-muted-foreground font-normal mt-0.5">Post-event photos are only shown after the event concludes.</p>
              </Label>
            </div>
            
          </div>
          <div className="flex justify-start gap-2 pt-2">
            <Button onClick={handleAddItem}>Save Photo</Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="aspect-square w-full rounded-xl" />
          </>
        ) : items.length === 0 && !isAdding ? (
          <div className="col-span-full p-12 text-center border border-dashed border-border rounded-xl bg-card">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg">No photos yet</h3>
            <p className="text-muted-foreground mb-4">Upload venue pictures, past event highlights, or promotional graphics.</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">Upload First Photo</Button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
              <Image src={item.image_url} alt={item.caption || "Gallery image"} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/60 sm:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium bg-background/90 text-foreground px-2 py-1 rounded">
                    {item.is_post_event ? 'Post-Event' : 'Promo'}
                  </span>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {item.caption && (
                  <p className="text-white text-sm font-medium drop-shadow-md truncate">{item.caption}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
