<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Enums\AnnouncementType;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\OpenPlaySession;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

        return Inertia::render('announcements/create', [
            'openPlaySessions' => $this->openPlaySessionOptions(),
        ]);
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['image', 'image_mode']);
        $data['created_by'] = $request->user()->id;

        if (($data['is_published'] ?? false) && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $data = [...$data, ...$this->resolveImage($request, null, $data)];

        $announcement = $this->announcementRepository->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Announcement created.')]);

        return to_route('announcements.edit', $announcement);
    }

    public function edit(Announcement $announcement): Response
    {
        $this->authorize('update', $announcement);

        return Inertia::render('announcements/edit', [
            'announcement' => $announcement,
            'openPlaySessions' => $this->openPlaySessionOptions(),
        ]);
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        $data = $request->safe()->except(['image', 'image_mode']);

        if (($data['is_published'] ?? $announcement->is_published) && empty($data['published_at'] ?? $announcement->published_at)) {
            $data['published_at'] = now();
        }

        $data = [...$data, ...$this->resolveImage($request, $announcement, $data)];

        $this->announcementRepository->update($announcement, $data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Announcement updated.')]);

        return to_route('announcements.edit', $announcement);
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $this->authorize('delete', $announcement);

        if ($announcement->image_path) {
            Storage::disk('announcements')->delete($announcement->image_path);
        }

        $this->announcementRepository->delete($announcement);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Announcement deleted.')]);

        return to_route('announcements.index');
    }

    /**
     * @return array<int, array{id: int, title: string, starts_at: string}>
     */
    private function openPlaySessionOptions(): array
    {
        return OpenPlaySession::query()
            ->where('starts_at', '>=', now()->subDay())
            ->orderBy('starts_at')
            ->limit(50)
            ->get(['id', 'title', 'starts_at'])
            ->map(fn (OpenPlaySession $session) => [
                'id' => $session->id,
                'title' => $session->title,
                'starts_at' => $session->starts_at->toIso8601String(),
            ])
            ->all();
    }

    /**
     * Resolves the announcement's image based on the chosen image mode —
     * a freshly uploaded file, a server-generated QR code pointing at the
     * linked Open Play session's join page, or none — cleaning up whatever
     * file previously lived on disk in the process.
     *
     * @param  array<string, mixed>  $data
     * @return array{image_path: string|null, image_source: string|null}
     */
    private function resolveImage(Request $request, ?Announcement $existing, array $data): array
    {
        $mode = $request->input('image_mode', 'none');
        $previousPath = $existing?->image_path;
        $file = $request->file('image');

        if ($mode === 'upload') {
            if ($file) {
                $path = $file->store('', 'announcements');

                if ($previousPath) {
                    Storage::disk('announcements')->delete($previousPath);
                }

                return ['image_path' => $path, 'image_source' => 'upload'];
            }

            if ($previousPath && $existing?->image_source === 'upload') {
                return ['image_path' => $previousPath, 'image_source' => 'upload'];
            }

            return ['image_path' => null, 'image_source' => null];
        }

        if ($mode === 'auto_qr'
            && ($data['type'] ?? null) === AnnouncementType::OpenPlay->value
            && ! empty($data['open_play_session_id'])
        ) {
            $session = OpenPlaySession::find($data['open_play_session_id']);

            if ($session) {
                $joinUrl = route('open-play.join', $session);

                $qrCode = new QrCode(data: $joinUrl, size: 600, margin: 16);
                $png = (new PngWriter)->write($qrCode)->getString();

                $filename = 'qr-'.Str::uuid().'.png';
                Storage::disk('announcements')->put($filename, $png);

                if ($previousPath) {
                    Storage::disk('announcements')->delete($previousPath);
                }

                return ['image_path' => $filename, 'image_source' => 'auto_qr'];
            }
        }

        if ($previousPath) {
            Storage::disk('announcements')->delete($previousPath);
        }

        return ['image_path' => null, 'image_source' => null];
    }
}
