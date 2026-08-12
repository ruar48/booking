<?php

use App\Models\OpenPlayRegistration;
use App\Models\ResourceBooking;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

$bookingsChannel = function ($user, $id) {
    $booking = ResourceBooking::find($id);

    return $booking && ((int) $user->id === (int) $booking->user_id || $user->isVenueAdmin());
};

$openPlayRegistrationsChannel = function ($user, $id) {
    $registration = OpenPlayRegistration::find($id);

    $playerIds = $user->players()->pluck('id');

    return $registration && ($playerIds->contains($registration->player_id) || $user->isVenueAdmin());
};

Broadcast::channel('bookings.{id}', $bookingsChannel);
Broadcast::channel('open-play-registrations.{id}', $openPlayRegistrationsChannel);

// Broadcast::channel() only registers on the DEFAULT broadcast connection
// (BROADCAST_CONNECTION, i.e. Reverb) — routes/web.php authenticates the
// dedicated payment-notification connection via
// `Broadcast::connection('pusher')->auth($request)`, a separate broadcaster
// instance that never receives the registrations above. Without registering
// the same callbacks on it directly, every pusher channel auth request finds
// no matching pattern and gets rejected with a blanket 403, regardless of
// the requesting user or channel.
Broadcast::connection('pusher')->channel('bookings.{id}', $bookingsChannel);
Broadcast::connection('pusher')->channel('open-play-registrations.{id}', $openPlayRegistrationsChannel);
