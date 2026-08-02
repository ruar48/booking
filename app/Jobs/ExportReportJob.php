<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ExportReportJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $parameters
     */
    public function __construct(
        public readonly string $reportType,
        public readonly array $parameters = [],
        public readonly string $disk = 'local',
    ) {}

    public function handle(): string
    {
        $filename = sprintf(
            'reports/%s-%s.json',
            $this->reportType,
            now()->format('Y-m-d_His'),
        );

        $content = json_encode([
            'report_type' => $this->reportType,
            'parameters' => $this->parameters,
            'generated_at' => now()->toIso8601String(),
        ], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT);

        if (! Storage::disk($this->disk)->put($filename, $content)) {
            throw new RuntimeException("Failed to export report to disk [{$this->disk}].");
        }

        return $filename;
    }
}
