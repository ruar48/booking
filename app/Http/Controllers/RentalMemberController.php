<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\RentalRepositoryInterface;
use App\Enums\RentalItemStatus;
use App\Exceptions\InsufficientRentalStockException;
use App\Models\RentalItem;
use App\Models\RentalTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RentalMemberController extends Controller
{
    public function __construct(
        private readonly RentalRepositoryInterface $rentalRepository,
    ) {}

    public function browse(Request $request): Response
    {
        $user = $request->user();
        $clubIds = $user->clubs()->pluck('clubs.id');

        $rentalItems = RentalItem::query()
            ->whereIn('club_id', $clubIds)
            ->where('status', RentalItemStatus::Active->value)
            ->with('club:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('rentals/browse', [
            'rentalItems' => $rentalItems,
        ]);
    }

    public function mine(Request $request): Response
    {
        $transactions = RentalTransaction::query()
            ->where('renter_id', $request->user()->id)
            ->with('items')
            ->orderByDesc('rented_at')
            ->get();

        return Inertia::render('rentals/mine', [
            'transactions' => $transactions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'rental_item_id' => ['required', 'integer', Rule::exists(RentalItem::class, 'id')],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $rentalItem = RentalItem::query()->findOrFail($validated['rental_item_id']);

        if (! $user->clubs()->where('clubs.id', $rentalItem->club_id)->exists()) {
            abort(403);
        }

        try {
            $this->rentalRepository->checkout([
                ['rental_item_id' => $rentalItem->id, 'quantity' => $validated['quantity']],
            ], [
                'club_id' => $rentalItem->club_id,
                'staff' => $user,
                'renter_id' => $user->id,
                'deposit_amount' => round((float) ($rentalItem->deposit ?? 0) * $validated['quantity'], 2),
            ]);
        } catch (InsufficientRentalStockException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Item rented! Check "My rentals" for details.')]);

        return to_route('rentals.mine');
    }
}
