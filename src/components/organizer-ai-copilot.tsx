'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrganizerAiCopilotProps {
  eventId: string;
  defaultAction?: 'generate_email' | 'generate_social' | 'generate_faq' | 'generate_agenda';
  onApplyResult?: (content: string) => void;
  triggerButtonText?: string;
}

export function OrganizerAiCopilot({
  eventId,
  defaultAction = 'generate_email',
  onApplyResult,
  triggerButtonText = 'Draft with AI',
}: OrganizerAiCopilotProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(defaultAction);
  const [tone, setTone] = useState('exciting');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/ai/organizer-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          action,
          tone,
          customPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate copy');

      setResult(data.result);
      toast.success('AI content generated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const applyContent = () => {
    if (onApplyResult && result) {
      onApplyResult(result);
      setOpen(false);
      toast.success('Content applied to editor!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
          <Sparkles className="w-3.5 h-3.5" />
          {triggerButtonText}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Organizer AI Co-Pilot
          </DialogTitle>
          <DialogDescription>
            Generate high-converting marketing emails, multi-channel social media posts, agendas, and FAQs powered by OpenRouter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Task / Goal</Label>
              <Select value={action} onValueChange={(v: any) => setAction(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generate_email">📧 Promotional Email / Broadcast</SelectItem>
                  <SelectItem value="generate_social">📱 Social Media Posts (LinkedIn, X, IG)</SelectItem>
                  <SelectItem value="generate_faq">❓ Event FAQ Set</SelectItem>
                  <SelectItem value="generate_agenda">🗓️ Event Schedule / Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tone of Voice</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exciting">🔥 Exciting & High-Energy</SelectItem>
                  <SelectItem value="professional">💼 Professional & Corporate</SelectItem>
                  <SelectItem value="urgent">⏳ Urgent & FOMO (Last Chance)</SelectItem>
                  <SelectItem value="casual">👋 Friendly & Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-instructions">Custom Notes / Key Points (Optional)</Label>
            <Input
              id="custom-instructions"
              placeholder="e.g. Highlight 20% early-bird discount ending this Friday..."
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground gap-2 font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating with AI...' : 'Generate Content (Max 1500 Tokens)'}
          </Button>

          {result && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Generated Output</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-7 text-xs gap-1">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  {onApplyResult && (
                    <Button size="sm" onClick={applyContent} className="h-7 text-xs">
                      Apply to Field
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                readOnly
                value={result}
                rows={10}
                className="font-sans text-xs sm:text-sm bg-muted/30 border-border"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
