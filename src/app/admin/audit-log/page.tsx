import { createServiceClient } from '@/lib/supabase/server';
import { FileText, User, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Audit Log | SwiftVenue Admin',
};

export default async function AdminAuditLogPage() {
  const service = createServiceClient();

  const { data: logs } = await service
    .from('admin_audit_log')
    .select(`
      id,
      action,
      target_type,
      target_id,
      details,
      created_at,
      profiles (full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-muted-foreground">A record of all admin actions taken on the platform.</p>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No audit log entries yet.</p>
                    <p className="text-xs mt-1">Admin actions will appear here as they are taken.</p>
                  </td>
                </tr>
              ) : (logs as any[]).map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs">
                        {new Date(log.created_at).toLocaleString('en-PK', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium text-foreground">{(log.profiles as any)?.full_name || 'Admin'}</div>
                        <div className="text-xs text-muted-foreground">{(log.profiles as any)?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <span className="font-medium text-muted-foreground uppercase tracking-wider">{log.target_type}</span>
                      {log.target_id && (
                        <span className="ml-1 font-mono text-foreground/60">#{String(log.target_id).slice(0, 8)}…</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    {log.details ? (
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(log.details, null, 1)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
