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

        $clubId = $request->integer('club_id') ?: null;

        $settings = Setting::query()
            ->when($clubId, fn ($q) => $q->where('club_id', $clubId))
            ->when($clubId === null, fn ($q) => $q->whereNull('club_id'))
            ->orderBy('group')
            ->orderBy('key')
            ->get()
            ->groupBy('group');

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
            'clubId' => $clubId,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $validated = $request->validate([
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'settings' => ['required', 'array'],
            'settings.*.group' => ['required', 'string', 'max:100'],
            'settings.*.key' => ['required', 'string', 'max:100'],
            'settings.*.value' => ['nullable'],
        ]);

        foreach ($validated['settings'] as $settingData) {
            Setting::query()->updateOrCreate(
                [
                    'club_id' => $validated['club_id'] ?? null,
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
