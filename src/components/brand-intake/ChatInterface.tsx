'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/types/brand-intake';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center">
              El asistente te va a guiar con preguntas para construir el perfil de marca.
            </p>
          </div>
        ) : null}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
            >
              {/* Strip JSON extraction blocks from display */}
              {msg.content
                .replace(/\{"field":\s*"[^"]+",\s*"value":\s*[\s\S]*?\}/g, '')
                .trim()}
            </div>
          </div>
        ))}

        {isLoading ? (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="flex gap-1">
                <span className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu respuesta... (Enter para enviar)"
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
        />
        <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
