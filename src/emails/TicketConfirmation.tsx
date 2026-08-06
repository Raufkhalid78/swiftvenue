import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Heading,
  Hr,
  Button,
} from '@react-email/components';

interface TicketConfirmationEmailProps {
  guestName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  orderId: string;
}

export const TicketConfirmationEmail = ({
  guestName,
  eventName,
  eventDate,
  eventTime,
  venueName,
  venueAddress,
  orderId,
}: TicketConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're in!</Heading>
          <Text style={text}>Hi {guestName},</Text>
          <Text style={text}>
            Your payment was successful and your spot for <strong>{eventName}</strong> is confirmed. We can't wait to see you there!
          </Text>

          <Section style={ticketBox}>
            <Text style={ticketTitle}>🎟️ General Admission Ticket</Text>
            <Hr style={hr} />
            <Text style={ticketDetails}>
              <strong>Date:</strong> {eventDate} at {eventTime}
            </Text>
            <Text style={ticketDetails}>
              <strong>Location:</strong> {venueName}
            </Text>
            <Text style={ticketDetails}>
              <span style={{ color: '#666' }}>{venueAddress}</span>
            </Text>
            <Hr style={hr} />
            <Text style={orderIdText}>Order ID: {orderId}</Text>
          </Section>

          <Text style={text}>
            Please keep this email handy, as you may be asked to show your Order ID at the door.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={`https://swiftvenue.com/e/preview-${orderId}`}>
              View Event Details
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            SwiftVenue • The modern platform for professional events.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '40px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: '1px solid #eaeaea',
};

const h1 = {
  color: '#0f172a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  padding: '0',
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
};

const ticketBox = {
  backgroundColor: '#f8fafc',
  border: '2px dashed #cbd5e1',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
};

const ticketTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '0 0 16px',
};

const ticketDetails = {
  fontSize: '15px',
  color: '#0f172a',
  margin: '8px 0',
};

const orderIdText = {
  fontSize: '13px',
  color: '#64748b',
  margin: '16px 0 0',
  fontFamily: 'monospace',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0f172a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  textAlign: 'center' as const,
};
