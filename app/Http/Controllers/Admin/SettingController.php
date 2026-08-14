<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\BookingNotificationSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $settings = Setting::query()
            ->orderBy('group')
            ->orderBy('key')
            ->where(fn ($query) => $query
                ->where('group', '!=', 'bookings')
                ->orWhere('key', '!=', 'unpaid_cancel_minutes'))
            ->where('group', '!=', 'notifications')
            ->get()
            ->groupBy('group');

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
            'unpaidCancelMinutes' => $this->unpaidCancelMinutes(),
            'notificationSettings' => collect(BookingNotificationSettings::EVENT_KEYS)
                ->map(function (string $key) {
                    $config = BookingNotificationSettings::config($key);

                    return [
                        'key' => $key,
                        'enabled' => $config['enabled'],
                        'recipients' => [
                            ...($config['notifyCustomer'] ? ['customer'] : []),
                            ...($config['notifyOwners'] ? ['owners'] : []),
                        ],
                    ];
                })
                ->values(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.group' => ['required', 'string', 'max:100'],
            'settings.*.key' => ['required', 'string', 'max:100'],
            'settings.*.value' => ['nullable'],
        ]);

        foreach ($validated['settings'] as $settingData) {
            Setting::query()->updateOrCreate(
                [
                    'group' => $settingData['group'],
                    'key' => $settingData['key'],
                ],
                [
                    'value' => $settingData['value'] ?? null,
                ],
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings updated.')]);

        return back();
    }

    public function updatePaymentWindow(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $validated = $request->validate([
            'minutes' => ['nullable', 'integer', 'min:1'],
        ]);

        Setting::query()->updateOrCreate(
            ['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'],
            ['value' => $validated['minutes'] ?? null],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment window updated.')]);

        return back();
    }

    public function updateNotifications(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $validated = $request->validate([
            'notifications' => ['required', 'array'],
            'notifications.*.key' => ['required', 'string', 'in:'.implode(',', BookingNotificationSettings::EVENT_KEYS)],
            'notifications.*.enabled' => ['required', 'boolean'],
            'notifications.*.recipients' => ['array'],
            'notifications.*.recipients.*' => ['string', 'in:customer,owners'],
        ]);

        foreach ($validated['notifications'] as $notification) {
            Setting::query()->updateOrCreate(
                ['group' => 'notifications', 'key' => $notification['key']],
                ['value' => [
                    'enabled' => $notification['enabled'],
                    'recipients' => $notification['recipients'] ?? [],
                ]],
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Notification settings updated.')]);

        return back();
    }

    private function unpaidCancelMinutes(): ?int
    {
        $value = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        return $value !== null ? (int) $value : null;
    }
}
