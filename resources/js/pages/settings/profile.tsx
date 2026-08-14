import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Calendar, Camera, Check, Mail, User, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAvatarFallback } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
    birthdate,
    gender,
    avatarUrl,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    birthdate?: string | null;
    gender?: string | null;
    avatarUrl?: string | null;
}) {
    const { auth } = usePage<PageProps>().props;
    const getAvatarFallback = useAvatarFallback();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        setAvatarPreview((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }

            return URL.createObjectURL(file);
        });
    };

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile information"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    <Avatar className="size-20 overflow-hidden rounded-full ring-4 ring-brand-navy/10">
                                        <AvatarImage
                                            src={avatarPreview ?? avatarUrl ?? undefined}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-full bg-neutral-200 text-lg text-black dark:bg-neutral-700 dark:text-white">
                                            {getAvatarFallback(auth.user.name, gender)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-brand-navy text-white absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full ring-2 ring-background transition-opacity hover:opacity-90"
                                        aria-label="Change photo"
                                    >
                                        <Camera className="size-3.5" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        name="avatar"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="size-4" />
                                        Change photo
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        JPG or PNG, up to 2MB.
                                        <br />
                                        If no photo is set, your initial or gender (M/F)
                                        is shown instead.
                                    </p>
                                    <InputError message={errors.avatar} />
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <div className="relative">
                                        <User className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
                                        <Input
                                            id="name"
                                            className="pl-9"
                                            defaultValue={auth.user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />
                                    </div>

                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <div className="relative">
                                        <Mail className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
                                        <Input
                                            id="email"
                                            type="email"
                                            className="pl-9"
                                            defaultValue={auth.user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />
                                    </div>

                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

<<<<<<< Updated upstream
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="birthdate">Birthdate</Label>

                                    <div className="relative">
                                        <Calendar className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
                                        <Input
                                            id="birthdate"
                                            type="date"
                                            className="pl-9"
                                            defaultValue={birthdate ?? ''}
                                            name="birthdate"
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        Required to join Open Play sessions.
                                    </p>

                                    <InputError message={errors.birthdate} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="gender">Gender</Label>

                                    <div className="relative">
                                        <Users className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
                                        <select
                                            id="gender"
                                            name="gender"
                                            defaultValue={gender ?? ''}
                                            className="border-input dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent py-2 pl-9 pr-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                        >
                                            <option value="">Prefer not to say</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        Used to show M/F on your profile picture when
                                        you haven&apos;t uploaded a photo.
                                    </p>

                                    <InputError message={errors.gender} />
                                </div>
=======
                            <div className="grid gap-2">
                                <Label htmlFor="birthdate">Birthdate</Label>

                                <Input
                                    id="birthdate"
                                    type="date"
                                    className="mt-1 block w-full"
                                    defaultValue={birthdate ?? ''}
                                    name="birthdate"
                                    max={new Date().toISOString().split('T')[0]}
                                />

                                <p className="text-sm text-muted-foreground">
                                    Required to join Open Play sessions.
                                </p>

                                <InputError
                                    className="mt-2"
                                    message={errors.birthdate}
                                />
>>>>>>> Stashed changes
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className="bg-brand-navy hover:bg-brand-navy-light text-white"
                                >
                                    <Check className="size-4" />
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
