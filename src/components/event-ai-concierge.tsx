'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, X, Bot, User, Loader2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface EventAiConciergeProps {
  eventId?: string;
  slug?: string;
  eventTitle: string;
}

export function EventAiConcierge({ eventId, slug, eventTitle }: EventAiConciergeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! 👋 I'm your AI Concierge for **${eventTitle}**. Ask me anything about tickets, venue directions, schedule, or speakers!`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const quickQuestions = [
    'Where is the venue located?',
    'What time does it start?',
    'Which ticket tier is best for me?',
    'Is parking available?',
  ];

  async function handleSend(questionText?: string) {
    const textToSend = questionText || input.trim();
    if (!textToSend || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/event-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          slug,
          messages: newMessages,
        }),
      });

      const data = await res.json();
      if (res.status === 429) {
        toast.error(data.error || 'Please slow down a little before sending another message.');
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '⏳ **Too many messages**: You are asking questions a bit quickly. Please wait a few seconds before asking another question.',
          },
        ]);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to get answer');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      toast.error('AI assistant is momentarily busy. Please try again.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I ran into a slight issue connecting to my knowledge base. Please check the details on this page or ask again!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const scrollToTickets = () => {
    // 1. Close assistant drawer
    setIsOpen(false);

    // 2. Find target element across all page templates
    const ticketTarget = 
      document.getElementById('tickets') || 
      document.getElementById('register-section') || 
      document.getElementById('get-tickets-btn') ||
      document.querySelector('[data-tickets-section]');

    if (ticketTarget) {
      ticketTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Trigger registration modal if the button is present
      const btn = (ticketTarget.id === 'get-tickets-btn' 
        ? ticketTarget 
        : (ticketTarget.querySelector('#get-tickets-btn') || ticketTarget.querySelector('button'))) as HTMLButtonElement | null;
      if (btn && !btn.disabled) {
        setTimeout(() => {
          btn.click();
        }, 400);
      }
    } else {
      // Fallback: search any button containing "Get Tickets" or "Tickets"
      const allButtons = Array.from(document.querySelectorAll('button'));
      const getTicketBtn = allButtons.find(b => 
        b.textContent?.toLowerCase().includes('get tickets') || 
        b.textContent?.toLowerCase().includes('reserve') ||
        b.textContent?.toLowerCase().includes('tickets')
      );
      if (getTicketBtn) {
        getTicketBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => getTicketBtn.click(), 400);
      }
    }
  };

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 sm:z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] max-w-[360px] sm:w-[400px] h-[500px] sm:h-[520px] max-h-[75vh] sm:max-h-[85vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight text-white">Event Assistant</h3>
                <p className="text-[11px] text-white/80 leading-tight truncate max-w-[200px]">{eventTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 text-sm bg-muted/20">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none whitespace-pre-wrap'
                      : 'bg-background border border-border text-foreground rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:pl-4 [&_li]:my-0.5 [&_strong]:text-foreground [&_strong]:font-semibold [&_em]:text-muted-foreground">
                      <ReactMarkdown>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-xs text-muted-foreground bg-background p-2.5 rounded-xl border border-border w-max">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                Thinking...
              </div>
            )}
          </div>

          {/* Quick Inquiry Chips */}
          <div className="p-2 border-t border-border bg-background flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-[11px] bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-border"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Action Row & Input */}
          <div className="p-3 bg-card border-t border-border space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about tickets, schedule, venue..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="text-xs h-9"
              />
              <Button
                size="sm"
                className="h-9 px-3 shrink-0"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <button
              onClick={scrollToTickets}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-primary font-medium hover:underline py-1"
            >
              <Ticket className="w-3.5 h-3.5" /> View & Buy Tickets
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full h-12 px-4 shadow-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm border border-primary/20 hover:scale-105 transition-transform"
      >
        <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
        <span>Ask Event AI</span>
      </Button>
    </div>
  );
}
