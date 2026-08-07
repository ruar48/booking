<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\SaleRepositoryInterface;
use App\Models\Payment;
use App\Models\Player;
use App\Models\ResourceBooking;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        private readonly SaleRepositoryInterface $saleRepository,
    ) {}

    public function sales(Request $request): InertiaResponse
    {
        $this->authorize('viewAny', Sale::class);

        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : Carbon::now()->subDays(30)->startOfDay();
        $end = $request->filled('end') ? Carbon::parse($request->input('end')) : Carbon::now()->endOfDay();

        return Inertia::render('pos/reports', [
            'report' => $this->saleRepository->salesReport($start, $end),
            'filters' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
        ]);
    }

    public function index(Request $request): InertiaResponse
    {
        return Inertia::render('reports/index', [
            'summary' => [
                'players' => Player::query()->count(),
                'bookings' => ResourceBooking::query()->count(),
                'payments' => Payment::query()->count(),
            ],
        ]);
    }

    public function export(Request $request, string $format): HttpResponse|StreamedResponse
    {
        $bookings = ResourceBooking::query()
            ->with(['resource', 'user'])
            ->latest('starts_at')
            ->get();

        return match ($format) {
            'csv' => $this->exportCsv($bookings),
            'excel' => $this->exportCsv($bookings, 'bookings.xls'),
            'pdf' => $this->exportPdf($bookings),
            default => abort(404),
        };
    }

    private function exportCsv($bookings, string $filename = 'bookings.csv'): StreamedResponse
    {
        return Response::streamDownload(function () use ($bookings): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Court', 'User', 'Starts At', 'Ends At', 'Status', 'Amount']);

            foreach ($bookings as $booking) {
                fputcsv($handle, [
                    $booking->id,
                    $booking->resource?->name,
                    $booking->user?->name,
                    $booking->starts_at?->toDateTimeString(),
                    $booking->ends_at?->toDateTimeString(),
                    $booking->status->value,
                    $booking->amount,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function exportPdf($bookings): HttpResponse
    {
        $lines = $bookings->map(fn ($b) => sprintf(
            '#%d %s - %s (%s)',
            $b->id,
            $b->resource?->name,
            $b->user?->name,
            $b->status->value,
        ))->implode("\n");

        return response($lines, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="bookings.pdf"',
        ]);
    }
}
