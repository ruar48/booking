<?php

namespace App\Http\Controllers\Rental;

use App\Contracts\Repositories\RentalRepositoryInterface;
use App\Enums\RentalItemStatus;
use App\Exceptions\InsufficientRentalStockException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rental\StoreRentalRequest;
use App\Models\RentalItem;
use App\Models\RentalTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RentalController extends Controller
{
    public function __construct(
        private readonly RentalRepositoryInterface $rentalRepository,
    ) {}

    public function checkout(Request $request): Response
    {
        $this->authorize('create', RentalTransaction::class);

        $rentalItems = RentalItem::query()
            ->where('status', RentalItemStatus::Active->value)
            ->orderBy('name')
            ->get();

        return Inertia::render('rentals/checkout', [
            'rentalItems' => $rentalItems,
        ]);
    }

    public function store(StoreRentalRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $transaction = $this->rentalRepository->checkout($validated['items'], [
                'staff' => $request->user(),
                'renter_id' => $validated['renter_id'] ?? null,
                'renter_name' => $validated['renter_name'] ?? null,
                'due_at' => $validated['due_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        } catch (InsufficientRentalStockException $exception) {
            return back()->withErrors(['items' => $exception->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Items rented out.')]);

        return to_route('rentals.transactions.show', $transaction);
    }
}
