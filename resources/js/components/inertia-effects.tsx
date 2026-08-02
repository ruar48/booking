import { FlashToast } from '@/components/flash-toast';
import { RealtimeNotifications } from '@/components/realtime-notifications';

export function InertiaEffects() {
    return (
        <>
            <FlashToast />
            <RealtimeNotifications />
        </>
    );
}
