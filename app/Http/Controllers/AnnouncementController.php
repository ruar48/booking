<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function __construct(
        private readonly AnnouncementRepositoryInterface $announcementRepository,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Announcement::class);

        return Inertia::render('announcements/index', [
            'announcements' => $this->announcementRepository->paginate(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Announcement::class);

        return Inertia::render('announcements/create');
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        if (($data['is_published'] ?? false) && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $announcement = $this->announcementRepository->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Announcement created.')]);

        return to_route('announcements.edit', $announcement);
    }

    public function edit(Announcement $announcement): Response
    {
        $this->authorize('update', $announcement);

        $announcement->load('club');

        return Inertia::render('announcements/edit', [
            'announcement' => $announcement,
        ]);
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        $data = $request->validated();

        if (($data['is_published'] ?? $announcement->is_published) && empty($data['published_at'] ?? $announcement->published_at)) {
            $data['published_at'] = now();
        }

        $this->announcementRepository->update($announcement, $data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Announcement updated.')]);

        return to_route('announcements.edit', $announcement);
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $this->authorize('delete', $announcement);

        $this->announcementRepository->delete($announcement);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Announcement deleted.')]);

        return to_route('announcements.index');
    }
}
