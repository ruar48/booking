import { Head, Link, router, useForm, usePoll } from '@inertiajs/react';
import { format, isSameDay, isToday, isYesterday, parseISO, differenceInCalendarDays } from 'date-fns';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Circle,
    Clock,
    ExternalLink,
    FileText,
    Link2,
    Mail,
    MessageCircle,
    Phone,
    Search,
    SendHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';

import { useMessengerInboxChannel } from '@/hooks/use-messenger-inbox-channel';
import { cn } from '@/lib/utils';
import { index as inboxIndex, read, reply, show } from '@/routes/admin/messenger';

type ConversationSummary = {
    id: number;
    name: string;
    avatarUrl: string | null;
    preview: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
    linkedUser: { id: number; name: string } | null;
    windowOpen: boolean;
};

type Attachment = { type: string; url: string | null; title?: string };

type ThreadMessage = {
    id: number;
    direction: 'inbound' | 'outbound';
    source: 'customer' | 'reply' | 'page_inbox' | 'notification' | 'announcement' | 'system';
    sourceLabel: string;
    status: 'received' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    text: string | null;
    attachments: Attachment[];
    sentBy: string | null;
    error: string | null;
    sentAt: string;
};

type Thread = {
    id: number;
    name: string;
    avatarUrl: string | null;
    linkedUser: { id: number; name: string; email: string; phone: string | null } | null;
    lastInboundAt: string | null;
    canReply: boolean;
    usesHumanAgentTag: boolean;
    replyWindowEndsAt: string | null;
    messages: ThreadMessage[];
};

type Props = {
    available: boolean;
    conversations: ConversationSummary[];
    active: Thread | null;
};

const RELOAD_PROPS = ['conversations', 'active', 'messengerUnread'];
const MESSENGER_BLUE = 'bg-[linear-gradient(160deg,#0a7cff_0%,#0866ff_45%,#7a3cff_100%)]';

export default function MessengerInbox({ available, conversations, active }: Props) {
    const [search, setSearch] = useState('');

    // Instant over Pusher; the poll covers a missed event or no websocket.
    useMessengerInboxChannel(() => router.reload({ only: RELOAD_PROPS }));
    usePoll(15000, { only: RELOAD_PROPS });

    const activeSummary = conversations.find((conversation) => conversation.id === active?.id);
    const activeUnread = activeSummary?.unreadCount ?? 0;

    // Opening a chat marks it read here and shows "Seen" in Messenger. Done
    // with a POST from the open thread, never on page load, so a prefetched
    // link can't mark something read that nobody looked at.
    useEffect(() => {
        if (!active || activeUnread === 0 || document.visibilityState !== 'visible') {
            return;
        }

        router.post(read(active.id).url, {}, { preserveScroll: true, preserveState: true, only: RELOAD_PROPS });
    }, [active?.id, activeUnread]); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return term === ''
            ? conversations
            : conversations.filter(
                  (conversation) =>
                      conversation.name.toLowerCase().includes(term) ||
                      conversation.linkedUser?.name.toLowerCase().includes(term),
              );
    }, [conversations, search]);

    return (
        <>
            <Head title={active ? `${active.name} · Messenger` : 'Messenger'} />

            <div className="flex h-[calc(100dvh-8rem)] min-h-[520px] overflow-hidden rounded-2xl border bg-background shadow-xs">
                {/* Conversation list — the whole screen on phones until a chat is open. */}
                <aside
                    className={cn(
                        'flex w-full flex-col border-r md:w-80 md:shrink-0 lg:w-96',
                        active ? 'hidden md:flex' : 'flex',
                    )}
                >
                    <div className="space-y-3 border-b px-4 pt-4 pb-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold tracking-tight">Chats</h1>
                            <span className="text-muted-foreground text-xs">Facebook Page</span>
                        </div>
                        <label className="bg-muted flex items-center gap-2 rounded-full px-3 py-2">
                            <Search className="text-muted-foreground size-4 shrink-0" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search Messenger"
                                className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                            />
                        </label>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {!available && (
                            <Notice>
                                Messenger isn&apos;t connected to a Facebook Page yet. Add the MESSENGER_* settings and run{' '}
                                <code className="text-xs">php artisan messenger:setup</code>.
                            </Notice>
                        )}

                        {available && filtered.length === 0 && (
                            <Notice>
                                {search ? 'No chats match your search.' : 'No chats yet. Messages sent to your Facebook Page will appear here.'}
                            </Notice>
                        )}

                        {filtered.map((conversation) => (
                            <ConversationRow
                                key={conversation.id}
                                conversation={conversation}
                                active={conversation.id === active?.id}
                            />
                        ))}
                    </div>
                </aside>

                <section className={cn('min-w-0 flex-1 flex-col', active ? 'flex' : 'hidden md:flex')}>
                    {active ? (
                        <ThreadView key={active.id} thread={active} />
                    ) : (
                        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                            <div className={cn(MESSENGER_BLUE, 'flex size-16 items-center justify-center rounded-full text-white')}>
                                <MessageCircle className="size-8" fill="currentColor" strokeWidth={0} />
                            </div>
                            <p className="text-foreground font-medium">Select a chat</p>
                            <p className="max-w-xs text-sm">
                                Customer messages, booking updates and Open Play announcements all live here.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function ConversationRow({ conversation, active }: { conversation: ConversationSummary; active: boolean }) {
    const unread = conversation.unreadCount > 0;

    return (
        <Link
            href={show(conversation.id).url}
            preserveScroll
            className={cn(
                'flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors',
                active ? 'bg-[#0866ff]/10 dark:bg-[#0866ff]/20' : 'hover:bg-muted',
            )}
        >
            <ChatAvatar name={conversation.name} url={conversation.avatarUrl} size="lg" online={conversation.windowOpen} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <p className={cn('truncate text-[15px]', unread ? 'font-bold' : 'font-medium')}>{conversation.name}</p>
                    {conversation.linkedUser && (
                        <span title={`Linked to ${conversation.linkedUser.name}'s account`}>
                            <Link2 className="text-muted-foreground size-3.5 shrink-0" />
                        </span>
                    )}
                </div>
                <p className={cn('flex gap-1 truncate text-[13px]', unread ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                    <span className="truncate">{conversation.preview ?? ''}</span>
                    {conversation.lastMessageAt && (
                        <span className="shrink-0">· {listTime(conversation.lastMessageAt)}</span>
                    )}
                </p>
            </div>
            {unread && <span className="size-3 shrink-0 rounded-full bg-[#0866ff]" aria-label={`${conversation.unreadCount} unread`} />}
        </Link>
    );
}

function ThreadView({ thread }: { thread: Thread }) {
    const scroller = useRef<HTMLDivElement>(null);
    const form = useForm({ text: '' });

    const lastMessageId = thread.messages.at(-1)?.id;

    // Stick to the newest message, like Messenger.
    useEffect(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    }, [lastMessageId]);

    // Only the most recent outgoing message shows its status, and the most
    // recent one they've read carries their "Seen" avatar.
    const lastOutboundId = [...thread.messages].reverse().find((message) => message.direction === 'outbound')?.id;
    const lastReadId = [...thread.messages]
        .reverse()
        .find((message) => message.direction === 'outbound' && message.status === 'read')?.id;

    const submit = (event?: FormEvent) => {
        event?.preventDefault();

        if (form.data.text.trim() === '' || form.processing) {
            return;
        }

        form.post(reply(thread.id).url, {
            preserveScroll: true,
            only: RELOAD_PROPS,
            onSuccess: () => form.reset('text'),
        });
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
        }
    };

    return (
        <>
            <header className="flex items-center gap-3 border-b px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <Link href={inboxIndex().url} className="hover:bg-muted rounded-full p-1.5 md:hidden" aria-label="Back to chats">
                    <ArrowLeft className="size-5 text-[#0866ff]" />
                </Link>
                <ChatAvatar name={thread.name} url={thread.avatarUrl} online={thread.canReply} />
                <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{thread.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                        {thread.lastInboundAt ? `Last message ${relativeShort(thread.lastInboundAt)}` : 'Has not messaged the Page yet'}
                    </p>
                </div>
                {thread.linkedUser && (
                    <div className="text-muted-foreground hidden items-center gap-3 text-xs lg:flex">
                        <span className="flex items-center gap-1">
                            <Link2 className="size-3.5" />
                            {thread.linkedUser.name}
                        </span>
                        <a href={`mailto:${thread.linkedUser.email}`} className="hover:text-foreground flex items-center gap-1">
                            <Mail className="size-3.5" />
                            {thread.linkedUser.email}
                        </a>
                        {thread.linkedUser.phone && (
                            <a href={`tel:${thread.linkedUser.phone}`} className="hover:text-foreground flex items-center gap-1">
                                <Phone className="size-3.5" />
                                {thread.linkedUser.phone}
                            </a>
                        )}
                    </div>
                )}
            </header>

            <div ref={scroller} className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 sm:px-5">
                {thread.messages.length === 0 && (
                    <p className="text-muted-foreground py-10 text-center text-sm">No messages yet.</p>
                )}

                {thread.messages.map((message, index) => {
                    const previous = thread.messages[index - 1];
                    const next = thread.messages[index + 1];
                    const newDay = !previous || !isSameDay(parseISO(previous.sentAt), parseISO(message.sentAt));
                    const groupedWithPrevious = !newDay && previous?.direction === message.direction && previous.source === message.source;
                    const groupedWithNext =
                        next !== undefined &&
                        next.direction === message.direction &&
                        next.source === message.source &&
                        isSameDay(parseISO(next.sentAt), parseISO(message.sentAt));

                    return (
                        <div key={message.id}>
                            {newDay && <DayDivider at={message.sentAt} />}
                            <MessageBubble
                                message={message}
                                threadName={thread.name}
                                threadAvatar={thread.avatarUrl}
                                showLabel={!groupedWithPrevious}
                                showAvatar={!groupedWithNext}
                                showStatus={message.id === lastOutboundId}
                                showSeen={message.id === lastReadId}
                            />
                        </div>
                    );
                })}
            </div>

            <footer className="border-t px-3 py-3">
                {thread.canReply ? (
                    <>
                        {thread.usesHumanAgentTag && thread.replyWindowEndsAt && (
                            <p className="text-muted-foreground mb-2 text-xs">
                                Sent as a staff reply (Human Agent) · allowed until {format(parseISO(thread.replyWindowEndsAt), 'MMM d, h:mm a')}
                            </p>
                        )}
                        <form onSubmit={submit} className="flex items-end gap-2">
                            <textarea
                                value={form.data.text}
                                onChange={(event) => form.setData('text', event.target.value)}
                                onKeyDown={onKeyDown}
                                rows={1}
                                maxLength={2000}
                                placeholder="Aa"
                                aria-label={`Reply to ${thread.name}`}
                                className="bg-muted placeholder:text-muted-foreground max-h-36 min-h-10 flex-1 resize-none rounded-[20px] px-4 py-2.5 text-[15px] leading-5 outline-none [field-sizing:content]"
                            />
                            <button
                                type="submit"
                                disabled={form.processing || form.data.text.trim() === ''}
                                className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#0866ff] transition hover:bg-[#0866ff]/10 disabled:opacity-40"
                                aria-label="Send"
                            >
                                <SendHorizontal className="size-5" fill="currentColor" />
                            </button>
                        </form>
                        {form.errors.text && <p className="text-destructive mt-1.5 text-xs">{form.errors.text}</p>}
                    </>
                ) : (
                    <div className="bg-muted text-muted-foreground flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm">
                        <Clock className="mt-0.5 size-4 shrink-0" />
                        <p>
                            You can&apos;t reply to this chat right now. Messenger only allows replies within 24 hours of{' '}
                            {thread.name.split(' ')[0]}&apos;s last message. Booking updates still reach them through approved templates.
                        </p>
                    </div>
                )}
            </footer>
        </>
    );
}

function MessageBubble({
    message,
    threadName,
    threadAvatar,
    showLabel,
    showAvatar,
    showStatus,
    showSeen,
}: {
    message: ThreadMessage;
    threadName: string;
    threadAvatar: string | null;
    showLabel: boolean;
    showAvatar: boolean;
    showStatus: boolean;
    showSeen: boolean;
}) {
    const outbound = message.direction === 'outbound';
    const automated = outbound && message.source !== 'reply';
    const button = message.attachments.find((attachment) => attachment.type === 'button');
    const media = message.attachments.filter((attachment) => attachment.type !== 'button');
    const failed = message.status === 'failed';

    const label = outbound
        ? message.source === 'reply'
            ? message.sentBy
            : message.sourceLabel
        : null;

    return (
        <div className={cn('flex flex-col', outbound ? 'items-end' : 'items-start', showLabel && 'mt-3')}>
            {showLabel && label && <p className="text-muted-foreground mb-0.5 px-3 text-[11px]">{label}</p>}

            <div className={cn('flex max-w-[85%] items-end gap-2 sm:max-w-[70%]', outbound && 'flex-row-reverse')}>
                {!outbound && (
                    <div className="w-7 shrink-0">
                        {showAvatar && <ChatAvatar name={threadName} url={threadAvatar} size="sm" />}
                    </div>
                )}

                <div className={cn('flex min-w-0 flex-col gap-1', outbound ? 'items-end' : 'items-start')}>
                    {media.map((attachment, index) => (
                        <MediaAttachment key={index} attachment={attachment} />
                    ))}

                    {message.text && (
                        <div
                            title={format(parseISO(message.sentAt), 'EEE, MMM d · h:mm a')}
                            className={cn(
                                'overflow-hidden rounded-[18px] text-[15px] leading-5 break-words whitespace-pre-wrap',
                                outbound
                                    ? automated
                                        ? 'bg-[#0866ff]/12 text-foreground dark:bg-[#0866ff]/25'
                                        : cn(MESSENGER_BLUE, 'text-white')
                                    : 'bg-muted text-foreground',
                                failed && 'opacity-60',
                            )}
                        >
                            <p className="px-3 py-2">{message.text}</p>
                            {button && (
                                <a
                                    href={button.url ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        'flex items-center justify-center gap-1 border-t px-3 py-2 text-sm font-semibold',
                                        automated || !outbound ? 'border-black/10 text-[#0866ff] dark:border-white/10 dark:text-[#5aa2ff]' : 'border-white/25 text-white',
                                    )}
                                >
                                    {button.title}
                                    <ExternalLink className="size-3 opacity-70" />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {outbound && (
                    <div className="flex w-4 shrink-0 justify-center pb-0.5">
                        {showStatus && !showSeen && <StatusIcon status={message.status} />}
                    </div>
                )}
            </div>

            {failed && (
                <p className="text-destructive mt-0.5 flex items-center gap-1 px-3 text-[11px]">
                    <AlertCircle className="size-3" />
                    Not sent{message.error ? ` · ${message.error}` : ''}
                </p>
            )}

            {showSeen && (
                <div className="mt-0.5 flex items-center gap-1 pr-0.5" title={`Seen by ${threadName}`}>
                    <span className="text-muted-foreground text-[11px]">Seen</span>
                    <ChatAvatar name={threadName} url={threadAvatar} size="xs" />
                </div>
            )}
        </div>
    );
}

/**
 * Messenger's own receipt marks: hollow circle while sending, outlined check
 * once sent, filled check once delivered.
 */
function StatusIcon({ status }: { status: ThreadMessage['status'] }) {
    switch (status) {
        case 'sending':
            return <Circle className="text-muted-foreground size-3.5" aria-label="Sending" />;
        case 'sent':
            return <CheckCircle2 className="size-3.5 text-[#0866ff]" aria-label="Sent" />;
        case 'delivered':
            return (
                <CheckCircle2 className="size-3.5 text-white" fill="#0866ff" aria-label="Delivered" />
            );
        case 'failed':
            return <AlertCircle className="text-destructive size-3.5" aria-label="Not sent" />;
        default:
            return null;
    }
}

function MediaAttachment({ attachment }: { attachment: Attachment }) {
    if (attachment.type === 'image' && attachment.url) {
        return (
            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                <img src={attachment.url} alt="Photo" loading="lazy" className="max-h-64 max-w-full rounded-[18px] border object-cover" />
            </a>
        );
    }

    if (attachment.type === 'video' && attachment.url) {
        return <video src={attachment.url} controls className="max-h-64 max-w-full rounded-[18px]" />;
    }

    if (attachment.type === 'audio' && attachment.url) {
        return <audio src={attachment.url} controls className="max-w-full" />;
    }

    return (
        <a
            href={attachment.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-muted flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm"
        >
            <FileText className="size-4" />
            {attachment.type === 'sticker' || attachment.type === 'like' ? 'Sticker' : 'Attachment'}
        </a>
    );
}

function ChatAvatar({
    name,
    url,
    size = 'md',
    online = false,
}: {
    name: string;
    url: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    online?: boolean;
}) {
    const [broken, setBroken] = useState(false);
    const dimension = { xs: 'size-3.5 text-[6px]', sm: 'size-7 text-[11px]', md: 'size-10 text-sm', lg: 'size-12 text-base' }[size];
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <span className="relative inline-flex shrink-0">
            {url && !broken ? (
                <img src={url} alt="" onError={() => setBroken(true)} className={cn(dimension, 'rounded-full object-cover')} />
            ) : (
                <span className={cn(dimension, MESSENGER_BLUE, 'flex items-center justify-center rounded-full font-semibold text-white')}>
                    {size === 'xs' ? '' : initials || '?'}
                </span>
            )}
            {online && (size === 'lg' || size === 'md') && (
                <span
                    className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-background bg-emerald-500"
                    title="Can reply now (messaged in the last 24 hours)"
                />
            )}
        </span>
    );
}

function DayDivider({ at }: { at: string }) {
    const date = parseISO(at);
    const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'EEE, MMM d, yyyy');

    return (
        <p className="text-muted-foreground py-3 text-center text-[11px] font-medium">
            {label} · {format(date, 'h:mm a')}
        </p>
    );
}

function Notice({ children }: { children: ReactNode }) {
    return <p className="text-muted-foreground px-3 py-8 text-center text-sm">{children}</p>;
}

/** "3:45 PM" today, "Tue" this week, "Nov 2" before that — Messenger's list format. */
function listTime(value: string): string {
    const date = parseISO(value);

    if (isToday(date)) {
        return format(date, 'h:mm a');
    }

    return differenceInCalendarDays(new Date(), date) < 7 ? format(date, 'EEE') : format(date, 'MMM d');
}

function relativeShort(value: string): string {
    const date = parseISO(value);

    if (isToday(date)) {
        return `today at ${format(date, 'h:mm a')}`;
    }

    if (isYesterday(date)) {
        return `yesterday at ${format(date, 'h:mm a')}`;
    }

    return format(date, 'MMM d, h:mm a');
}

MessengerInbox.layout = {
    breadcrumbs: [{ title: 'Messenger', href: inboxIndex() }],
};
