<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\RentalRepositoryInterface;
use App\Exceptions\InsufficientRentalStockException;
use App\Exceptions\InvalidRentalStateException;
use App\Http\Requests\ReturnRentalRequest;
use App\Models\RentalTransaction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RentalTransactionController extends Controller
{
    public function __construct(
        private readonly RentalRepositoryInterface $rentalRepository,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', RentalTransaction::class);

        $clubId = $request->integer('club_id') ?: null;

        return Inertia::render('rentals/transactions/index', [
            'transactions' => $this->rentalRepository->paginate(
                clubId: $clubId,
                status: $request->string('status')->value() ?: null,
                search: $request->string('search')->value() ?: null,
                staffId: $request->integer('staff_id') ?: null,
            ),
            'stats' => $this->rentalRepository->stats($clubId),
            'staffOptions' => User::query()
                ->whereIn('id', RentalTransaction::query()
                    ->when($clubId !== null, fn ($query) => $query->where('club_id', $clubId))
                    ->distinct()
                    ->pluck('staff_id'))
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => $request->only(['club_id', 'status', 'search', 'staff_id']),
        ]);
    }

    public function show(RentalTransaction $rentalTransaction): Response
    {
        $this->authorize('view', $rentalTransaction);

        $rentalTransaction->load(['items.rentalItem', 'staff', 'renter']);

        return Inertia::render('rentals/transactions/show', [
            'transaction' => $rentalTransaction,
        ]);
    }

    public function returnItems(ReturnRentalRequest $request, RentalTransaction $rentalTransaction): RedirectResponse
    {
        try {
            $this->rentalRepository->returnItems(
                $rentalTransaction,
                $request->validated('items'),
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Rental items returned.')]);
        } catch (InvalidRentalStateException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);
        }

        return back();
    }

    public function approve(Request $request, RentalTransaction $rentalTransaction): RedirectResponse
    {
        $this->authorize('approve', $rentalTransaction);

        $dueAt = $rentalTransaction->club?->closingTimeOn(now());

        if ($rentalTransaction->duration_type === 'hourly' && $rentalTransaction->duration_hours) {
            $hourly = now()->addHours($rentalTransaction->duration_hours);
            $dueAt = $dueAt && $dueAt->lessThan($hourly) ? $dueAt : $hourly;
        }

        if ($dueAt === null || $dueAt->lessThanOrEqualTo(now())) {
            $dueAt = now()->addHours(24);
        }

        try {
            $this->rentalRepository->approveReservation($rentalTransaction, $request->user(), $dueAt);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Reservation approved and checked out.')]);
        } catch (InvalidRentalStateException|InsufficientRentalStockException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);
        }

        return back();
    }
}
