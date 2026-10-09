<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gallery\StoreGalleryPhotoRequest;
use App\Http\Requests\Gallery\UpdateGalleryPhotoRequest;
use App\Models\GalleryPhoto;
use App\Services\GalleryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class GalleryPhotoController extends Controller
{
    public function __construct(
        private readonly GalleryService $gallery,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', GalleryPhoto::class);

        return Inertia::render('admin/gallery/index', [
            'photos' => $this->gallery->all(),
            'categories' => $this->gallery->categories(),
            'maxUploadBytes' => $this->gallery->maxUploadBytes(),
        ]);
    }

    public function store(StoreGalleryPhotoRequest $request): RedirectResponse
    {
        try {
            $count = $this->gallery->upload(
                $request->file('photos'),
                $request->validated('caption'),
                $request->validated('gallery_category_id'),
                $request->user(),
            );
        } catch (\Throwable $e) {
            Log::error('gallery.upload_failed', ['exception' => $e]);

            Inertia::flash('toast', ['type' => 'error', 'message' => __("Couldn't upload the photos. Please try again.")]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => trans_choice('{1} Photo uploaded.|[2,*] :count photos uploaded.', $count),
        ]);

        return to_route('admin.gallery.index');
    }

    public function update(UpdateGalleryPhotoRequest $request, GalleryPhoto $galleryPhoto): RedirectResponse
    {
        $galleryPhoto->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Photo updated.')]);

        return to_route('admin.gallery.index');
    }

    public function destroy(GalleryPhoto $galleryPhoto): RedirectResponse
    {
        $this->authorize('delete', $galleryPhoto);

        $this->gallery->delete($galleryPhoto);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Photo deleted.')]);

        return to_route('admin.gallery.index');
    }
}
