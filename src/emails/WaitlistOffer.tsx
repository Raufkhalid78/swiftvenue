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

interface WaitlistOfferEmailProps {
  guestName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  ticketName: string;
  checkoutUrl: string;
  expiresAt: string;
}

export const WaitlistOfferEmail = ({
  guestName,
  eventName,
  eventDate,
  eventTime,
  ticketName,
  checkoutUrl,
  expiresAt,
}: WaitlistOfferEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Good news! A ticket opened up.</Heading>
          <Text style={text}>Hi {guestName},</Text>
          <Text style={text}>
            You were on the waitlist for <strong>{eventName}</strong>, and a spot just became available!
          </Text>

          <Section style={ticketBox}>
            <Text style={ticketTitle}>🎫 {ticketName}</Text>
            <Hr style={hr} />
            <Text style={ticketDetails}>
              <strong>Date:</strong> {eventDate} at {eventTime}
            </Text>
            <Text style={ticketDetails}>
              <strong>Important:</strong> This offer expires at {new Date(expiresAt).toLocaleString()}. 
              If you don't claim it by then, we'll offer the spot to the next person on the waitlist.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={checkoutUrl}>
              Claim Your Ticket
            </Button>
          </Section>

          <Text style={text}>
            If you can no longer attend, you can simply ignore this email.
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

export default WaitlistOfferEmail;

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
