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
