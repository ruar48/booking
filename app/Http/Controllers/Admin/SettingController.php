<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Setting;
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
            ->get()
            ->groupBy('group');

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
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
}
