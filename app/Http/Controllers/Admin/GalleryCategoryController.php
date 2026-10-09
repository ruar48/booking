<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gallery\StoreGalleryCategoryRequest;
use App\Http\Requests\Gallery\UpdateGalleryCategoryRequest;
use App\Models\GalleryCategory;
use App\Services\GalleryService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class GalleryCategoryController extends Controller
{
    public function __construct(
        private readonly GalleryService $gallery,
    ) {}

    public function store(StoreGalleryCategoryRequest $request): RedirectResponse
    {
        GalleryCategory::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category added.')]);

        return to_route('admin.gallery.index');
    }

    public function update(UpdateGalleryCategoryRequest $request, GalleryCategory $galleryCategory): RedirectResponse
    {
        $galleryCategory->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category renamed.')]);

        return to_route('admin.gallery.index');
    }

    public function destroy(GalleryCategory $galleryCategory): RedirectResponse
    {
        $this->authorize('delete', $galleryCategory);

        $this->gallery->deleteCategory($galleryCategory);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category deleted. Its photos are now uncategorized.')]);

        return to_route('admin.gallery.index');
    }
}
