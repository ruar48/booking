{{--
    The emailed copy of the e-receipt, drawn like the one that prints on the
    checkout page: the little thermal printer, then the paper with the same
    lines (App\Services\PaymentReceiptPresenter builds them for both).
    Email clients can't run the printing animation, so the button opens the
    receipt on the site, where it prints.

    Tables and inline styles only: that is what email clients render reliably.
--}}
@php
    $mono = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono','Courier New',monospace";
    $sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    $ink = '#24221e';
    $muted = '#736d63';
    $refundDue = (bool) $receipt['refund_due'];
    $statusColor = $refundDue ? '#d97706' : '#0f9f6e';
    // Inline attachments (cid:), so they show without "load remote images".
    $qrSrc = isset($message) && $qrPng ? $message->embedData($qrPng, 'receipt-qr.png', 'image/png') : null;
    $logoSrc = isset($message) && is_file($logoPath) ? $message->embed($logoPath) : null;
    $total = '₱'.number_format((float) $receipt['total'], 2);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>{{ $receipt['venue']['name'] }} e-receipt {{ $receipt['reference'] }}</title>
</head>
<body style="margin:0; padding:24px 12px; background-color:#eeeae2; font-family:{{ $sans }};">
{{-- Inbox preview text. --}}
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    {{ $refundDue ? 'Payment received — refund due' : 'Payment complete' }} · {{ $total }} · {{ $receipt['title'] }}
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:400px;">

    {{-- The printer: brand tile, status lights and the display. --}}
    <tr>
        <td style="background-color:#22201d; background-image:linear-gradient(180deg,#2e2b27,#171513); border-radius:22px; padding:14px 14px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="28" style="width:28px;">
                        <div style="width:28px; height:28px; border-radius:6px; background-color:#ffffff; text-align:center; line-height:28px;">
                            @if ($logoSrc)
                                <img src="{{ $logoSrc }}" width="24" height="24" alt="" style="display:inline-block; vertical-align:middle; border:0;">
                            @endif
                        </div>
                    </td>
                    <td align="right" style="font-size:0; line-height:0;">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:6px; background-color:#34d399;"></span>
                        <span style="display:inline-block; width:6px; height:6px; margin-left:5px; border-radius:6px; background-color:{{ $refundDue ? '#fbbf24' : '#34d399' }};"></span>
                    </td>
                </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px; background-color:#0e0d0b; border-radius:12px;">
                <tr>
                    <td style="padding:10px 14px 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="font-family:{{ $sans }}; font-size:13px; font-weight:500; color:#efeadf;">
                                    <span style="color:{{ $refundDue ? '#fbbf24' : '#34d399' }};">&#10004;</span>&nbsp;{{ $refundDue ? 'Payment received' : 'Payment complete' }}
                                </td>
                                <td align="right" style="font-family:{{ $mono }}; font-size:9px; font-weight:600; letter-spacing:0.2em; color:{{ $refundDue ? '#fbbf24' : '#34d399' }};">
                                    {{ $refundDue ? 'REFUND DUE' : 'READY' }}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top:6px; font-family:{{ $mono }}; font-size:11px; color:#a19b8f;">{{ $receipt['reference'] }}</td>
                                <td align="right" style="padding-top:6px; font-family:{{ $mono }}; font-size:14px; font-weight:600; color:#efeadf; white-space:nowrap;">{{ $total }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- The paper slot. --}}
    <tr>
        <td style="padding:0 16px;">
            <div style="height:6px; margin-top:-4px; border-radius:6px; background-color:#050505; font-size:0; line-height:0;">&nbsp;</div>
        </td>
    </tr>

    {{-- The paper. --}}
    <tr>
        <td style="padding:0 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fbf9f4; background-image:linear-gradient(180deg,#f1ece1,#fbf9f4 40px);">
                <tr>
                    <td style="padding:26px 20px 24px; font-family:{{ $mono }}; font-size:12px; line-height:1.5; color:{{ $ink }};">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:{{ $mono }}; font-size:12px; line-height:1.5; color:{{ $ink }};">
                            @foreach ($receipt['lines'] as $line)
                                <tr>
                                    @switch($line['kind'])
                                        @case('heading')
                                            <td align="center" style="padding:1px 0; font-size:15px; font-weight:700; letter-spacing:0.16em; line-height:1.35;">{{ $line['text'] }}</td>
                                            @break
                                        @case('center')
                                            <td align="center" style="padding:1px 0; {{ ! empty($line['spaced']) ? 'font-size:10px; letter-spacing:0.24em;' : 'font-size:11px;' }} {{ ! empty($line['muted']) ? 'color:'.$muted.';' : '' }}">{{ $line['text'] }}</td>
                                            @break
                                        @case('caption')
                                            <td style="padding:1px 0; font-size:10px; letter-spacing:0.2em; color:{{ $muted }};">{{ $line['text'] }}</td>
                                            @break
                                        @case('reference')
                                            <td style="padding:0 0 2px; font-size:20px; font-weight:700; letter-spacing:0.03em; line-height:1.25; word-break:break-all;">{{ $line['text'] }}</td>
                                            @break
                                        @case('status')
                                            <td style="padding:2px 0; font-size:10px; font-weight:700; letter-spacing:0.16em; color:{{ $refundDue ? $statusColor : $ink }};">
                                                <span style="display:inline-block; width:7px; height:7px; margin-right:6px; border-radius:7px; background-color:{{ $statusColor }}; vertical-align:middle;"></span>{{ $line['text'] }}
                                            </td>
                                            @break
                                        @case('text')
                                            <td style="padding:1px 0 1px {{ ! empty($line['indent']) ? '10px' : '0' }}; {{ ! empty($line['strong']) ? 'font-weight:600;' : '' }} {{ ! empty($line['muted']) ? 'color:'.$muted.';' : '' }}">{{ $line['text'] }}</td>
                                            @break
                                        @case('row')
                                            <td style="padding:2px 0;">
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:{{ $mono }}; font-size:12px; color:{{ $ink }}; {{ ! empty($line['strong']) ? 'font-weight:700;' : '' }}">
                                                    <tr>
                                                        <td style="width:1%; white-space:nowrap; vertical-align:bottom; padding-right:6px;">{{ $line['label'] }}</td>
                                                        {{-- The dotted leader between label and value. --}}
                                                        <td style="vertical-align:bottom; padding-bottom:4px;"><div style="border-bottom:1px dotted #b9b09d; min-width:12px; font-size:0; line-height:0;">&nbsp;</div></td>
                                                        <td align="right" style="width:1%; white-space:nowrap; vertical-align:bottom; padding-left:6px;">{{ $line['value'] }}</td>
                                                    </tr>
                                                </table>
                                            </td>
                                            @break
                                        @case('rule')
                                            <td style="padding:8px 0;"><div style="border-top:1px dashed #c4bba9; font-size:0; line-height:0;">&nbsp;</div></td>
                                            @break
                                        @case('note')
                                            <td style="padding:4px 0;"><div style="border:1px solid {{ $ink }}; padding:10px; font-size:11.5px; line-height:1.6;">{{ $line['text'] }}</div></td>
                                            @break
                                        @case('qr')
                                            <td align="center" style="padding:6px 0 2px;">
                                                @if ($qrSrc)
                                                    <img src="{{ $qrSrc }}" width="120" height="120" alt="Receipt verification QR code" style="display:block; margin:0 auto; border:0;">
                                                    <div style="padding-top:4px; font-size:10px; letter-spacing:0.2em; color:{{ $muted }};">{{ $line['caption'] }}</div>
                                                @endif
                                            </td>
                                            @break
                                    @endswitch
                                </tr>
                            @endforeach
                        </table>
                    </td>
                </tr>
            </table>
            {{-- The torn bottom edge: paper with background-coloured notches
                 cut between the teeth. Mail apps without CSS gradients show
                 a plain straight edge instead. --}}
            <div style="height:12px; font-size:0; line-height:0; background-color:#fbf9f4; background-image:linear-gradient(to top right,#eeeae2 50%,transparent 50%),linear-gradient(to top left,#eeeae2 50%,transparent 50%); background-size:12px 12px; background-repeat:repeat-x;">&nbsp;</div>
        </td>
    </tr>

    @if ($receiptUrl)
        <tr>
            <td align="center" style="padding:24px 22px 4px;">
                <a href="{{ $receiptUrl }}" style="display:inline-block; padding:12px 22px; border-radius:999px; background-color:#16a34a; color:#ffffff; font-family:{{ $sans }}; font-size:14px; font-weight:600; text-decoration:none;">View receipt online</a>
            </td>
        </tr>
    @endif

    <tr>
        <td align="center" style="padding:16px 22px 8px; font-family:{{ $sans }}; color:#6b6459; font-size:12px; line-height:1.6;">
            Keep this email for your records &mdash; in Gmail, use <strong>Print &rarr; Save as PDF</strong> to download it.
            <div style="margin-top:12px; color:#9a9286; font-size:11px;">
                {{ $receipt['venue']['name'] }} &middot; Thank you for booking with us.
            </div>
        </td>
    </tr>

</table>
</td>
</tr>
</table>
</body>
</html>
