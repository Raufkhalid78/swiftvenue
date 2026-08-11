import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface EventFeedbackEmailProps {
  guestName: string;
  eventName: string;
  feedbackUrl: string;
}

export const EventFeedbackEmail = ({
  guestName,
  eventName,
  feedbackUrl,
}: EventFeedbackEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>How was {eventName}? We'd love your feedback!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thanks for attending {eventName}!</Heading>
          <Text style={text}>Hi {guestName},</Text>
          <Text style={text}>
            We hope you had a great time at {eventName}. We would love to hear your thoughts so we can make our next event even better.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={feedbackUrl}>
              Leave Feedback
            </Button>
          </Section>
          <Text style={text}>
            Best regards,<br />
            The SwiftVenue Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  marginTop: '40px',
  marginBottom: '40px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

const h1 = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.2',
  margin: '0 0 20px',
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#0f172a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: '500',
};

export default EventFeedbackEmail;
