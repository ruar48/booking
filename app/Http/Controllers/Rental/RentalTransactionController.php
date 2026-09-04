<?php

namespace App\Http\Controllers\Rental;

use App\Contracts\Repositories\RentalRepositoryInterface;
use App\Exceptions\InsufficientRentalStockException;
use App\Exceptions\InvalidRentalStateException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rental\ReturnRentalRequest;
use App\Models\RentalTransaction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
                status: $request->string('status')->value() ?: null,
                search: $request->string('search')->value() ?: null,
                staffId: $request->integer('staff_id') ?: null,
            ),
            'stats' => $this->rentalRepository->stats(),
            'staffOptions' => User::query()
                ->whereIn('id', RentalTransaction::query()
                    ->distinct()
                    ->pluck('staff_id'))
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => $request->only(['status', 'search', 'staff_id']),
        ]);
    }

    public function report(Request $request): Response
    {
        $this->authorize('viewAny', RentalTransaction::class);

        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : Carbon::now()->subDays(30)->startOfDay();
        $end = $request->filled('end') ? Carbon::parse($request->input('end')) : Carbon::now()->endOfDay();

        return Inertia::render('rentals/report', [
            'report' => $this->rentalRepository->revenueReport($start, $end),
            'filters' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
        ]);
    }

    public function exportReport(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', RentalTransaction::class);

        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : Carbon::now()->subDays(30)->startOfDay();
        $end = $request->filled('end') ? Carbon::parse($request->input('end')) : Carbon::now()->endOfDay();

        $report = $this->rentalRepository->revenueReport($start, $end);

        $lines = [
            'Rentals Report',
            $start->toFormattedDateString().' - '.$end->toFormattedDateString(),
            '',
            'Revenue: '.number_format($report['kpis']['revenue']['value'], 2),
            'Rentals: '.$report['kpis']['rentals_count']['value'],
            'Avg rental: '.number_format($report['kpis']['avg_rental']['value'], 2),
            'Active rentals: '.$report['kpis']['active_rentals']['value'],
            '',
            'Equipment revenue',
        ];

        foreach ($report['equipment_revenue'] as $item) {
            $lines[] = sprintf('  %s - %d units - %s', $item['rental_item_name'], $item['quantity_rented'], number_format($item['revenue'], 2));
        }

        $content = implode("\n", $lines);

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, 'rentals-report.pdf', [
            'Content-Type' => 'application/pdf',
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

        $dueAt = null;

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
