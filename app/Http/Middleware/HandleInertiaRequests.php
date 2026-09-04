<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => fn () => $this->resolveAuthenticatedUser($request),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
                'toast' => fn () => $request->session()->get('toast'),
            ],
            'notificationsCount' => fn () => $request->user()
                ? $request->user()->unreadNotifications()->count()
                : 0,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'support' => fn () => $this->supportContact(),
        ];
    }

    /**
     * Contact details behind the floating support widget, pulled from the venue
     * profile an admin maintains in settings so the widget never shows a
     * hardcoded address.
     *
     * Shared on every response, so it is cached rather than queried per request.
     * It is also decorative: if the lookup fails the widget just loses its
     * "email us" links, which must never be worth failing the whole page for.
     *
     * @return array{email: string|null, phone: string|null}
     */
    private function supportContact(): array
    {
        try {
            $profile = Cache::remember(
                'venue.support-contact',
                now()->addMinutes(5),
                fn () => Setting::query()
                    ->where('group', 'venue')
                    ->where('key', 'profile')
                    ->value('value') ?? [],
            );
        } catch (\Throwable) {
            return ['email' => null, 'phone' => null];
        }

        return [
            'email' => $profile['email'] ?? null,
            'phone' => $profile['phone'] ?? null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveAuthenticatedUser(Request $request): ?array
    {
        $user = $request->user();

        if ($user === null) {
            return null;
        }

        $user->loadMissing('roles');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar ? Storage::disk('avatars')->url($user->avatar) : null,
            'gender' => $user->players()->value('gender'),
            'email_verified_at' => $user->email_verified_at,
            'last_login_at' => $user->last_login_at,
            'roles' => $user->getRoleNames()->values()->all(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
            'isVenueAdmin' => $user->isVenueAdmin(),
        ];
    }
}
