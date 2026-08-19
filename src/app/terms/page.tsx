import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="text-4xl font-display font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last Updated: August 2026</p>

        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
          <p>
            Welcome to SwiftVenue. By accessing or using our website, platform, and services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you do not have permission to access the Service.
          </p>

          <h2>1. Use of Service</h2>
          <p>
            SwiftVenue provides an event management platform that allows organizers to create events, sell tickets, and manage attendees. You agree to use the Service only for lawful purposes and in accordance with these Terms.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
          </p>

          <h2>2. User Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
          </p>

          <h2>3. Payments, Fees, and Payouts</h2>
          <p>
            When you sell tickets through SwiftVenue, payments are processed by our third-party payment provider (e.g., Safepay). You agree to comply with the terms and conditions of the payment provider. 
          </p>
          <p>
            <strong>Platform Fees:</strong> SwiftVenue charges a platform fee on all paid ticket sales based on your subscription tier (Free, Pro, or Enterprise). These fees are automatically calculated at checkout and are non-refundable. Free events incur no platform fees.
          </p>
          <p>
            <strong>Subscription Billing:</strong> Upgrades to premium tiers (such as Pro) are billed in advance. All subscription payments are final and non-refundable, except where required by law. If you downgrade, your premium features will remain active until the end of your billing cycle.
          </p>
          <p>
            <strong>Organizer Payouts:</strong> Revenue from ticket sales (minus SwiftVenue platform fees) is accrued in your account balance. We process organizer payouts in weekly batches. To receive your funds, you must provide valid bank, JazzCash, or EasyPaisa account details in your Organizer Settings. SwiftVenue is not responsible for delayed payouts caused by incorrect account details.
          </p>
          <p>
            <strong>Refunds:</strong> Refunds for ticket purchases are handled entirely at the discretion of the event organizer. Organizers are responsible for issuing refunds to their attendees for cancelled or rescheduled events.
          </p>

          <h2>4. Prohibited Uses</h2>
          <p>
            You may use the Service only for lawful purposes. You agree not to use the Service:
          </p>
          <ul>
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
            <li>To impersonate or attempt to impersonate SwiftVenue, a SwiftVenue employee, another user, or any other person or entity.</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of SwiftVenue and its licensors.
          </p>

          <h2>6. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about these Terms, or need to escalate a dispute, please contact our parent company, TechyDez, at:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:hello@techydez.com">hello@techydez.com</a></li>
            <li><strong>Phone:</strong> +447517879333</li>
            <li><strong>Address:</strong> TechyDez, Jhelum, Punjab, Pakistan</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
