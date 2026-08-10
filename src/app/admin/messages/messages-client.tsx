'use client';

import { useState } from 'react';
import { updateMessageStatus } from './actions';
import { CheckCircle2, Search, MailOpen } from 'lucide-react';

export function MessagesClient({ initialMessages }: { initialMessages: any[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredMessages = messages.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.message?.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdate = async (id: string, status: 'read' | 'resolved') => {
    setLoadingId(id);
    const res = await updateMessageStatus(id, status);
    if (res.success) {
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status } : m));
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search messages by name, email, or content..." 
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Sender</th>
                <th className="px-4 py-3 font-medium w-1/2">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No messages found</td>
                </tr>
              ) : filteredMessages.map((msg) => (
                <tr key={msg.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{msg.name}</div>
                    <div className="text-muted-foreground text-xs">
                      <a href={`mailto:${msg.email}`} className="hover:underline">{msg.email}</a>
                    </div>
                    <div className="text-muted-foreground text-[10px] mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${msg.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        msg.status === 'read' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-2">
                      {msg.status === 'new' && (
                        <button
                          disabled={loadingId === msg.id}
                          onClick={() => handleUpdate(msg.id, 'read')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          <MailOpen className="w-3.5 h-3.5" /> Mark Read
                        </button>
                      )}
                      {msg.status !== 'resolved' && (
                        <button
                          disabled={loadingId === msg.id}
                          onClick={() => handleUpdate(msg.id, 'resolved')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-500/10 text-green-700 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                      )}
                    </div>
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

