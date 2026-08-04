<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\ClubValidationRules;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\RecurringScheduleLock;
use App\Models\ScheduleBlock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleSettingController extends Controller
{
    use ClubValidationRules;

    public function index(): Response
    {
        $club = $this->activeClub();

        $resources = $club
            ? $club->resources()->orderBy('resource_number')->get()
            : collect();

        $scheduleBlocks = $club
            ? ScheduleBlock::query()
                ->where('club_id', $club->id)
                ->where('ends_at', '>=', now())
                ->orderBy('starts_at')
                ->with(['resource:id,name', 'creator:id,name'])
                ->get()
            : collect();

        $recurringLocks = $club
            ? RecurringScheduleLock::query()
                ->where('club_id', $club->id)
                ->orderBy('day_of_week')
                ->orderBy('starts_at')
                ->with('resource:id,name')
                ->get()
            : collect();

        return Inertia::render('admin/schedule/index', [
            'club' => $club,
            'resources' => $resources,
            'scheduleBlocks' => $scheduleBlocks,
            'recurringLocks' => $recurringLocks,
        ]);
    }

    public function updateHours(Request $request): RedirectResponse
    {
        $club = $this->activeClub();

        abort_if($club === null, 404);

        $validated = $request->validate($this->operatingHoursRules());

        $club->update(['operating_hours' => $validated['operating_hours'] ?? null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Operating hours updated.')]);

        return back();
    }

    public function storeBlock(Request $request): RedirectResponse
    {
        $club = $this->activeClub();

        abort_if($club === null, 404);

        $validated = $request->validate([
            'resource_id' => ['nullable', 'integer', 'exists:resources,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        ScheduleBlock::query()->create([
            ...$validated,
            'club_id' => $club->id,
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
        $club = $this->activeClub();

        abort_if($club === null, 404);

        $validated = $request->validate([
            'resource_id' => ['nullable', 'integer', 'exists:resources,id'],
            'day_of_week' => ['required', 'integer', 'between:0,6'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $existing = RecurringScheduleLock::query()
            ->where('club_id', $club->id)
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
                'club_id' => $club->id,
                'created_by' => $request->user()->id,
            ]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Time slot locked.')]);
        }

        return back();
    }

    private function activeClub(): ?Club
    {
        return Club::query()
            ->where('is_active', true)
            ->oldest()
            ->first();
    }
}
