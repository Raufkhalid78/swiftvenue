'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Smartphone, Monitor, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PreviewDrawerProps {
  slug: string;
  eventTitle: string;
}

export function PreviewDrawer({ slug, eventTitle }: PreviewDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const previewUrl = `/e/${slug}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="w-4 h-4" /> Live Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-950 border-slate-800">
        <DialogHeader className="p-4 px-6 border-b border-slate-800 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-base font-medium text-slate-100">
              Preview: <span className="font-semibold text-white">{eventTitle}</span>
            </DialogTitle>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
              Live Attendee View
            </span>
          </div>

          <div className="flex items-center gap-2 pr-6">
            {/* Viewport Toggles */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${
                  deviceMode === 'desktop'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${
                  deviceMode === 'mobile'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>

            <Button asChild size="sm" variant="ghost" className="text-slate-300 hover:text-white gap-1 text-xs">
              <Link href={previewUrl} target="_blank">
                Open in Tab <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </DialogHeader>

        {/* Viewport Canvas */}
        <div className="flex-1 bg-slate-900/50 flex items-center justify-center p-4 overflow-hidden relative">
          <div
            className={`transition-all duration-300 bg-background shadow-2xl overflow-hidden ${
              deviceMode === 'mobile'
                ? 'w-[390px] h-[780px] rounded-[40px] border-[8px] border-slate-700 relative'
                : 'w-full h-full rounded-lg border border-slate-800'
            }`}
          >
            {deviceMode === 'mobile' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-700 rounded-full z-20" />
            )}
            <iframe
              src={previewUrl}
              title="Event Preview"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
