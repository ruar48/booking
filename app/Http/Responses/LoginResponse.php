<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $home = $request->user()?->isVenueAdmin()
            ? route('dashboard')
            : route('bookings.index');

        return redirect()->intended($home);
    }
}
