"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function EmbedTestPage() {
  const [embedCode, setEmbedCode] = useState("");
  const [renderCode, setRenderCode] = useState("");

  const defaultEmbed = `<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/sample-slug" width="100%" height="600" style="border: none; border-radius: 12px; max-width: 800px; margin: 0 auto; display: block;" allow="payment"></iframe>`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Embed Widget Tester</h1>
          <p className="text-muted-foreground mt-2">
            Paste your iframe embed code below to test how it will look and behave on an external website.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <label className="text-sm font-medium">Embed Code (HTML)</label>
          <Textarea 
            value={embedCode} 
            onChange={(e) => setEmbedCode(e.target.value)}
            placeholder="Paste your <iframe...> code here"
            className="font-mono h-32"
          />
          <div className="flex gap-2">
            <Button onClick={() => setRenderCode(embedCode)}>Render Widget</Button>
            <Button variant="outline" onClick={() => setEmbedCode(defaultEmbed)}>Load Sample Code</Button>
          </div>
        </div>

        {renderCode && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Live Preview</h2>
            <div className="p-8 bg-white dark:bg-zinc-900 border-2 border-dashed border-border rounded-xl">
              <div dangerouslySetInnerHTML={{ __html: renderCode }} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              The dashed border represents the boundaries of the host website's container.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
