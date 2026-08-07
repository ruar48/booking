<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\RentalRepositoryInterface;
use App\Enums\RentalItemStatus;
use App\Exceptions\InsufficientRentalStockException;
use App\Models\RentalItem;
use App\Models\RentalTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
        $rentalItems = RentalItem::query()
            ->where('status', RentalItemStatus::Active->value)
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
            'duration_type' => ['required', Rule::in(['daily', 'hourly'])],
            'duration_hours' => ['required_if:duration_type,hourly', 'nullable', 'integer', 'min:1', 'max:12'],
            'reserved_for' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $user = $request->user();
        $rentalItem = RentalItem::query()->findOrFail($validated['rental_item_id']);

        $durationType = $validated['duration_type'];
        $durationHours = $durationType === 'hourly' ? (int) $validated['duration_hours'] : null;
        $depositAmount = round((float) ($rentalItem->deposit ?? 0) * $validated['quantity'], 2);

        $reservedFor = filled($validated['reserved_for'] ?? null)
            ? Carbon::parse($validated['reserved_for'])->startOfDay()
            : null;

        if ($reservedFor && ! $reservedFor->isToday()) {
            $this->rentalRepository->reserve([
                ['rental_item_id' => $rentalItem->id, 'quantity' => $validated['quantity']],
            ], [
                'staff' => $user,
                'renter_id' => $user->id,
                'duration_type' => $durationType,
                'duration_hours' => $durationHours,
                'reserved_for' => $reservedFor,
                'deposit_amount' => $depositAmount,
            ]);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('Reservation requested for :date. Staff will confirm it closer to the date.', [
                    'date' => $reservedFor->format('M j'),
                ]),
            ]);

            return to_route('rentals.mine');
        }

        $now = now();

        if ($durationType === 'hourly') {
            $dueAt = $now->clone()->addHours($durationHours);
        } else {
            $dueAt = $now->clone()->addHours(24);
        }

        try {
            $this->rentalRepository->checkout([
                ['rental_item_id' => $rentalItem->id, 'quantity' => $validated['quantity']],
            ], [
                'staff' => $user,
                'renter_id' => $user->id,
                'due_at' => $dueAt,
                'duration_type' => $durationType,
                'duration_hours' => $durationHours,
                'deposit_amount' => $depositAmount,
            ]);
        } catch (InsufficientRentalStockException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Item rented! Check "My rentals" for details.')]);

        return to_route('rentals.mine');
    }
}
