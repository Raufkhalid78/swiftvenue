import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
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
  metadataBase: new URL("https://swiftvenuehq.com"),
  applicationName: "SwiftVenue",
  title: "SwiftVenue — Modern Event Management SaaS",
  description: "Seamlessly manage corporate, social, cultural, and educational events with our modern, highly intuitive event platform.",
  keywords: ["SwiftVenue", "event management", "event SaaS", "corporate events", "social events"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-background text-foreground font-inter`}>
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
