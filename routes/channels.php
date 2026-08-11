<?php

use App\Models\ResourceBooking;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('bookings.{id}', function ($user, $id) {
    $booking = ResourceBooking::find($id);

    return $booking && ((int) $user->id === (int) $booking->user_id || $user->isVenueAdmin());
});
