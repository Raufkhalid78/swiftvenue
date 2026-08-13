"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle2, Calendar, Type, Image as ImageIcon, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import imageCompression from 'browser-image-compression';

const STEPS = [
  { id: 1, title: "Template", icon: LayoutTemplate },
  { id: 2, title: "Event Basics", icon: Type },
  { id: 3, title: "Time & Location", icon: Calendar },
  { id: 4, title: "Details & Media", icon: ImageIcon },
];

export default function CreateEventWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    template_id: "modern",
    title: "",
    slug: "",
    type: "corporate",
    date: "",
    time: "",
    venue_name: "",
    venue_address: "",
    description: "",
    theme_color: "#0f172a",
    ticket_price: "0",
    hero_image_url: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

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
      const compressedFile = await imageCompression(file, options);
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session?.user?.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, compressedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath);
      updateForm("hero_image_url", publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Error uploading image: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const updateForm = (key: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Auto-generate slug from title if title changes
      if (key === "title") {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error("You must be logged in to create an event");
        return;
      }

      const { data, error } = await supabase.from('events').insert([
        {
          user_id: session.user.id,
          title: formData.title,
          slug: formData.slug,
          type: formData.type,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          venue_name: formData.venue_name,
          venue_address: formData.venue_address,
          theme_color: formData.theme_color,
          hero_image_url: formData.hero_image_url,
          template_id: formData.template_id,
          ticket_price: parseFloat(formData.ticket_price) || 0,
          status: 'draft'
        }
      ]).select().single();

      if (error) throw error;

      // Auto-create default ticket type
      const { error: ticketError } = await supabase.from('ticket_types').insert([
        {
          event_id: data.id,
          name: "General Admission",
          price: parseFloat(formData.ticket_price) || 0,
          currency: "PKR",
          quantity_total: 1000,
          is_active: true
        }
      ]);
      
      if (ticketError) console.error("Failed to create default ticket type:", ticketError);

      toast.success("Event created! Set up your ticket tiers now.");
      router.push(`/dashboard/events/${data.id}/tickets`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold font-display tracking-tight">Create New Event</h1>
        <p className="text-muted-foreground mt-1">Setup your professional event in just a few steps.</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isActive ? "bg-primary text-primary-foreground border-4 border-background" : 
                isCompleted ? "bg-primary text-primary-foreground border-4 border-background" : 
                "bg-muted text-muted-foreground border-4 border-background"
              }`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Area */}
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-semibold font-display">Choose a Template</h2>
            <p className="text-sm text-muted-foreground">Select the layout structure for your public event page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {['modern', 'minimalist', 'classic', 'festival', 'gala', 'workshop'].map((tpl) => (
                <div 
                  key={tpl}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${formData.template_id === tpl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => updateForm('template_id', tpl)}
                >
                  <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center border border-border overflow-hidden">
                    {tpl === 'modern' && (
                      <div className="w-full h-full flex flex-col">
                        <div className="h-1/3 bg-primary/20 w-full" />
                        <div className="flex-1 p-2 flex gap-2">
                          <div className="flex-[2] space-y-1"><div className="h-2 w-full bg-muted-foreground/20 rounded"/><div className="h-2 w-3/4 bg-muted-foreground/20 rounded"/></div>
                          <div className="flex-1 bg-card border rounded p-1"><div className="h-2 w-full bg-primary/40 rounded"/></div>
                        </div>
                      </div>
                    )}
                    {tpl === 'minimalist' && (
                      <div className="w-full h-full flex flex-col p-2 space-y-2 justify-center items-center">
                        <div className="h-3 w-1/2 bg-primary/40 rounded"/>
                        <div className="h-2 w-3/4 bg-muted-foreground/20 rounded"/>
                        <div className="h-6 w-1/3 bg-card border rounded mt-2"/>
                      </div>
                    )}
                    {tpl === 'classic' && (
                      <div className="w-full h-full flex flex-col">
                        <div className="h-1/4 bg-card border-b flex items-center justify-center"><div className="h-2 w-1/3 bg-primary/40 rounded"/></div>
                        <div className="flex-1 p-2 flex flex-col items-center gap-2">
                           <div className="h-4 w-1/2 bg-muted-foreground/30 rounded"/>
                           <div className="h-2 w-full bg-muted-foreground/20 rounded"/>
                           <div className="h-2 w-full bg-muted-foreground/20 rounded"/>
                        </div>
                      </div>
                    )}
                    {tpl === 'festival' && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-2">
                        <div className="h-4 w-2/3 bg-foreground/80 rounded mb-2 rotate-[-2deg]"/>
                        <div className="h-8 w-1/2 bg-foreground/80 rounded rotate-[1deg]"/>
                      </div>
                    )}
                    {tpl === 'gala' && (
                      <div className="w-full h-full flex flex-col bg-zinc-950 p-2 items-center justify-center">
                        <div className="h-4 w-1/2 bg-yellow-500/50 rounded mb-2"/>
                        <div className="h-2 w-1/3 bg-zinc-500/50 rounded"/>
                      </div>
                    )}
                    {tpl === 'workshop' && (
                      <div className="w-full h-full flex flex-col p-2 gap-1 bg-white">
                        <div className="h-4 w-1/3 bg-primary/40 rounded mb-1"/>
                        <div className="flex-1 border rounded bg-muted/30 p-1 space-y-1">
                          <div className="h-2 w-full bg-muted-foreground/20 rounded"/>
                          <div className="h-2 w-full bg-muted-foreground/20 rounded"/>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold capitalize">{tpl}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tpl === 'modern' && 'Sidebar registration & hero header.'}
                      {tpl === 'minimalist' && 'Clean, centered text focus.'}
                      {tpl === 'classic' && 'Traditional conference layout.'}
                      {tpl === 'festival' && 'Vibrant, bold colors.'}
                      {tpl === 'gala' && 'Dark, elegant, formal.'}
                      {tpl === 'workshop' && 'Dense, agenda-first layout.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-semibold font-display">Event Basics</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Annual Tech Conference 2026" 
                  value={formData.title} 
                  onChange={(e) => updateForm("title", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Custom URL Slug</Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2 border border-r-0 border-border rounded-l-md text-muted-foreground text-sm">
                    swiftvenuehq.com/e/
                  </span>
                  <Input 
                    id="slug" 
                    className="rounded-l-none" 
                    value={formData.slug} 
                    onChange={(e) => updateForm("slug", e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Event Category</Label>
                <Select value={formData.type} onValueChange={(v) => updateForm("type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporate & Professional</SelectItem>
                    <SelectItem value="social">Social & Personal</SelectItem>
                    <SelectItem value="cultural">Cultural & Public</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-semibold font-display">Time & Location</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={formData.date} 
                    onChange={(e) => updateForm("date", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input 
                    id="time" 
                    type="time"
                    value={formData.time} 
                    onChange={(e) => updateForm("time", e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue_name">Venue Name</Label>
                <Input 
                  id="venue_name" 
                  placeholder="e.g. Grand Convention Center" 
                  value={formData.venue_name} 
                  onChange={(e) => updateForm("venue_name", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue_address">Venue Address</Label>
                <Textarea 
                  id="venue_address" 
                  placeholder="Full address for map integration..." 
                  value={formData.venue_address} 
                  onChange={(e) => updateForm("venue_address", e.target.value)} 
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-semibold font-display">Details, Media & Pricing</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Event Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Tell your attendees what this event is all about..." 
                  className="min-h-[100px]"
                  value={formData.description} 
                  onChange={(e) => updateForm("description", e.target.value)} 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket_price">Ticket Price (PKR)</Label>
                  <Input 
                    id="ticket_price" 
                    type="number"
                    min="0"
                    step="100"
                    placeholder="e.g. 1500" 
                    value={formData.ticket_price} 
                    onChange={(e) => updateForm("ticket_price", e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground">Set to 0 for free events.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="theme_color">Theme Color</Label>
                  <div className="flex gap-3">
                    <Input 
                      id="theme_color" 
                      type="color"
                      className="w-14 h-10 p-1 cursor-pointer"
                      value={formData.theme_color} 
                      onChange={(e) => updateForm("theme_color", e.target.value)} 
                    />
                    <Input 
                      type="text"
                      className="flex-1 font-mono uppercase"
                      value={formData.theme_color}
                      onChange={(e) => updateForm("theme_color", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 p-6 border-2 border-dashed border-border rounded-xl text-center space-y-2 bg-muted/30 relative overflow-hidden">
                {formData.hero_image_url && (
                   
                  <Image src={formData.hero_image_url} alt="Hero" width={800} height={450} priority={true} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">Upload Hero Image</h3>
                  <p className="text-xs text-muted-foreground mb-4">High resolution image (16:9 ratio recommended)</p>
                  <div className="relative inline-block">
                    <Button variant={formData.hero_image_url ? "secondary" : "outline"} size="sm" disabled={uploadingImage}>
                      {uploadingImage ? "Uploading..." : formData.hero_image_url ? "Change Image" : "Choose File"}
                    </Button>
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}>
            Back
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={handleNext} className="gap-2">
              Next Step <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? "Creating..." : "Create Event"} <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
