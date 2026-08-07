<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\RentalItemRepositoryInterface;
use App\Enums\RentalMovementType;
use App\Exceptions\InsufficientRentalStockException;
use App\Http\Requests\StoreRentalItemRequest;
use App\Http\Requests\UpdateRentalItemRequest;
use App\Models\RentalItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RentalItemController extends Controller
{
    public function __construct(
        private readonly RentalItemRepositoryInterface $rentalItemRepository,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', RentalItem::class);

        $outOfStockOnly = $request->boolean('low_stock');

        return Inertia::render('rentals/index', [
            'rentalItems' => $this->rentalItemRepository->paginate(
                search: $request->string('search')->value() ?: null,
                lowStockOnly: $outOfStockOnly,
            ),
            'filters' => [
                'search' => $request->string('search')->value() ?: null,
                'low_stock' => $outOfStockOnly,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', RentalItem::class);

        return Inertia::render('rentals/create');
    }

    public function store(StoreRentalItemRequest $request): RedirectResponse
    {
        $rentalItem = $this->rentalItemRepository->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rental item created.')]);

        return to_route('rental-items.edit', $rentalItem);
    }

    public function edit(RentalItem $rentalItem): Response
    {
        $this->authorize('update', $rentalItem);

        return Inertia::render('rentals/edit', [
            'rentalItem' => $rentalItem,
        ]);
    }

    public function update(UpdateRentalItemRequest $request, RentalItem $rentalItem): RedirectResponse
    {
        $this->rentalItemRepository->update($rentalItem, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rental item updated.')]);

        return to_route('rental-items.edit', $rentalItem);
    }

    public function destroy(RentalItem $rentalItem): RedirectResponse
    {
        $this->authorize('delete', $rentalItem);

        $this->rentalItemRepository->delete($rentalItem);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rental item deleted.')]);

        return to_route('rental-items.index');
    }

    public function adjustStock(Request $request, RentalItem $rentalItem): RedirectResponse
    {
        $this->authorize('adjustStock', $rentalItem);

        $validated = $request->validate([
            'delta' => ['required', 'integer', 'not_in:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $this->rentalItemRepository->adjustAvailability(
                $rentalItem,
                $validated['delta'],
                RentalMovementType::Adjustment,
                $request->user(),
                $validated['reason'] ?? null,
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Availability adjusted.')]);
        } catch (InsufficientRentalStockException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);
        }

        return back();
    }
}
