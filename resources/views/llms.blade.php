@php
    $name = config('app.name');
    $sports = collect($courts ?? [])->countBy(fn ($court) => $court['sport'] ?? null)->filter(fn ($count, $sport) => App\Enums\Sport::tryFrom($sport));
@endphp
# {!! $name !!}

> {!! $seo['description'] !!}

@foreach (array_values(array_filter(array_map('trim', explode("\n", $venue['description'] ?? '')))) as $paragraph)
{!! $paragraph !!}

@endforeach
## Venue

@if (! empty($seo['location']))
- Address: {!! $seo['location'] !!}@if (! empty($venue['postal_code'])), {!! $venue['postal_code'] !!}@endif, Philippines
@endif
@if (! empty($venue['phone']))
- Phone: {!! $venue['phone'] !!}
@endif
@if (! empty($venue['email']))
- Email: {!! $venue['email'] !!}
@endif
@foreach ($sports as $sport => $count)
- {!! App\Enums\Sport::from($sport)->label() !!}: {!! $count !!} {!! Illuminate\Support\Str::plural(Illuminate\Support\Str::singular(App\Enums\Sport::from($sport)->unitNoun()), $count) !!}
@endforeach
@if (! empty($venue['amenities']))
- Amenities: {!! implode(', ', $venue['amenities']) !!}
@endif
- Opening hours vary by date; the live booking calendar shows open slots.

## Book and play

- [Book a court]({!! url('/') !!}#explore): pick a date, time and court; pay online to confirm.
- [Open play]({!! url('/') !!}#open-play): join scheduled open play sessions.
- [Create an account]({!! route('register') !!}) or [log in]({!! route('login') !!}) to manage bookings.
@foreach (array_filter([$venue['facebook'] ?? null, $venue['instagram'] ?? null, $venue['youtube'] ?? null]) as $profile)
- {!! $profile !!}
@endforeach
