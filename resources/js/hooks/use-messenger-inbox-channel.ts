import { useEffect, useRef } from 'react';

import { initEcho } from '@/lib/echo';

type ConversationUpdatedPayload = {
    conversation_id: number;
};

/**
 * Calls back whenever any Messenger conversation changes — a new message, a
 * delivery or read receipt. The inbox also polls, so this only makes it
 * instant; without Pusher configured it does nothing.
 */
export function useMessengerInboxChannel(onUpdate: (conversationId: number) => void): void {
    const callback = useRef(onUpdate);

    useEffect(() => {
        callback.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        const echo = initEcho();

        if (!echo) {
            return;
        }

        const channel = echo.private('messenger.inbox');

        channel.listen('.conversation.updated', (payload: ConversationUpdatedPayload) => {
            callback.current(payload.conversation_id);
        });

        return () => {
            channel.stopListening('.conversation.updated');
            echo.leave('private-messenger.inbox');
        };
    }, []);
}
