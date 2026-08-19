"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { MapPin, Users, Activity, Eye, ShoppingCart, CheckCircle2, Globe2 } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const COUNTRY_NAMES: Record<string, string> = {
  PK: 'Pakistan',
  US: 'United States',
  GB: 'United Kingdom',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
};

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    pageViews: 0,
    checkoutInitiated: 0,
    purchased: 0,
    waitlistJoined: 0,
    conversionRate: 0,
    topCountry: 'N/A',
    topCountryPercent: 0,
  });
  const [funnelData, setFunnelData] = useState<{ name: string; value: number }[]>([]);
  const [geoData, setGeoData] = useState<{ name: string; value: number }[]>([]);
  const [deviceData, setDeviceData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    async function loadRealAnalytics() {
      setLoading(true);
      const supabase = createClient();

      try {
        // 1. Fetch telemetry events & paid orders in parallel
        const [telemetryRes, ordersRes, waitlistRes] = await Promise.all([
          supabase
            .from('event_telemetry')
            .select('event_type, country_code, device_type, referrer, utm_source')
            .eq('event_id', eventId),
          supabase
            .from('orders')
            .select('id, amount, status')
            .eq('event_id', eventId)
            .eq('status', 'paid'),
          supabase
            .from('waitlists')
            .select('id')
            .eq('event_id', eventId)
        ]);

        const telemetry = telemetryRes.data || [];
        const paidOrders = ordersRes.data || [];
        const waitlistItems = waitlistRes.data || [];

        const pageViews = telemetry.filter(t => t.event_type === 'page_view').length;
        const checkoutInitiated = telemetry.filter(t => t.event_type === 'initiate_checkout').length;
        const purchased = paidOrders.length;
        const waitlistJoined = waitlistItems.length;

        const conversionRate = pageViews > 0 ? ((purchased / pageViews) * 100) : (purchased > 0 ? 100 : 0);

        // Group by country
        const countryCounts: Record<string, number> = {};
        telemetry.forEach(t => {
          const c = t.country_code || 'PK';
          countryCounts[c] = (countryCounts[c] || 0) + 1;
        });

        const sortedCountries = Object.entries(countryCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([code, count]) => ({
            name: COUNTRY_NAMES[code] || code,
            value: count,
          }));

        const totalGeoHits = telemetry.length || 1;
        const topCountryEntry = sortedCountries[0];
        const topCountryName = topCountryEntry ? topCountryEntry.name : 'PK';
        const topCountryPercent = topCountryEntry ? Math.round((topCountryEntry.value / totalGeoHits) * 100) : 100;

        // Group by device
        const deviceCounts: Record<string, number> = {};
        telemetry.forEach(t => {
          const d = t.device_type ? (t.device_type.charAt(0).toUpperCase() + t.device_type.slice(1)) : 'Desktop';
          deviceCounts[d] = (deviceCounts[d] || 0) + 1;
        });

        const formattedDevices = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

        setMetrics({
          pageViews,
          checkoutInitiated,
          purchased,
          waitlistJoined,
          conversionRate: Number(conversionRate.toFixed(1)),
          topCountry: topCountryName,
          topCountryPercent,
        });

        setFunnelData([
          { name: 'Page Views', value: pageViews },
          { name: 'Initiated Checkout', value: checkoutInitiated },
          { name: 'Purchased', value: purchased },
        ]);

        setGeoData(sortedCountries.length > 0 ? sortedCountries.slice(0, 5) : [{ name: 'Direct Visits', value: 1 }]);
        setDeviceData(formattedDevices.length > 0 ? formattedDevices : [{ name: 'Desktop', value: 1 }]);
      } catch (err) {
        console.error('Failed to load real analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRealAnalytics();
  }, [eventId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-xl font-bold font-display">Event Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Live telemetry, real conversion funnels, and geographic breakdown.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Page Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold font-display">{metrics.pageViews.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Unique visits & impressions</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Conversion Rate</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            {metrics.conversionRate}%
          </div>
          <p className="text-xs text-muted-foreground">Completed ticket purchases</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Top Region</span>
            <Globe2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold font-display truncate" title={metrics.topCountry}>
            {metrics.topCountry}
          </div>
          <p className="text-xs text-muted-foreground">{metrics.topCountryPercent}% of visitors</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Waitlist Demand</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-display">{metrics.waitlistJoined}</div>
          <p className="text-xs text-muted-foreground">Guests in queue for sold-out tiers</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Funnel Chart */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Live Checkout Funnel</h3>
            <span className="text-xs text-muted-foreground font-mono">Real-time</span>
          </div>

          <div className="h-[280px] w-full">
            {metrics.pageViews > 0 || metrics.purchased > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--foreground)" fontSize={12} width={130} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground text-sm">
                <Eye className="w-8 h-8 opacity-40 mb-2" />
                <p>No traffic recorded yet.</p>
                <p className="text-xs mt-1">Share your event link to start collecting live visitor insights!</p>
              </div>
            )}
          </div>
        </div>

        {/* Real Geographic Pie Chart */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Traffic by Region</h3>
            <span className="text-xs text-muted-foreground font-mono">GeoIP</span>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            {metrics.pageViews > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={geoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {geoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground text-sm">
                <MapPin className="w-8 h-8 opacity-40 mb-2" />
                <p>No regional traffic data yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

