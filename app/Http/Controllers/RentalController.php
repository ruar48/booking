<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\RentalRepositoryInterface;
use App\Enums\RentalItemStatus;
use App\Exceptions\InsufficientRentalStockException;
use App\Http\Requests\StoreRentalRequest;
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

        $clubId = $request->integer('club_id') ?: null;

        $rentalItems = RentalItem::query()
            ->when(
                $clubId !== null,
                fn ($query) => $query->where('club_id', $clubId),
            )
            ->where('status', RentalItemStatus::Active->value)
            ->orderBy('name')
            ->get();

        return Inertia::render('rentals/checkout', [
            'rentalItems' => $rentalItems,
            'filters' => [
                'club_id' => $clubId,
            ],
        ]);
    }

    public function store(StoreRentalRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $transaction = $this->rentalRepository->checkout($validated['items'], [
                'club_id' => $validated['club_id'],
                'staff' => $request->user(),
                'renter_id' => $validated['renter_id'] ?? null,
                'renter_name' => $validated['renter_name'] ?? null,
                'due_at' => $validated['due_at'] ?? null,
                'deposit_amount' => $validated['deposit_amount'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]);
        } catch (InsufficientRentalStockException $exception) {
            return back()->withErrors(['items' => $exception->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Items rented out.')]);

        return to_route('rentals.transactions.show', $transaction);
    }
}
