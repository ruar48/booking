import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { InertiaEffects } from '@/components/inertia-effects';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
            <InertiaEffects />
        </AuthLayoutTemplate>
    );
}
