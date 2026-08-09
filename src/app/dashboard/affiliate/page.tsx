import { getAffiliateData } from './actions';
import { redirect } from 'next/navigation';
import { AffiliateDashboardClient } from './affiliate-client';

export const metadata = {
  title: 'Affiliate Dashboard | SwiftVenue',
  description: 'Manage your SwiftVenue affiliate account, view earnings, and generate your referral code.',
};

export default async function AffiliateDashboardPage() {
  const data = await getAffiliateData();

  if (data.error === 'Unauthorized') {
    redirect('/login');
  }

  if (data.application && data.application.status === 'pending') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Affiliate Dashboard</h1>
        </div>
        <div className="p-12 text-center border border-border/50 rounded-2xl bg-card shadow-sm max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 className="text-2xl font-bold font-display text-foreground">Application Pending</h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Your affiliate application is currently under review by our team. We'll notify you via email once it's approved. Thank you for your patience!
          </p>
        </div>
      </div>
    );
  }

  if (data.error === 'Not an approved affiliate' || !data.application) {
    redirect('/affiliate');
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-3">
              <a
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors duration-200 shrink-0"
                aria-label="Back to Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                <span className="hidden sm:inline font-medium">Back to Dashboard</span>
              </a>
              <div className="w-px h-4 bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald text-primary-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 fill-current"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </div>
                <span className="font-display text-lg font-bold">
                  Swift<span className="text-primary">Venue</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-foreground leading-none">{data.application.name}</span>
                <span className="text-[11px] text-gold leading-none mt-0.5">Affiliate Partner</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Affiliate Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {data.application.name}. Manage your referral code and view your earnings.
            </p>
          </div>

          {!data.stats ? (
            <div className="p-6 text-center text-muted-foreground border border-border rounded-xl">
              Unable to load affiliate stats right now. Please refresh the page.
            </div>
          ) : (
            <AffiliateDashboardClient 
              application={data.application}
              referralCode={data.referralCode}
              commissions={data.commissions || []}
              stats={data.stats}
            />
          )}
        </div>
      </main>
    </div>
  );
}
