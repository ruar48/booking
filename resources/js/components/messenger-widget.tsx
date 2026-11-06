import { Link, usePage } from '@inertiajs/react';
import { BellRing, CheckCircle2, ExternalLink, Loader2, Mail, Phone, Receipt, X } from 'lucide-react';
import { useState } from 'react';

import { MESSENGER_GRADIENT, MessengerBadge } from '@/components/messenger-icon';
import { Button } from '@/components/ui/button';
import { useMessengerPrompt } from '@/hooks/use-messenger-prompt';
import { cn } from '@/lib/utils';
import { login } from '@/routes';

/**
 * Floating Messenger launcher, bottom-right on every customer page.
 *
 * - Signed in, not connected: a callout nudges them to connect, so booking
 *   updates reach them in Messenger. "Not now" hides it for a few days.
 * - Signed in and connected: chat with the venue on Messenger.
 * - Guests: chat with the venue, or log in to get updates.
 *
 * Their chats land in the staff Messenger inbox. Hidden for staff.
 */
export function MessengerWidget({
    avoidBottomNav = true,
}: {
    /** Lift the launcher clear of the mobile bottom nav. Pages rendered
     *  without the app shell (e.g. the public landing page) don't have one. */
    avoidBottomNav?: boolean;
} = {}) {
    const { support, name } = usePage().props;
    const { prompt, needsConnect, shouldNudge, dismiss, waiting, connectHref, startWaiting } = useMessengerPrompt();
    const [open, setOpen] = useState(false);

    if (!prompt?.available) {
        return null;
    }

    const showCallout = shouldNudge && !open;

    return (
        <div
            className={cn(
                'pointer-events-none fixed right-4 z-50 flex flex-col items-end gap-3 md:right-6 md:bottom-6',
                avoidBottomNav ? 'bottom-20' : 'bottom-4',
            )}
        >
            {open && (
                <div
                    role="dialog"
                    aria-label="Messenger"
                    className="pointer-events-auto w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-background shadow-2xl"
                >
                    <div className={cn(MESSENGER_GRADIENT, 'flex items-center gap-3 px-4 py-3.5 text-white')}>
                        <MessengerBadge className="size-10 bg-white/20 bg-none" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{name}</p>
                            <p className="text-xs text-white/85">on Facebook Messenger</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-full p-1.5 transition hover:bg-white/20"
                            aria-label="Close"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="space-y-4 p-4">
                        {needsConnect ? (
                            <>
                                <div>
                                    <p className="font-semibold">Get booking updates on Messenger</p>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Connect once and we&apos;ll message you there — no need to check your email.
                                    </p>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    <Benefit icon={CheckCircle2}>Booking confirmations</Benefit>
                                    <Benefit icon={BellRing}>Reminders before your game</Benefit>
                                    <Benefit icon={Receipt}>Payment receipts</Benefit>
                                </ul>
                                <ConnectButton href={connectHref} onClick={startWaiting} />
                                {waiting && <WaitingNote />}
                            </>
                        ) : prompt.signedIn ? (
                            <>
                                <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4" />
                                    Connected — booking updates arrive in Messenger.
                                </p>
                                <ChatButton href={prompt.chatUrl} />
                            </>
                        ) : (
                            <>
                                <p className="text-muted-foreground text-sm">
                                    Questions about courts, rates or Open Play? Message us on Messenger.
                                </p>
                                <ChatButton href={prompt.chatUrl} />
                                <p className="text-muted-foreground text-center text-xs">
                                    Have an account?{' '}
                                    <Link href={login()} className="text-foreground font-medium underline underline-offset-2">
                                        Log in
                                    </Link>{' '}
                                    to get booking updates on Messenger.
                                </p>
                            </>
                        )}

                        {(support?.email || support?.phone) && (
                            <div className="text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
                                {support.phone && (
                                    <a href={`tel:${support.phone}`} className="hover:text-foreground flex items-center gap-1">
                                        <Phone className="size-3.5" />
                                        {support.phone}
                                    </a>
                                )}
                                {support.email && (
                                    <a href={`mailto:${support.email}`} className="hover:text-foreground flex items-center gap-1">
                                        <Mail className="size-3.5" />
                                        {support.email}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showCallout && (
                <div className="pointer-events-auto relative w-[min(17rem,calc(100vw-2rem))] rounded-2xl border bg-background p-3.5 pr-8 shadow-xl">
                    <button
                        type="button"
                        onClick={dismiss}
                        className="text-muted-foreground hover:bg-muted absolute top-2 right-2 rounded-full p-1"
                        aria-label="Not now"
                    >
                        <X className="size-3.5" />
                    </button>
                    <p className="text-sm font-semibold">Get booking updates on Messenger</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">Confirmations, reminders and receipts, right in your chats.</p>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="mt-2.5 text-sm font-semibold text-[#0866ff] hover:underline dark:text-[#5aa2ff]"
                    >
                        Connect Messenger →
                    </button>
                    {/* Tail pointing at the launcher. */}
                    <span className="absolute -bottom-1.5 right-6 size-3 rotate-45 border-r border-b bg-background" aria-hidden />
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label={open ? 'Close Messenger' : needsConnect ? 'Connect Messenger for booking updates' : 'Chat with us on Messenger'}
                aria-expanded={open}
                className="pointer-events-auto relative rounded-full shadow-lg transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#0866ff]/30 focus-visible:outline-none"
            >
                {open ? (
                    <span className="bg-foreground text-background flex size-14 items-center justify-center rounded-full">
                        <X className="size-6" />
                    </span>
                ) : (
                    <MessengerBadge className="size-14" iconClassName="size-7" />
                )}
                {needsConnect && !open && (
                    <span className="absolute top-0 right-0 size-3.5 rounded-full border-2 border-background bg-red-500" aria-hidden />
                )}
            </button>
        </div>
    );
}

/**
 * Shown after a successful payment until the customer connects: the moment
 * they most want to hear back from us. Hides itself once connected.
 */
export function MessengerConnectCard({ onDismiss }: { onDismiss: () => void }) {
    const { needsConnect, waiting, connectHref, startWaiting } = useMessengerPrompt();

    if (!needsConnect) {
        return null;
    }

    return (
        <div className="w-full rounded-2xl border border-[#0866ff]/20 bg-[#0866ff]/5 p-4 text-left dark:bg-[#0866ff]/10">
            <div className="flex items-start gap-3">
                <MessengerBadge className="size-10" />
                <div className="min-w-0 flex-1">
                    <p className="font-semibold">Get notified on Messenger</p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Connect our Facebook Page so your confirmation, reminders and receipts reach you in Messenger.
                    </p>
                </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <ConnectButton href={connectHref} onClick={startWaiting} />
                <Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground">
                    Maybe later
                </Button>
            </div>
            {waiting && <WaitingNote className="mt-2" />}
        </div>
    );
}

function ConnectButton({ href, onClick }: { href: string; onClick: () => void }) {
    return (
        <Button asChild className={cn(MESSENGER_GRADIENT, 'w-full text-white hover:opacity-90 sm:w-auto')}>
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
                <MessengerBadge className="size-5 bg-white/25 bg-none" />
                Connect Messenger
                <ExternalLink className="size-3.5 opacity-70" />
            </a>
        </Button>
    );
}

function ChatButton({ href }: { href: string | null }) {
    if (!href) {
        return null;
    }

    return (
        <Button asChild className={cn(MESSENGER_GRADIENT, 'w-full text-white hover:opacity-90')}>
            <a href={href} target="_blank" rel="noopener noreferrer">
                <MessengerBadge className="size-5 bg-white/25 bg-none" />
                Chat with us on Messenger
                <ExternalLink className="size-3.5 opacity-70" />
            </a>
        </Button>
    );
}

function WaitingNote({ className }: { className?: string }) {
    return (
        <p className={cn('text-muted-foreground flex items-start gap-2 text-xs', className)}>
            <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
            <span>
                Waiting for Messenger… send any message (or tap <strong className="text-foreground">Get Started</strong>) in
                the chat that opened.
            </span>
        </p>
    );
}

function Benefit({ icon: Icon, children }: { icon: typeof CheckCircle2; children: string }) {
    return (
        <li className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-[#0866ff] dark:text-[#5aa2ff]" />
            {children}
        </li>
    );
}
