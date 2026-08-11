import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { FramerMotionProvider } from "@/components/framer-provider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.swiftvenuehq.com"),
  applicationName: "SwiftVenue",
  title: "SwiftVenue — Modern Event Management SaaS",
  description: "Seamlessly manage corporate, social, cultural, and educational events with our modern, highly intuitive event platform.",
  keywords: ["SwiftVenue", "event management", "event SaaS", "corporate events", "social events"],
  verification: {
    google: "umvhpinZaXIjgZk7G9FO8uaTMLC8wPBGeRQoLnPQPQ4",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SwiftVenue",
  url: "https://www.swiftvenuehq.com",
  logo: "https://www.swiftvenuehq.com/logo.jpg",
  description: "Modern event management and ticketing platform for Pakistani organizers.",
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || ((t === 'system' || !t) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
              } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
              }
            } catch(e) {}
          `,
        }}
      />
      
      {/* Google Analytics 4 */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=G-3GQWSQ4VJF`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-3GQWSQ4VJF');`}
      </Script>

      {/* Organization Structured Data */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <body className={`${inter.variable} ${outfit.variable} antialiased bg-background text-foreground font-inter`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FramerMotionProvider>
            {children}
          </FramerMotionProvider>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              className: 'font-inter text-sm',
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid hsl(var(--border))',
              }
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
