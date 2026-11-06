import { Head, router, usePoll } from '@inertiajs/react';
import { Check, CheckCircle2, Copy, ExternalLink, Loader2, MessageCircle, Send, Unlink } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDateTime } from '@/lib/format';
import { connect, destroy, edit, test } from '@/routes/messenger';

type MessengerStatus = {
    available: boolean;
    connected: boolean;
    connectedAt: string | null;
    canMessageNow: boolean;
    /** Fallback for when the link's hidden reference gets lost (FB Lite, chat heads). */
    connectCode: string | null;
};

const MESSENGER_GRADIENT = 'bg-[linear-gradient(135deg,#0866ff_0%,#a033ff_60%,#ff5c87_100%)]';

// Stop waiting for the webhook after this long. The link itself lasts 30 minutes.
const WAIT_LIMIT_MS = 5 * 60 * 1000;

export default function Messenger({ messenger }: { messenger: MessengerStatus }) {
    const [startedWaiting, setWaiting] = useState(false);
    // Done waiting the moment the webhook links the account.
    const waiting = startedWaiting && !messenger.connected;
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);
    const [testing, setTesting] = useState(false);

    // The link is completed by Meta's webhook, not by this page, so poll
    // until the connection shows up.
    const { start, stop } = usePoll(3000, { only: ['messenger'] }, { autoStart: false });

    useEffect(() => {
        if (!waiting) {
            stop();

            return;
        }

        start();
        const timeout = window.setTimeout(() => setWaiting(false), WAIT_LIMIT_MS);

        return () => {
            window.clearTimeout(timeout);
            stop();
        };
    }, [waiting]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <Head title="Messenger notifications" />

            <h1 className="sr-only">Messenger notifications</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Messenger notifications"
                    description="Get booking confirmations, reminders and receipts in Facebook Messenger"
                />

                <Card>
                    <CardContent className="flex flex-col gap-5 py-5">
                        <div className="flex items-start gap-4">
                            <div
                                className={`${MESSENGER_GRADIENT} flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm`}
                            >
                                <MessageCircle className="size-6" fill="currentColor" strokeWidth={0} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium">Facebook Messenger</p>
                                    {messenger.connected ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 className="size-3" />
                                            Connected
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">Not connected</Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    {!messenger.available
                                        ? 'Messenger notifications are not available yet. The venue is still setting them up.'
                                        : messenger.connected
                                          ? `Connected ${formatDateTime(messenger.connectedAt)}. You'll still get emails as usual.`
                                          : 'Connect once and updates arrive as a Messenger chat from our Page, alongside your emails.'}
                                </p>
                            </div>
                        </div>

                        {messenger.available && !messenger.connected && (
                            <div className="flex flex-col gap-3">
                                <Button asChild className={`${MESSENGER_GRADIENT} w-fit text-white hover:opacity-90`}>
                                    <a
                                        href={connect().url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setWaiting(true)}
                                    >
                                        <MessageCircle className="size-4" />
                                        Connect Messenger
                                        <ExternalLink className="size-3.5 opacity-70" />
                                    </a>
                                </Button>

                                {waiting ? (
                                    <p className="text-muted-foreground flex items-start gap-2 text-sm">
                                        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
                                        <span>
                                            Waiting for Messenger… tap <strong className="text-foreground">Get Started</strong>{' '}
                                            (or send any message) in the chat that opened.
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground text-xs">
                                        Opens our Page in Messenger. Tap Get Started and you're done.
                                    </p>
                                )}

                                {messenger.connectCode && (
                                    <ConnectCode code={messenger.connectCode} onCopied={() => setWaiting(true)} />
                                )}
                            </div>
                        )}

                        {messenger.connected && (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    disabled={!messenger.canMessageNow || testing}
                                    title={
                                        messenger.canMessageNow
                                            ? undefined
                                            : 'Send any message to our Page in Messenger first.'
                                    }
                                    onClick={() =>
                                        router.post(test().url, {}, {
                                            preserveScroll: true,
                                            onStart: () => setTesting(true),
                                            onFinish: () => setTesting(false),
                                        })
                                    }
                                >
                                    {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    Send test message
                                </Button>
                                <Button variant="ghost" onClick={() => setConfirmDisconnect(true)}>
                                    <Unlink className="size-4" />
                                    Disconnect
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <MessengerPreview />
            </div>

            <ConfirmDialog
                open={confirmDisconnect}
                onOpenChange={setConfirmDisconnect}
                title="Disconnect Messenger"
                description="You'll stop getting updates in Messenger. Emails and in-app notifications continue."
                confirmLabel="Disconnect"
                variant="destructive"
                onConfirm={() => router.delete(destroy().url, { preserveScroll: true })}
            />
        </>
    );
}

/**
 * For when the button opens Messenger but nothing connects: the hidden
 * reference in the link is lost by FB Lite, chat heads, or a browser signed in
 * as someone else. Sending the code as a normal message works from any app.
 */
function ConnectCode({ code, onCopied }: { code: string; onCopied: () => void }) {
    const [copied, copy] = useClipboard();

    return (
        <div className="bg-muted/50 rounded-xl border border-dashed p-3">
            <p className="text-sm font-medium">Opened Messenger but still not connected?</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
                Send this code to our Page in Messenger (or Facebook Lite). It works for 30 minutes.
            </p>
            <div className="mt-2 flex items-center gap-2">
                <code className="bg-background rounded-lg border px-3 py-1.5 font-mono text-base font-semibold tracking-widest">
                    {code}
                </code>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                        await copy(code);
                        onCopied();
                    }}
                >
                    {copied === code ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied === code ? 'Copied' : 'Copy'}
                </Button>
            </div>
        </div>
    );
}

/**
 * What an update looks like when it lands: a sample of the "booking
 * confirmed" message, drawn as a Messenger chat.
 */
function MessengerPreview() {
    return (
        <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Preview</p>
            <div className="bg-muted/40 rounded-2xl border p-4">
                <div className="flex items-end gap-2">
                    <div
                        className={`${MESSENGER_GRADIENT} flex size-7 shrink-0 items-center justify-center rounded-full text-white`}
                        aria-hidden
                    >
                        <MessageCircle className="size-3.5" fill="currentColor" strokeWidth={0} />
                    </div>
                    <div className="max-w-xs overflow-hidden rounded-2xl rounded-bl-md border bg-white shadow-xs dark:bg-neutral-800">
                        <p className="px-3.5 py-2.5 text-sm leading-snug text-neutral-900 dark:text-neutral-100">
                            Good news, Juan! Your booking for Court 2 on Sat, Nov 7, 6:00 PM to 8:00 PM is
                            confirmed. See you on the court.
                        </p>
                        <div className="border-t px-3.5 py-2 text-center text-sm font-semibold text-[#0866ff] dark:text-[#4d9bff]">
                            View booking
                        </div>
                    </div>
                </div>
                <p className="text-muted-foreground mt-2 pl-9 text-[11px]">Just now</p>
            </div>
        </div>
    );
}

Messenger.layout = {
    breadcrumbs: [{ title: 'Messenger notifications', href: edit() }],
};
