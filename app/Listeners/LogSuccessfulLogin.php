<?php

namespace App\Listeners;

use App\Models\LoginHistory;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LogSuccessfulLogin
{
    public function __construct(
        private readonly Request $request,
    ) {}

    public function handle(Login $event): void
    {
        $user = $event->user;
        $ipAddress = $this->request->ip();
        $userAgent = $this->request->userAgent();

        LoginHistory::create([
            'user_id' => $user->id,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'device' => $this->parseDevice($userAgent),
            'logged_in_at' => now(),
        ]);

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $ipAddress,
        ])->save();
    }

    private function parseDevice(?string $userAgent): ?string
    {
        if ($userAgent === null) {
            return null;
        }

        $userAgent = Str::lower($userAgent);

        if (Str::contains($userAgent, ['iphone', 'ipad', 'android', 'mobile'])) {
            return 'mobile';
        }

        if (Str::contains($userAgent, ['windows', 'macintosh', 'linux'])) {
            return 'desktop';
        }

        return 'unknown';
    }
}
