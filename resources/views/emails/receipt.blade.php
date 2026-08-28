<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $venueName }} Receipt</title>
</head>
<body style="margin:0; padding:24px 12px; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px; max-width:480px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,0.08);">

    {{-- Header --}}
    <tr>
        <td align="center" style="background-color:#0f172a; padding:32px 24px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" style="width:56px; height:56px; border-radius:999px; background-color:#22c55e; font-size:28px; line-height:56px; color:#ffffff; font-weight:bold;">
                        &#10003;
                    </td>
                </tr>
            </table>
            <div style="margin-top:14px; color:#ffffff; font-size:16px; font-weight:600;">Payment Successful</div>
            <div style="margin-top:4px; color:#94a3b8; font-size:12px;">{{ $paidAt }}</div>
        </td>
    </tr>

    {{-- Amount --}}
    <tr>
        <td align="center" style="padding:28px 24px 20px;">
            <div style="color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.06em;">Amount paid</div>
            <div style="margin-top:6px; color:#0f172a; font-size:36px; font-weight:700;">{{ $currency }} {{ $amount }}</div>
        </td>
    </tr>

    {{-- Dashed divider (ticket-stub style) --}}
    <tr>
        <td style="padding:0 24px;">
            <div style="border-top:1px dashed #cbd5e1;"></div>
        </td>
    </tr>

    {{-- Details --}}
    <tr>
        <td style="padding:22px 24px 6px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px; color:#334155;">
                <tr>
                    <td style="padding:7px 0; color:#94a3b8;">Reference No.</td>
                    <td align="right" style="padding:7px 0; font-weight:600; color:#0f172a;">{{ $invoiceNumber }}</td>
                </tr>
                <tr>
                    <td style="padding:7px 0; color:#94a3b8;">Paid to</td>
                    <td align="right" style="padding:7px 0; font-weight:600; color:#0f172a;">{{ $venueName }}</td>
                </tr>
                <tr>
                    <td style="padding:7px 0; color:#94a3b8;">For</td>
                    <td align="right" style="padding:7px 0; font-weight:600; color:#0f172a;">{{ $itemDescription }}</td>
                </tr>
                @if($itemSchedule)
                <tr>
                    <td style="padding:7px 0; color:#94a3b8;">Schedule</td>
                    <td align="right" style="padding:7px 0; font-weight:600; color:#0f172a;">{{ $itemSchedule }}</td>
                </tr>
                @endif
                <tr>
                    <td style="padding:7px 0; color:#94a3b8;">Payment method</td>
                    <td align="right" style="padding:7px 0; font-weight:600; color:#0f172a;">{{ $paymentMethod }}</td>
                </tr>
                <tr>
                    <td style="padding:7px 0; color:#94a3b8;">Paid by</td>
                    <td align="right" style="padding:7px 0; font-weight:600; color:#0f172a;">{{ $payerName }}</td>
                </tr>
                <tr>
                    <td style="padding:7px 0; color:#94a3b8;">Status</td>
                    <td align="right" style="padding:7px 0;">
                        <span style="display:inline-block; background-color:#dcfce7; color:#15803d; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:0.04em;">Paid</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:6px 24px 0;">
            <div style="border-top:1px dashed #cbd5e1;"></div>
        </td>
    </tr>

    {{-- Footer --}}
    <tr>
        <td align="center" style="padding:20px 24px 30px;">
            <div style="color:#64748b; font-size:12px; line-height:1.6;">
                This is your official receipt for the payment above.<br>
                Keep this email for your records &mdash; in Gmail, use <strong>Print &rarr; Save as PDF</strong> to download it.
            </div>
            <div style="margin-top:14px; color:#94a3b8; font-size:11px;">
                {{ $venueName }} &middot; Thank you for booking with us.
            </div>
        </td>
    </tr>

</table>
</td>
</tr>
</table>
</body>
</html>
