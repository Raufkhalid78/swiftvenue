"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  Type, 
  Image as ImageIcon, 
  LayoutTemplate,
  Sparkles,
  MapPin,
  Video,
  Globe,
  Loader2,
  Check,
  X,
  Coins,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import imageCompression from 'browser-image-compression';
import { TEMPLATES_REGISTRY } from "@/lib/templates-registry";
import { STOCK_BANNERS } from "@/lib/stock-banners";

const STEPS = [
  { id: 1, title: "Template", icon: LayoutTemplate },
  { id: 2, title: "Event Basics", icon: Type },
  { id: 3, title: "Format & Schedule", icon: Calendar },
  { id: 4, title: "Media & Tickets", icon: Coins },
];

const CURRENCIES = [
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
];

const TIMEZONES = [
  { id: 'Asia/Karachi', label: 'Pakistan Standard Time (PKT, UTC+5)' },
  { id: 'Asia/Dubai', label: 'Gulf Standard Time (GST, UTC+4)' },
  { id: 'Asia/Riyadh', label: 'Arabia Standard Time (AST, UTC+3)' },
  { id: 'UTC', label: 'Coordinated Universal Time (UTC+0)' },
  { id: 'Europe/London', label: 'British Summer / GMT (UTC+0/+1)' },
  { id: 'Europe/Paris', label: 'Central European Time (CET, UTC+1)' },
  { id: 'America/New_York', label: 'Eastern Time (ET, UTC-5)' },
  { id: 'America/Chicago', label: 'Central Time (CT, UTC-6)' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (PT, UTC-8)' },
];

export default function CreateEventWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter category on Step 1
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  // AI Generator Modal State
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Slug Availability State
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null);
  const [slugReason, setSlugReason] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    template_id: "modern",
    title: "",
    slug: "",
    type: "corporate",
    modality: "in_person", // 'in_person' | 'virtual' | 'hybrid'
    virtual_platform: "zoom",
    virtual_stream_url: "",
    date: "",
    time: "",
    end_date: "",
    end_time: "",
    timezone: "Asia/Karachi",
    venue_name: "",
    venue_address: "",
    description: "",
    theme_color: "#0f172a",
    is_free: false,
    currency: "PKR",
    ticket_price: "1500",
    hero_image_url: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  // Debounced Slug Availability Checker
  const checkSlugAvailability = useCallback(async (slugToTest: string) => {
    if (!slugToTest || slugToTest.trim().length < 3) {
      setSlugAvailable(null);
      setSlugReason(null);
      setSlugSuggestion(null);
      return;
    }

    setSlugChecking(true);
    try {
      const res = await fetch(`/api/events/check-slug?slug=${encodeURIComponent(slugToTest)}`);
      const data = await res.json();
      setSlugAvailable(data.available);
      setSlugReason(data.reason || null);
      setSlugSuggestion(data.suggestion || null);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.slug) {
        checkSlugAvailability(formData.slug);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [formData.slug, checkSlugAvailability]);

  const updateForm = (key: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Auto-generate slug from title if title changes and user hasn't explicitly customized slug
      if (key === "title" && (!prev.slug || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""))) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      }
      return updated;
    });
  };

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
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${session?.user?.id || 'public'}/${fileName}`;
      
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

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please provide a prompt or topic for the event.");
      return;
    }

    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/generate-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          eventType: formData.type,
          modality: formData.modality,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate event");

      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        slug: data.slug || prev.slug,
        description: data.description || prev.description,
        type: data.category || prev.type,
        template_id: data.recommendedTemplate || prev.template_id,
        theme_color: data.themeColor || prev.theme_color,
      }));

      setShowAiModal(false);
      toast.success("✨ Event details generated with AI!");
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      if (!formData.title.trim()) {
        toast.error("Please provide an event title");
        return;
      }
      if (!formData.slug.trim()) {
        toast.error("Please specify a URL slug");
        return;
      }
      if (slugAvailable === false) {
        toast.error("The custom URL slug is already taken. Please choose another or apply the suggestion.");
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.date) {
        toast.error("Please select an event date");
        return;
      }
      if (formData.modality !== "virtual" && !formData.venue_name.trim()) {
        toast.error("Please provide a venue name for in-person / hybrid events");
        return;
      }
    }

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

      const finalPrice = formData.is_free ? 0 : parseFloat(formData.ticket_price) || 0;

      const { data, error } = await supabase.from('events').insert([
        {
          user_id: session.user.id,
          title: formData.title.trim(),
          slug: formData.slug.trim().toLowerCase(),
          type: formData.type,
          modality: formData.modality,
          virtual_platform: formData.modality !== 'in_person' ? formData.virtual_platform : null,
          virtual_stream_url: formData.modality !== 'in_person' ? formData.virtual_stream_url.trim() : null,
          description: formData.description.trim(),
          date: formData.date,
          time: formData.time || null,
          end_date: formData.end_date || null,
          end_time: formData.end_time || null,
          timezone: formData.timezone,
          venue_name: formData.modality !== 'virtual' ? formData.venue_name.trim() : 'Virtual / Online Stream',
          venue_address: formData.modality !== 'virtual' ? formData.venue_address.trim() : 'Online Event',
          theme_color: formData.theme_color,
          hero_image_url: formData.hero_image_url || null,
          template_id: formData.template_id,
          ticket_price: finalPrice,
          default_currency: formData.currency,
          status: 'draft'
        }
      ]).select().single();

      if (error) throw error;

      // Auto-create default ticket tier
      const { error: ticketError } = await supabase.from('ticket_types').insert([
        {
          event_id: data.id,
          name: formData.is_free ? "Free Registration Pass" : "General Admission",
          price: finalPrice,
          currency: formData.currency,
          quantity_total: 1000,
          is_active: true
        }
      ]);
      
      if (ticketError) console.error("Failed to create default ticket type:", ticketError);

      toast.success("Event created! Set up additional ticket tiers or publish now.");
      router.push(`/dashboard/events/${data.id}/tickets`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = TEMPLATES_REGISTRY.filter(t => {
    if (templateFilter === 'all') return true;
    return t.category === templateFilter;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back & Heading */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Create New Event</h1>
            <p className="text-muted-foreground mt-1 text-sm">Launch a high-converting, beautifully styled event page in minutes.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAiModal(true)}
            className="gap-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" /> ✨ AI Event Assistant
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-10 flex items-center justify-between relative px-2">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-muted -z-10 rounded-full" />
        <div 
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 90}%` }}
        />
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : 
                isCompleted ? "bg-primary text-primary-foreground shadow-sm" : 
                "bg-muted text-muted-foreground border border-border"
              }`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-semibold ${isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display font-bold text-lg">
                <Sparkles className="w-5 h-5" /> AI Event Assistant
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Describe your event in a few words or paste rough notes. AI will craft the title, hook, detailed agenda copy, and select the optimal layout.
            </p>
            <Textarea
              placeholder="e.g. 2-day AI developer hackathon in Islamabad with $5k prizes, mentor workshops, and demo day..."
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="resize-none"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAiModal(false)}>Cancel</Button>
              <Button onClick={handleAiGenerate} disabled={generatingAi} className="gap-2">
                {generatingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingAi ? "Crafting Event..." : "Generate Details"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        
        {/* ================= STEP 1: TEMPLATE SELECTOR ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Choose a Page Template</h2>
              <p className="text-sm text-muted-foreground mt-1">Select the visual aesthetic and layout structure for your public event page.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { id: 'all', label: 'All Templates (9)' },
                { id: 'business', label: 'Business & Tech' },
                { id: 'social', label: 'Social & Mixers' },
                { id: 'luxury', label: 'Gala & Luxury' },
                { id: 'education', label: 'Classes & Streams' },
                { id: 'music', label: 'Music & Festivals' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTemplateFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    templateFilter === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filteredTemplates.map((tpl) => {
                const isSelected = formData.template_id === tpl.id;
                return (
                  <div 
                    key={tpl.id}
                    onClick={() => {
                      updateForm('template_id', tpl.id);
                      if (tpl.themeColorDefault && formData.theme_color === '#0f172a') {
                        updateForm('theme_color', tpl.themeColorDefault);
                      }
                    }}
                    className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between text-left group ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-md' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                  >
                    {/* Badge */}
                    {tpl.badge && (
                      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                        {tpl.badge}
                      </div>
                    )}

                    <div>
                      {/* Visual Thumbnail */}
                      <div className={`w-full aspect-[16/10] bg-gradient-to-br ${tpl.previewClass} rounded-xl mb-3 border border-border/80 flex items-center justify-center p-3 text-white overflow-hidden relative shadow-inner`}>
                        <div className="text-center space-y-1 z-10">
                          <span className="text-xs font-bold uppercase tracking-wider opacity-90 drop-shadow-sm">{tpl.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                              <Check className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-foreground text-sm">{tpl.name}</h3>
                          <span className="text-[10px] text-muted-foreground capitalize">{tpl.category}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border/60 text-[11px] text-primary font-medium">
                      Best for: {tpl.recommendedFor}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 2: BASICS ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Event Basics</h2>
              <p className="text-sm text-muted-foreground mt-1">Set the core identity and custom link for your event.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Islamabad AI Summit 2026" 
                  value={formData.title} 
                  onChange={(e) => updateForm("title", e.target.value)} 
                  required
                />
              </div>

              {/* Custom Slug with Live Availability Checker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug">Custom URL Slug *</Label>
                  {slugChecking ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                    </span>
                  ) : slugAvailable === true ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> URL Available
                    </span>
                  ) : slugAvailable === false ? (
                    <span className="text-xs text-rose-500 font-semibold flex items-center gap-1 font-mono">
                      <X className="w-3.5 h-3.5" /> Already Taken
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2 border border-r-0 border-border rounded-l-md text-muted-foreground text-xs sm:text-sm font-mono shrink-0">
                    swiftvenuehq.com/e/
                  </span>
                  <Input 
                    id="slug" 
                    className="rounded-l-none font-mono text-sm" 
                    value={formData.slug} 
                    onChange={(e) => updateForm("slug", e.target.value)} 
                    required
                  />
                </div>

                {slugAvailable === false && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs space-y-1 text-rose-600 dark:text-rose-400">
                    <p>{slugReason || "This URL is already taken."}</p>
                    {slugSuggestion && (
                      <div className="flex items-center gap-2 pt-1 text-foreground">
                        <span>Suggested URL:</span>
                        <button
                          type="button"
                          onClick={() => updateForm("slug", slugSuggestion)}
                          className="font-mono text-primary underline hover:text-primary/80 font-bold"
                        >
                          {slugSuggestion}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Category</Label>
                  <Select value={formData.type} onValueChange={(v) => updateForm("type", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate">Corporate & Tech</SelectItem>
                      <SelectItem value="social">Social & Networking</SelectItem>
                      <SelectItem value="cultural">Cultural & Entertainment</SelectItem>
                      <SelectItem value="educational">Educational & Masterclass</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme_color">Primary Brand Accent</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="theme_color" 
                      type="color"
                      className="w-14 h-10 p-1 cursor-pointer"
                      value={formData.theme_color} 
                      onChange={(e) => updateForm("theme_color", e.target.value)} 
                    />
                    <Input 
                      type="text"
                      className="flex-1 font-mono uppercase text-sm"
                      value={formData.theme_color}
                      onChange={(e) => updateForm("theme_color", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Event Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Share the story, highlights, and why attendees shouldn't miss this event..." 
                  className="min-h-[120px]"
                  value={formData.description} 
                  onChange={(e) => updateForm("description", e.target.value)} 
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: FORMAT & SCHEDULE ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Format & Schedule</h2>
              <p className="text-sm text-muted-foreground mt-1">Specify whether your event is in-person, online, or a hybrid experience.</p>
            </div>

            {/* 3-Way Modality Selector */}
            <div className="space-y-2">
              <Label>Event Format / Modality *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'in_person', label: 'In-Person', icon: MapPin, desc: 'Physical venue location' },
                  { id: 'virtual', label: 'Online / Stream', icon: Video, desc: 'Zoom, YouTube, or Meet' },
                  { id: 'hybrid', label: 'Hybrid', icon: Globe, desc: 'Physical + Live Stream' },
                ].map(mod => {
                  const Icon = mod.icon;
                  const isSelected = formData.modality === mod.id;
                  return (
                    <div
                      key={mod.id}
                      onClick={() => updateForm('modality', mod.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm' 
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        {isSelected && <Check className="w-4 h-4 text-primary font-bold" />}
                      </div>
                      <span className="font-bold text-sm text-foreground">{mod.label}</span>
                      <span className="text-xs text-muted-foreground">{mod.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location Fields (for In-Person & Hybrid) */}
            {formData.modality !== 'virtual' && (
              <div className="space-y-4 p-4 bg-muted/30 border border-border rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="venue_name">Venue Name *</Label>
                  <Input 
                    id="venue_name" 
                    placeholder="e.g. Islamabad Marriott Hotel or Convention Hall B" 
                    value={formData.venue_name} 
                    onChange={(e) => updateForm("venue_name", e.target.value)} 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue_address">Venue Full Address</Label>
                  <Textarea 
                    id="venue_address" 
                    placeholder="Street address, city, and landmarks for map navigation..." 
                    value={formData.venue_address} 
                    onChange={(e) => updateForm("venue_address", e.target.value)} 
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Virtual Stream Fields (for Virtual & Hybrid) */}
            {formData.modality !== 'in_person' && (
              <div className="space-y-4 p-4 bg-muted/30 border border-border rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Streaming Platform</Label>
                    <Select value={formData.virtual_platform} onValueChange={(v) => updateForm("virtual_platform", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom Video</SelectItem>
                        <SelectItem value="google_meet">Google Meet</SelectItem>
                        <SelectItem value="youtube">YouTube Live Stream</SelectItem>
                        <SelectItem value="streamyard">StreamYard</SelectItem>
                        <SelectItem value="custom">Custom WebRTC / RTMP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stream_url">Join Link or Stream URL</Label>
                    <Input 
                      id="stream_url" 
                      placeholder="https://zoom.us/j/... or https://youtube.com/live/..." 
                      value={formData.virtual_stream_url} 
                      onChange={(e) => updateForm("virtual_stream_url", e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Date, Time & Timezone */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date *</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={formData.date} 
                    onChange={(e) => updateForm("date", e.target.value)} 
                    required
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input 
                    id="end_date" 
                    type="date"
                    value={formData.end_date} 
                    onChange={(e) => updateForm("end_date", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time (Optional)</Label>
                  <Input 
                    id="end_time" 
                    type="time"
                    value={formData.end_time} 
                    onChange={(e) => updateForm("end_time", e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Event Timezone</Label>
                <Select value={formData.timezone} onValueChange={(v) => updateForm("timezone", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.id} value={tz.id}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: MEDIA & TICKETS ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Media & Pricing Setup</h2>
              <p className="text-sm text-muted-foreground mt-1">Select a hero banner and establish your primary admission pricing.</p>
            </div>

            {/* Hero Image Selection (Curated Library vs Local Upload) */}
            <div className="space-y-3">
              <Label>Event Hero Banner</Label>

              {/* Preview Banner Container */}
              {formData.hero_image_url && (
                <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-border shadow-md">
                  <Image 
                    src={formData.hero_image_url} 
                    alt="Event Hero" 
                    fill 
                    className="object-cover" 
                  />
                  <div className="absolute top-3 right-3">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => updateForm("hero_image_url", "")}
                      className="bg-black/60 text-white hover:bg-black/80 text-xs backdrop-blur-md"
                    >
                      Clear Banner
                    </Button>
                  </div>
                </div>
              )}

              {/* Stock Banner Grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Choose from Curated Stock Gallery (1-Click Select)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 border border-border rounded-xl">
                  {STOCK_BANNERS.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        updateForm("hero_image_url", b.url);
                        if (b.themeColor) updateForm("theme_color", b.themeColor);
                      }}
                      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border transition-all ${
                        formData.hero_image_url === b.url
                          ? "border-primary ring-2 ring-primary"
                          : "border-border hover:border-primary/60 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <Image src={b.url} alt={b.title} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] text-white font-medium truncate">{b.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Or Local Upload */}
              <div className="pt-2">
                <div className="p-4 border-2 border-dashed border-border rounded-xl text-center space-y-2 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Or upload a custom high-res image (16:9 ratio recommended)</p>
                  <div className="relative inline-block">
                    <Button variant="outline" size="sm" disabled={uploadingImage}>
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ImageIcon className="w-3.5 h-3.5 mr-1.5" />}
                      {uploadingImage ? "Compressing & Uploading..." : "Upload from Device"}
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

            {/* Pricing Controls */}
            <div className="space-y-4 pt-4 border-t border-border">
              <Label>Admission & Ticket Pricing</Label>

              {/* Free vs Paid Toggle */}
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => updateForm("is_free", false)}
                  className={`p-3 rounded-xl border-2 text-center font-bold text-sm transition-all ${
                    !formData.is_free
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  💳 Paid Tickets
                </button>
                <button
                  type="button"
                  onClick={() => updateForm("is_free", true)}
                  className={`p-3 rounded-xl border-2 text-center font-bold text-sm transition-all ${
                    formData.is_free
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🎉 Free Admission
                </button>
              </div>

              {!formData.is_free ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select value={formData.currency} onValueChange={(v) => updateForm("currency", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} ({c.symbol}) — {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket_price">General Admission Price ({formData.currency})</Label>
                    <Input 
                      id="ticket_price" 
                      type="number"
                      min="0"
                      step="50"
                      placeholder="e.g. 1500" 
                      value={formData.ticket_price} 
                      onChange={(e) => updateForm("ticket_price", e.target.value)} 
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300">
                  Attendees will be able to register and receive instant QR passes for free. You can add paid VIP tiers later in the Ticket Manager.
                </p>
              )}
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
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 shadow-lg">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSubmitting ? "Creating..." : <><span className="sm:hidden">Create Event</span><span className="hidden sm:inline">Create Event & Configure Tickets</span></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
