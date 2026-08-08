import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="text-4xl font-display font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last Updated: August 2026</p>

        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
          <p>
            At SwiftVenue, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our platform.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us when you register for an account, create an event, purchase a ticket, or communicate with us. This includes:
          </p>
          <ul>
            <li><strong>Personal Data:</strong> Name, email address, phone number, and billing information.</li>
            <li><strong>Event Data:</strong> Information you input when creating or managing an event.</li>
            <li><strong>Attendee Data:</strong> Information provided by guests when they RSVP or purchase tickets.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide, operate, and maintain our platform.</li>
            <li>Process transactions and send related information (e.g., tickets, receipts).</li>
            <li>Send administrative information, such as updates, security alerts, and support messages.</li>
            <li>Respond to your comments, questions, and requests.</li>
          </ul>

          <h2>3. Data Security</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>
            We use third-party payment processors (such as Safepay) to process financial transactions. Your payment information is provided directly to our third-party processors, whose use of your personal information is governed by their Privacy Policy.
          </p>

          <h2>5. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:privacy@swiftvenuehq.com">privacy@swiftvenuehq.com</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
