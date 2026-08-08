'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Copy, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Sparkles, 
  Share2, 
  CheckCircle2, 
  MessageSquare,
  TicketIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { updatePayoutDetails, generateReferralCode } from './actions';

interface AffiliateDashboardClientProps {
  application: any;
  referralCode: any;
  commissions: any[];
  stats: {
    totalEarnings: number;
    pendingPayout: number;
    totalSales: number;
  };
}

export function AffiliateDashboardClient({
  application,
  referralCode,
  commissions,
  stats
}: AffiliateDashboardClientProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');

  const handleUpdatePayout = async (formData: FormData) => {
    setLoading(true);
    const res = await updatePayoutDetails(formData);
    setLoading(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Payout details updated successfully!');
    }
  };

  const handleGenerateCode = async (customCode: string) => {
    setGenerating(true);
    const res = await generateReferralCode(customCode);
    setGenerating(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Referral code generated successfully!');
    }
  };

  const copyToClipboard = (text: string, message: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const shareOnWhatsApp = () => {
    if (!referralCode) return;
    const text = encodeURIComponent(`Use my code *${referralCode.code}* on SwiftVenue for 10% off your event ticketing fees! 🎉 https://swiftvenuehq.com`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-emerald-950/20 border-emerald/20 hover:border-emerald/40 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald tracking-wide uppercase">Total Earned</p>
                  <h3 className="text-3xl font-bold font-display mt-2 text-foreground tracking-tight">
                    Rs {stats.totalEarnings.toLocaleString()}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(4,120,87,0.2)]">
                  <DollarSign className="w-6 h-6 text-emerald" />
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>
        
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-amber-950/20 border-gold/20 hover:border-gold/40 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gold tracking-wide uppercase">Pending Payout</p>
                  <h3 className="text-3xl font-bold font-display mt-2 text-foreground tracking-tight">
                    Rs {stats.pendingPayout.toLocaleString()}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Wallet className="w-6 h-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>

        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-blue-950/20 border-blue-500/20 hover:border-blue-500/40 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-400 tracking-wide uppercase">Total Sales</p>
                  <h3 className="text-3xl font-bold font-display mt-2 text-foreground tracking-tight">
                    {stats.totalSales}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>
      </div>

      {/* 2. Referral Code Hero Banner */}
      <m.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
        <div className="relative rounded-3xl p-[1px] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-gold/40 via-emerald/40 to-gold/40 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 animate-gradient-xy" />
          <div className="relative bg-background/90 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-border/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Your Partner Code
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                  Give 10% Off, Earn 30% of Platform Fees
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                  Share this code with event organizers. They get a discount on their premium ticketing platform, and you earn cash for the referral.
                </p>
              </div>

              {referralCode && referralCode.max_uses === null ? (
                <div className="w-full max-w-md space-y-4 pt-4">
                  <div className="relative group/input">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gold to-emerald rounded-xl blur opacity-20 group-hover/input:opacity-40 transition duration-500" />
                    <div className="relative bg-black/50 border border-gold/30 rounded-xl p-4 flex items-center justify-between">
                      <span className="font-mono text-2xl sm:text-3xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-200 to-gold text-center w-full">
                        {referralCode.code}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      className="flex-1 gap-2 bg-foreground text-background hover:bg-muted-foreground"
                      onClick={() => copyToClipboard(referralCode.code, 'Code copied to clipboard!')}
                    >
                      <Copy className="w-4 h-4" /> Copy Code
                    </Button>
                    <Button 
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={shareOnWhatsApp}
                    >
                      <Share2 className="w-4 h-4" /> Share via WhatsApp
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Code usage: {referralCode.current_uses} / Unlimited
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md bg-muted/30 border border-border/50 rounded-2xl p-8 text-center space-y-5">
                  <div className="h-16 w-16 rounded-full bg-emerald/10 flex items-center justify-center mx-auto">
                    <TicketIcon className="w-8 h-8 text-emerald" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Create Your Custom Partner Code</h3>
                    <p className="text-sm text-muted-foreground mt-1">Choose a unique code (e.g. ALIKHAN or WEDS2024). You can only create this once!</p>
                  </div>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Enter custom code..." 
                      className="text-center font-mono font-bold text-lg h-12 uppercase" 
                      value={customCodeInput}
                      onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      maxLength={15}
                    />
                    <Button 
                      onClick={() => handleGenerateCode(customCodeInput)} 
                      disabled={generating || customCodeInput.length < 3}
                      className="w-full bg-gold hover:bg-gold-light text-emerald-dark font-bold py-6 text-lg"
                    >
                      {generating ? 'Saving...' : 'Lock In My Code'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </m.div>

      {/* 3. Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: How to Earn & Settings */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* How to Earn Guide */}
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald to-gold w-full" />
            <CardContent className="p-6 space-y-6 pt-6">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald" />
                How to Earn
              </h3>
              
              <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald/40 before:to-transparent">
                {[
                  { title: "Get Your Code", desc: "Generate your unique 10% discount code." },
                  { title: "Share With Couples", desc: "Share via WhatsApp, Instagram, or your blog." },
                  { title: "Earn Cash", desc: "You earn a 30% commission on the platform fee when they purchase." }
                ].map((step, i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-emerald text-emerald font-bold text-sm z-10 shadow-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="pt-1">
                      <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Collapsible Payout Settings */}
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="settings" className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-emerald" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-foreground">Payout Settings</h3>
                      <p className="text-xs text-muted-foreground font-normal">
                        {application.payout_details ? "Bank / Wallet details configured" : "⚠️ Action Required: Set your payout details"}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      How would you like to receive your commissions? Provide your JazzCash, EasyPaisa, or Bank Account details.
                    </p>
                    <form action={handleUpdatePayout} className="space-y-4">
                      <Textarea 
                        name="payout_details"
                        placeholder="Example:
Bank: Meezan Bank
Title: Ali Khan
IBAN: PK12MEZN000123456789"
                        defaultValue={application.payout_details || ''}
                        className="min-h-[140px] font-mono text-sm bg-background/50 border-gold/20 focus-visible:ring-gold/30"
                        required
                      />
                      <Button type="submit" disabled={loading} className="w-full bg-gold hover:bg-gold-light text-emerald-dark font-bold">
                        {loading ? 'Saving...' : 'Save Payout Details'}
                      </Button>
                    </form>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>

        {/* Right Column: Commission History */}
        <div className="lg:col-span-2">
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
            <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Commission History</h3>
                <p className="text-sm text-muted-foreground mt-1">A detailed record of all your successful referrals.</p>
              </div>
            </div>
            
            <div className="flex-1 p-0 overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Code Used</th>
                    <th className="px-6 py-4 font-semibold text-right">Commission</th>
                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {commissions.length ? (
                    commissions.map((c, i) => (
                      <tr key={c.id} className={`${i % 2 === 0 ? 'bg-background/20' : 'bg-transparent'} hover:bg-muted/30 transition-colors`}>
                        <td className="px-6 py-4 font-medium text-foreground" suppressHydrationWarning>
                          {new Date(c.created_at).toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 font-mono text-muted-foreground">{c.referral_code}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald">
                          + Rs {Number(c.commission_amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                            ${c.status === 'paid' ? 'bg-emerald/10 text-emerald border border-emerald/20' : 
                              c.status === 'cleared' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                              'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <h4 className="text-lg font-bold text-foreground">No sales yet</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Your commission history is empty. Start sharing your referral code with event organizers to earn your first commission!
                          </p>
                          {referralCode && (
                            <Button variant="outline" className="mt-2 gap-2" onClick={shareOnWhatsApp}>
                              <Share2 className="w-4 h-4" /> Share Code Now
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
