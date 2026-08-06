import { Resend } from 'resend';
import TicketConfirmationEmail from '@/emails/TicketConfirmation';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export async function sendTicketConfirmation({
  to,
  guestName,
  eventName,
  eventDate,
  eventTime,
  venueName,
  venueAddress,
  orderId,
}: {
  to: string;
  guestName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  orderId: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Simulating email send to:", to);
    return { id: "mock_id" };
  }

  try {
    const data = await resend.emails.send({
      from: 'SwiftVenue <tickets@swiftvenue.com>', // Assuming verified domain
      to: [to],
      subject: `Your ticket for ${eventName}`,
      react: TicketConfirmationEmail({
        guestName,
        eventName,
        eventDate,
        eventTime,
        venueName,
        venueAddress,
        orderId,
      }) as React.ReactElement,
    });

    return data;
  } catch (error) {
    console.error("Failed to send ticket confirmation email:", error);
    throw error;
  }
}
