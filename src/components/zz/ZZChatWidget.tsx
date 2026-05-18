import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageSquare, X, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';

interface Msg { role: 'user' | 'assistant'; content: string }

const SUPABASE_URL = "https://hbjobpbiordnwflfhjnu.supabase.co";

export function ZZChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Olá! 👋 Eu sou o **ZZ**, seu assistente financeiro da Balanzzo. Posso analisar suas transações, contas a pagar e fluxo de caixa. O que você quer saber?' },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!user) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/zz-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        const errTxt = await res.text();
        setMessages([...newMessages, { role: 'assistant', content: `⚠️ Não consegui responder agora. (${res.status})` }]);
        console.error('ZZ chat error', errTxt);
        return;
      }

      // Stream SSE OpenAI-compatible
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith('data:')) continue;
          const payload = l.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const obj = JSON.parse(payload);
            const delta = obj?.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: assistantText };
                return copy;
              });
            }
          } catch { /* ignore parse */ }
        }
      }
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Erro de conexão. Tente novamente.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center font-bold text-lg"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          aria-label="Abrir chat ZZ"
        >
          ZZ
        </button>
      )}

      {open && (
        <Card
          className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-md h-[70vh] max-h-[600px] flex flex-col shadow-2xl border-border"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          translate="no"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">ZZ</div>
              <div>
                <p className="font-semibold leading-tight">ZZ — Assistente Balanzzo</p>
                <p className="text-xs text-white/80 leading-tight">Pergunte sobre suas finanças</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                {m.role === 'user' ? (
                  <div className="max-w-[85%] bg-primary text-white rounded-lg px-3 py-2 text-sm">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[90%] text-sm text-foreground">
                    <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_strong]:text-foreground">
                      <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <p className="text-xs text-muted-foreground italic">ZZ está pensando…</p>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Pergunte sobre seus dados…"
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="bg-primary text-white hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
