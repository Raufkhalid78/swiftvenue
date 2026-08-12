"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";

export function DownloadTicketButton({ orderId }: { orderId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const supabase = createClient();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // 1. Fetch order and event details
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          guest_name,
          guest_email,
          created_at,
          events (
            title,
            date,
            time,
            venue_name,
            venue_address
          )
        `)
        .eq('id', orderId)
        .single();

      if (error || !order) {
        throw new Error("Could not fetch order details");
      }

      const event = Array.isArray(order.events) ? order.events[0] : order.events;
      if (!event) {
        throw new Error("Could not fetch event details");
      }

      // 2. Generate QR Code
      const qrDataUrl = await QRCode.toDataURL(order.id, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // 3. Create PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors and fonts
      doc.setFont("helvetica");
      
      // Header background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');
      
      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("SWIFTVENUE TICKET", 105, 25, { align: 'center' });

      // Event Title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(event.title, 170);
      doc.text(titleLines, 20, 60);

      // Event Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate-500
      
      let yPos = 60 + (titleLines.length * 10);
      
      doc.text(`Date: ${event.date}`, 20, yPos);
      if (event.time) doc.text(`Time: ${event.time}`, 20, yPos + 8);
      
      yPos += 20;
      doc.text("Venue:", 20, yPos);
      doc.setTextColor(15, 23, 42);
      doc.text(event.venue_name || "TBA", 20, yPos + 8);
      if (event.venue_address) {
        doc.setTextColor(100, 116, 139);
        const addressLines = doc.splitTextToSize(event.venue_address, 100);
        doc.text(addressLines, 20, yPos + 16);
      }

      // Attendee Details
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(20, yPos + 35, 190, yPos + 35);
      
      yPos += 50;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("GUEST INFORMATION", 20, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${order.guest_name}`, 20, yPos + 10);
      doc.text(`Email: ${order.guest_email}`, 20, yPos + 18);
      doc.text(`Order ID: ${order.id.split('-')[0].toUpperCase()}`, 20, yPos + 26);

      // QR Code
      doc.addImage(qrDataUrl, 'PNG', 140, yPos - 5, 50, 50);

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Please present this ticket (printed or on your phone) at the venue.", 105, 270, { align: 'center' });
      doc.text("Powered by SwiftVenue", 105, 280, { align: 'center' });

      // 4. Download
      doc.save(`Ticket-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
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
