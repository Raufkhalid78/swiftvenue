import { Resend } from 'resend';
import TicketConfirmationEmail from '@/emails/TicketConfirmation';
import WaitlistOfferEmail from '@/emails/WaitlistOffer';

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
  attendeeId,
}: {
  to: string;
  guestName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  orderId: string;
  attendeeId: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Simulating email send to:", to);
    return { id: "mock_id" };
  }

  try {
    const data = await resend.emails.send({
      from: 'SwiftVenue <tickets@swiftvenuehq.com>', // Assuming verified domain
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
        attendeeId,
      }) as React.ReactElement,
    });

    return data;
  } catch (error) {
    console.error("Failed to send ticket confirmation email:", error);
    throw error;
  }
}

export async function sendWaitlistOffer({
  to,
  guestName,
  eventName,
  eventDate,
  eventTime,
  ticketName,
  checkoutUrl,
  expiresAt,
}: {
  to: string;
  guestName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  ticketName: string;
  checkoutUrl: string;
  expiresAt: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Simulating email send to:", to);
    return { id: "mock_id" };
  }

  try {
    const data = await resend.emails.send({
      from: 'SwiftVenue <tickets@swiftvenuehq.com>',
      to: [to],
      subject: `A ticket opened up for ${eventName}!`,
      react: WaitlistOfferEmail({
        guestName,
        eventName,
        eventDate,
        eventTime,
        ticketName,
        checkoutUrl,
        expiresAt,
      }) as React.ReactElement,
    });

    return data;
  } catch (error) {
    console.error("Failed to send waitlist offer email:", error);
    throw error;
  }
}
import EventReminderEmail from '@/emails/EventReminder';

export async function sendEventReminderEmail({
  to,
  guestName,
  eventName,
  eventTime,
  venueName,
  venueAddress,
}: {
  to: string;
  guestName: string;
  eventName: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Simulating email send to:', to);
    return { id: 'mock_id' };
  }

  try {
    const data = await resend.emails.send({
      from: 'SwiftVenue <tickets@swiftvenuehq.com>',
      to: [to],
      subject: `Reminder: ${eventName} is Tomorrow!`,
      react: EventReminderEmail({
        guestName,
        eventName,
        eventTime,
        venueName,
        venueAddress,
      }) as React.ReactElement,
    });

    return data;
  } catch (error) {
    console.error('Failed to send event reminder email:', error);
    throw error;
  }
}

import EventFeedbackEmail from '@/emails/EventFeedback';

export async function sendEventFeedbackEmail({
  to,
  guestName,
  eventName,
  feedbackUrl,
}: {
  to: string;
  guestName: string;
  eventName: string;
  feedbackUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Simulating email send to:', to);
    return { id: 'mock_id' };
  }

  try {
    const data = await resend.emails.send({
      from: 'SwiftVenue <tickets@swiftvenuehq.com>',
      to: [to],
      subject: `How was ${eventName}? We'd love your feedback!`,
      react: EventFeedbackEmail({
        guestName,
        eventName,
        feedbackUrl,
      }) as React.ReactElement,
    });

    return data;
  } catch (error) {
    console.error('Failed to send event feedback email:', error);
    throw error;
  }
}

