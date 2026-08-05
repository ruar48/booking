<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\RentalRepositoryInterface;
use App\Exceptions\InvalidRentalStateException;
use App\Http\Requests\ReturnRentalRequest;
use App\Models\RentalTransaction;
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

        return Inertia::render('rentals/transactions/index', [
            'transactions' => $this->rentalRepository->paginate(
                clubId: $request->integer('club_id') ?: null,
                status: $request->string('status')->value() ?: null,
            ),
            'filters' => $request->only(['club_id', 'status']),
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
}
