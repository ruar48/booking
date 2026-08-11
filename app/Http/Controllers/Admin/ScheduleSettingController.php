<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RecurringScheduleLock;
use App\Models\Resource;
use App\Models\ScheduleBlock;
use App\Models\Setting;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleSettingController extends Controller
{
    public function index(): Response
    {
        $resources = Resource::query()->orderBy('resource_number')->get();

        $scheduleBlocks = ScheduleBlock::query()
            ->where('ends_at', '>=', now())
            ->orderBy('starts_at')
            ->with(['resource:id,name', 'creator:id,name'])
            ->get();

        $recurringLocks = RecurringScheduleLock::query()
            ->orderBy('day_of_week')
            ->orderBy('starts_at')
            ->with('resource:id,name')
            ->get();

        return Inertia::render('admin/schedule/index', [
            'operatingHours' => $this->operatingHours(),
            'unpaidCancelMinutes' => $this->unpaidCancelMinutes(),
            'resources' => $resources,
            'scheduleBlocks' => $scheduleBlocks,
            'recurringLocks' => $recurringLocks,
        ]);
    }

    public function updateHours(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->operatingHoursRules());

        Setting::query()->updateOrCreate(
            ['group' => 'schedule', 'key' => 'operating_hours'],
            ['value' => $validated['operating_hours'] ?? null],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Operating hours updated.')]);

        return back();
    }

    public function updatePaymentWindow(Request $request): RedirectResponse
    {
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

    public function storeBlock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'resource_id' => ['nullable', 'integer', 'exists:resources,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        ScheduleBlock::query()->create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Schedule block added.')]);

        return back();
    }

    public function destroyBlock(ScheduleBlock $block): RedirectResponse
    {
        $block->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Schedule block removed.')]);

        return back();
    }

    public function toggle(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'resource_id' => ['nullable', 'integer', 'exists:resources,id'],
            'day_of_week' => ['required', 'integer', 'between:0,6'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $existing = RecurringScheduleLock::query()
            ->where('resource_id', $validated['resource_id'] ?? null)
            ->where('day_of_week', $validated['day_of_week'])
            ->where('starts_at', $validated['starts_at'])
            ->where('ends_at', $validated['ends_at'])
            ->first();

        if ($existing) {
            $existing->delete();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Time slot unlocked.')]);
        } else {
            RecurringScheduleLock::query()->create([
                ...$validated,
                'created_by' => $request->user()->id,
            ]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Time slot locked.')]);
        }

        return back();
    }

    private function operatingHours(): ?array
    {
        return Setting::query()
            ->where('group', 'schedule')
            ->where('key', 'operating_hours')
            ->value('value');
    }

    private function unpaidCancelMinutes(): ?int
    {
        $value = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        return $value !== null ? (int) $value : null;
    }

    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    private function operatingHoursRules(): array
    {
        $rules = [
            'operating_hours' => ['nullable', 'array'],
        ];

        foreach ([
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        ] as $day) {
            $rules["operating_hours.{$day}"] = ['nullable', 'array'];
            $rules["operating_hours.{$day}.closed"] = ['nullable', 'boolean'];
            $rules["operating_hours.{$day}.open"] = [
                'nullable',
                'string',
                'date_format:H:i',
                Rule::requiredIf(fn () => ! request()->boolean("operating_hours.{$day}.closed")),
            ];
            $rules["operating_hours.{$day}.close"] = [
                'nullable',
                'string',
                'date_format:H:i',
                Rule::requiredIf(fn () => ! request()->boolean("operating_hours.{$day}.closed")),
            ];
        }

        return $rules;
    }
}
