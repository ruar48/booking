import { usePage } from '@inertiajs/react';
import { LifeBuoy, Mail, MessageCircle, Phone, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { chat as supportChat } from '@/routes/support';

const QUICK_PROMPTS = [
    'When is my next booking?',
    'How do I reschedule?',
    'What are your rates?',
];

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const GREETING: ChatMessage = {
    role: 'assistant',
    content:
        "Hi! 👋 I can check your bookings, court availability, rates and venue policies. What do you need?",
};

/**
 * Floating support launcher — a circular button pinned to the bottom-right
 * that opens a chat panel. Messages go to the server-side assistant, which
 * answers from this venue's own data.
 */
export function SupportWidget({
    avoidBottomNav = true,
}: {
    /** Lift the launcher clear of the mobile bottom nav. Pages rendered
     *  without the app shell (e.g. the public landing page) don't have one. */
    avoidBottomNav?: boolean;
} = {}) {
    const { support } = usePage().props;
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const composerRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const email = support?.email ?? null;
    const phone = support?.phone ?? null;

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        composerRef.current?.focus();

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open]);

    // Keep the newest message in view as the thread grows.
    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, sending]);

    const send = async (text: string) => {
        const content = text.trim();

        if (!content || sending) {
            return;
        }

        const next = [...messages, { role: 'user' as const, content }];
        setMessages(next);
        setDraft('');
        setSending(true);

        try {
            const response = await fetch(supportChat().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                    ),
                },
                body: JSON.stringify({
                    // The greeting is ours, not part of the conversation.
                    messages: next.filter((m) => m !== GREETING),
                }),
            });

            const data = (await response.json()) as { message?: string };

            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    content:
                        data.message ??
                        'Sorry, something went wrong. Please try again.',
                },
            ]);
        } catch {
            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    content:
                        'I could not reach the server. Please check your connection and try again.',
                },
            ]);
        } finally {
            setSending(false);
            composerRef.current?.focus();
        }
    };

    return (
        <div
            className={cn(
                'pointer-events-none fixed right-4 z-50 flex flex-col items-end gap-3 md:right-6 md:bottom-6',
                avoidBottomNav ? 'bottom-20' : 'bottom-4',
            )}
        >
            {open ? (
                <div
                    role="dialog"
                    aria-label="Support"
                    className="bg-card pointer-events-auto flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border shadow-2xl"
                >
                    <div className="bg-primary text-primary-foreground flex items-start gap-3 p-4">
                        <div className="bg-primary-foreground/15 flex size-10 shrink-0 items-center justify-center rounded-full">
                            <LifeBuoy className="size-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">Need help?</p>
                            <p className="text-primary-foreground/80 text-xs">
                                Ask about bookings, courts or policies.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close support"
                            className="hover:bg-primary-foreground/15 -mt-1 -mr-1 rounded-md p-1.5 transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div
                        ref={scrollRef}
                        className="h-80 space-y-3 overflow-y-auto p-4"
                    >
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
                                    message.role === 'assistant'
                                        ? 'bg-muted text-foreground rounded-tl-sm'
                                        : 'bg-primary text-primary-foreground ml-auto rounded-tr-sm',
                                )}
                            >
                                {message.content}
                            </div>
                        ))}

                        {sending ? (
                            <div className="bg-muted text-muted-foreground flex w-fit items-center gap-1 rounded-2xl rounded-tl-sm px-3 py-2.5">
                                <Dot delay="0ms" />
                                <Dot delay="150ms" />
                                <Dot delay="300ms" />
                            </div>
                        ) : null}

                        {messages.length === 1 && !sending ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {QUICK_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => send(prompt)}
                                        className="border-primary/25 text-primary hover:bg-primary/5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {email || phone ? (
                        <div className="text-muted-foreground flex items-center gap-3 border-t px-4 py-2 text-xs">
                            <span>Prefer a human?</span>
                            {email ? (
                                <a
                                    href={`mailto:${email}`}
                                    className="hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                    <Mail className="size-3.5" />
                                    Email
                                </a>
                            ) : null}
                            {phone ? (
                                <a
                                    href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                                    className="hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                    <Phone className="size-3.5" />
                                    Call
                                </a>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="bg-muted/40 flex items-end gap-2 border-t p-3">
                        <Textarea
                            ref={composerRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    send(draft);
                                }
                            }}
                            placeholder="Type your message…"
                            rows={1}
                            className="bg-card max-h-24 min-h-9 flex-1 resize-none py-2 text-sm"
                        />
                        <Button
                            type="button"
                            size="icon"
                            className="size-9 shrink-0"
                            disabled={!draft.trim() || sending}
                            onClick={() => send(draft)}
                            aria-label="Send message"
                        >
                            <Send className="size-4" />
                        </Button>
                    </div>
                </div>
            ) : null}

            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-label={open ? 'Close support' : 'Need help? Contact support'}
                aria-expanded={open}
                className={cn(
                    'bg-primary text-primary-foreground pointer-events-auto flex size-14 items-center justify-center rounded-full shadow-lg transition-all',
                    'focus-visible:ring-ring hover:scale-105 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                )}
            >
                {open ? (
                    <X className="size-6" />
                ) : (
                    <MessageCircle className="size-6" />
                )}
            </button>
        </div>
    );
}

function Dot({ delay }: { delay: string }) {
    return (
        <span
            className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
            style={{ animationDelay: delay }}
        />
    );
}
