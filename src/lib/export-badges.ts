import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface BadgeAttendee {
  id: string;
  guest_name: string;
  guest_email?: string;
  ticket_tier?: string;
  custom_responses?: Record<string, any>;
}

export async function generateBadgePDF({
  eventTitle,
  attendees,
  format = 'grid_6',
}: {
  eventTitle: string;
  attendees: BadgeAttendee[];
  format?: 'grid_6' | 'grid_4';
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  if (format === 'grid_6') {
    // 2 columns x 3 rows (6 badges per A4 sheet)
    // Badge dimension: 90mm width x 80mm height
    const badgeWidth = 90;
    const badgeHeight = 80;
    const marginX = 10;
    const marginY = 15;
    const gapX = 10;
    const gapY = 10;

    let col = 0;
    let row = 0;

    for (let i = 0; i < attendees.length; i++) {
      const attendee = attendees[i];

      if (i > 0 && i % 6 === 0) {
        doc.addPage();
        col = 0;
        row = 0;
      }

      const x = marginX + col * (badgeWidth + gapX);
      const y = marginY + row * (badgeHeight + gapY);

      // Badge Border & Background
      doc.setDrawColor(200, 205, 215);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, badgeWidth, badgeHeight, 3, 3, 'FD');

      // Top Header Pill
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect(x, y, badgeWidth, 14, 3, 3, 'F');
      doc.rect(x, y + 10, badgeWidth, 4, 'F'); // square bottom corners of header

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const truncatedEvent = eventTitle.length > 32 ? eventTitle.slice(0, 30) + '...' : eventTitle;
      doc.text(truncatedEvent.toUpperCase(), x + badgeWidth / 2, y + 9, { align: 'center' });

      // Attendee Name
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const truncatedName = attendee.guest_name.length > 20 ? attendee.guest_name.slice(0, 18) + '...' : attendee.guest_name;
      doc.text(truncatedName, x + 8, y + 30);

      // Company / Title from custom responses if available
      let subTitle = '';
      if (attendee.custom_responses) {
        const companyKey = Object.keys(attendee.custom_responses).find(k => /company|organization|title|role/i.test(k));
        if (companyKey) {
          subTitle = String(attendee.custom_responses[companyKey]);
        }
      }

      if (subTitle) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(subTitle.slice(0, 24), x + 8, y + 37);
      }

      // Ticket Tier Pill
      const tierName = (attendee.ticket_tier || 'GENERAL').toUpperCase();
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x + 8, y + 46, 38, 7, 1.5, 1.5, 'F');
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(tierName.slice(0, 14), x + 27, y + 51, { align: 'center' });

      // QR Code
      try {
        const qrDataUrl = await QRCode.toDataURL(attendee.id, {
          margin: 0,
          width: 150,
        });
        doc.addImage(qrDataUrl, 'PNG', x + badgeWidth - 36, y + 24, 28, 28);
      } catch (err) {
        console.error('QR generation failed for badge:', err);
      }

      // Cut guideline dashes
      doc.setDrawColor(220, 225, 235);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(x, y + badgeHeight, x + badgeWidth, y + badgeHeight);
      doc.line(x + badgeWidth, y, x + badgeWidth, y + badgeHeight);
      doc.setLineDashPattern([], 0); // reset

      col++;
      if (col >= 2) {
        col = 0;
        row++;
      }
    }
  }

  doc.save(`${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_name_badges.pdf`);
}
