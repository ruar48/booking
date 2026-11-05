{{-- Plain-text copy of the e-receipt, for mail apps that don't show HTML. Unescaped: it is never rendered as HTML. --}}
@php
    $width = 40;
    $rendered = [];

    foreach ($receipt['lines'] as $line) {
        $rendered[] = match ($line['kind']) {
            'rule' => str_repeat('-', $width),
            'row' => (function () use ($line, $width): string {
                $dots = max(2, $width - mb_strlen($line['label']) - mb_strlen($line['value']) - 2);

                return $line['label'].' '.str_repeat('.', $dots).' '.$line['value'];
            })(),
            'text' => (! empty($line['indent']) ? '  ' : '').$line['text'],
            'qr' => null,
            default => $line['text'],
        };
    }
@endphp
{!! implode("\n", array_filter($rendered, fn ($text) => $text !== null)) !!}

@if ($receiptUrl)
View your receipt online: {!! $receiptUrl !!}

@endif
Keep this email for your records.
{!! $receipt['venue']['name'] !!} · Thank you for booking with us.
