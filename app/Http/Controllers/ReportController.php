<?php

namespace App\Http\Controllers;

use App\Models\CourtBooking;
use App\Models\Payment;
use App\Models\Player;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $clubId = $request->integer('club_id') ?: null;

        return Inertia::render('reports/index', [
            'summary' => [
                'players' => Player::query()
                    ->when($clubId, fn ($q) => $q->where('club_id', $clubId))
                    ->count(),
                'bookings' => CourtBooking::query()
                    ->when($clubId, fn ($q) => $q->whereHas('court', fn ($q) => $q->where('club_id', $clubId)))
                    ->count(),
                'payments' => Payment::query()->count(),
            ],
            'filters' => $request->only(['club_id']),
        ]);
    }

    public function export(Request $request, string $format): HttpResponse|StreamedResponse
    {
        $clubId = $request->integer('club_id') ?: null;

        $bookings = CourtBooking::query()
            ->with(['court', 'user'])
            ->when($clubId, fn ($q) => $q->whereHas('court', fn ($q) => $q->where('club_id', $clubId)))
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
                    $booking->court?->name,
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
            $b->court?->name,
            $b->user?->name,
            $b->status->value,
        ))->implode("\n");

        return response($lines, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="bookings.pdf"',
        ]);
    }
}
