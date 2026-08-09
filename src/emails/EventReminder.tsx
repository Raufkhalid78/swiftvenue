import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Button,
} from '@react-email/components';

interface EventReminderEmailProps {
  guestName: string;
  eventName: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
}

export const EventReminderEmail = ({
  guestName,
  eventName,
  eventTime,
  venueName,
  venueAddress,
}: EventReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reminder: {eventName} is Tomorrow!</Heading>
          <Text style={text}>Hi {guestName},</Text>
          <Text style={text}>
            This is a quick reminder that you are registered for <strong>{eventName}</strong> happening tomorrow! We're excited to have you join us.
          </Text>

          <Section style={ticketBox}>
            <Text style={ticketTitle}>📅 Event Details</Text>
            <Hr style={hr} />
            <Text style={ticketDetails}>
              <strong>Time:</strong> {eventTime}
            </Text>
            <Text style={ticketDetails}>
              <strong>Location:</strong> {venueName}
            </Text>
            <Text style={ticketDetails}>
              <span style={{ color: '#666' }}>{venueAddress}</span>
            </Text>
          </Section>

          <Text style={text}>
            Please remember to bring your ticket (QR Code) from your original confirmation email for a smooth check-in at the door.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            SwiftVenue • The modern platform for professional events.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default EventReminderEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Ubuntu,sans-serif',
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

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  textAlign: 'center' as const,
};
