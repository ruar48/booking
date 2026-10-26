<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCoachRequest;
use App\Http\Requests\UpdateCoachRequest;
use App\Models\Coach;
use App\Services\CoachService;
use App\Services\GalleryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CoachController extends Controller
{
    public function __construct(
        private readonly CoachService $coaches,
        private readonly GalleryService $gallery,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Coach::class);

        return Inertia::render('coaches/index', [
            'coaches' => $this->coaches->all(),
            'maxUploadBytes' => $this->gallery->maxUploadBytes(),
        ]);
    }

    public function store(StoreCoachRequest $request): RedirectResponse
    {
        try {
            $this->coaches->create($request->validated(), $request->file('photo'));
        } catch (\Throwable $e) {
            Log::error('coach.create_failed', ['exception' => $e]);

            Inertia::flash('toast', ['type' => 'error', 'message' => __("Couldn't save the coach. Please try again.")]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Coach added.')]);

        return to_route('coaches.index');
    }

    public function update(UpdateCoachRequest $request, Coach $coach): RedirectResponse
    {
        try {
            $this->coaches->update($coach, $request->validated(), $request->file('photo'));
        } catch (\Throwable $e) {
            Log::error('coach.update_failed', ['coach_id' => $coach->id, 'exception' => $e]);

            Inertia::flash('toast', ['type' => 'error', 'message' => __("Couldn't save the coach. Please try again.")]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Coach updated.')]);

        return to_route('coaches.index');
    }

    public function destroy(Coach $coach): RedirectResponse
    {
        $this->authorize('delete', $coach);

        $this->coaches->delete($coach);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Coach removed.')]);

        return to_route('coaches.index');
    }
}
