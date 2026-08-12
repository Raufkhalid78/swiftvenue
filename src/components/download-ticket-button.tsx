"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { getOrderAttendees } from "@/lib/get-order-attendees";

export function DownloadTicketButton({ orderId, removeBranding = false }: { orderId: string, removeBranding?: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const supabase = createClient();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const { event, attendees } = await getOrderAttendees(supabase, orderId);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let currentY = 20;
      let ticketsOnPage = 0;

      for (let i = 0; i < attendees.length; i++) {
        const attendee = attendees[i];

        if (ticketsOnPage >= 3) {
          doc.addPage();
          currentY = 20;
          ticketsOnPage = 0;
        }

        // Generate QR Code
        const qrDataUrl = await QRCode.toDataURL(attendee.id, {
          width: 150,
          margin: 0,
          color: { dark: '#000000', light: '#ffffff' }
        });

        const startX = 15;
        const ticketWidth = 180;
        const ticketHeight = 70;
        const stubWidth = 50;
        const mainWidth = ticketWidth - stubWidth;

        // Draw Ticket Shape & Backgrounds
        // Main part (Dark slate)
        doc.setFillColor(15, 23, 42); // slate-900
        doc.roundedRect(startX, currentY, mainWidth, ticketHeight, 3, 3, 'F');
        
        // Stub part (White with border)
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.5);
        // We draw the stub slightly overlapping the main part to hide the border on the left
        doc.roundedRect(startX + mainWidth, currentY, stubWidth, ticketHeight, 3, 3, 'FD');

        // Draw dashed separator line
        doc.setDrawColor(203, 213, 225);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(startX + mainWidth, currentY + 1, startX + mainWidth, currentY + ticketHeight - 1);
        doc.setLineDashPattern([], 0); // Reset

        // Cutout semicircles at top and bottom of separator
        doc.setFillColor(255, 255, 255);
        doc.circle(startX + mainWidth, currentY, 3, 'F');
        doc.circle(startX + mainWidth, currentY + ticketHeight, 3, 'F');

        // --- MAIN TICKET CONTENT (DARK SIDE) ---
        // Ticket Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(56, 189, 248); // sky-400 (accent)
        doc.text("SWIFTVENUE OFFICIAL TICKET", startX + 10, currentY + 12);

        // Event Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        const titleLines = doc.splitTextToSize(event.title, mainWidth - 20);
        doc.text(titleLines.slice(0, 2), startX + 10, currentY + 22);

        // Date & Venue
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // slate-400
        
        const yDetails = currentY + 38;
        doc.text(`Date: ${event.date} ${event.time ? `• ${event.time}` : ''}`, startX + 10, yDetails);
        
        const venueText = event.venue_name ? `Venue: ${event.venue_name}` : "Venue: TBA";
        doc.text(doc.splitTextToSize(venueText, mainWidth - 20)[0], startX + 10, yDetails + 6);

        // Guest Details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(attendee.guest_name.toUpperCase(), startX + 10, currentY + 58);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`TICKET ID: ${attendee.id.split('-')[0].toUpperCase()}`, startX + 10, currentY + 63);

        // --- STUB CONTENT (LIGHT SIDE) ---
        const stubCenterX = startX + mainWidth + (stubWidth / 2);
        
        // QR Code
        const qrSize = 34;
        doc.addImage(qrDataUrl, 'PNG', stubCenterX - (qrSize / 2), currentY + 10, qrSize, qrSize);

        // Admit One
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("ADMIT ONE", stubCenterX, currentY + 52, { align: 'center' });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(attendee.id.split('-')[0].toUpperCase(), stubCenterX, currentY + 58, { align: 'center' });
        
        if (attendees.length > 1) {
          doc.text(`${i + 1} OF ${attendees.length}`, stubCenterX, currentY + 63, { align: 'center' });
        }

        // Footer Branding (Rendered once per page)
        if (!removeBranding && ticketsOnPage === 0) {
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text("Powered by SwiftVenue", 105, 290, { align: 'center' });
        }

        currentY += ticketHeight + 10;
        ticketsOnPage++;
      }

      // 4. Download
      doc.save(`Tickets-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      toast.success("Ticket downloaded!");
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate ticket");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isGenerating || !orderId || orderId === 'demo-order-id'}
      className="w-full gap-2"
    >
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {isGenerating ? "Generating PDF..." : "Download PDF Ticket"}
    </Button>
  );
}
