<?php

namespace App\Providers;

use App\Listeners\LogSuccessfulLogin;
use App\Models\Announcement;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\Coach;
use App\Models\Court;
use App\Models\CourtBooking;
use App\Models\GameMatch;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Tournament;
use App\Models\TrainingSession;
use App\Policies\AnnouncementPolicy;
use App\Policies\ClubEventPolicy;
use App\Policies\ClubPolicy;
use App\Policies\CoachPolicy;
use App\Policies\CourtBookingPolicy;
use App\Policies\CourtPolicy;
use App\Policies\GameMatchPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\PlayerPolicy;
use App\Policies\TournamentPolicy;
use App\Policies\TrainingSessionPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    protected array $policies = [
        Club::class => ClubPolicy::class,
        Player::class => PlayerPolicy::class,
        Court::class => CourtPolicy::class,
        CourtBooking::class => CourtBookingPolicy::class,
        Tournament::class => TournamentPolicy::class,
        GameMatch::class => GameMatchPolicy::class,
        Announcement::class => AnnouncementPolicy::class,
        ClubEvent::class => ClubEventPolicy::class,
        Coach::class => CoachPolicy::class,
        TrainingSession::class => TrainingSessionPolicy::class,
        Payment::class => PaymentPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
        $this->configureDefaults();
        $this->configureEventListeners();
    }

    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    protected function configureEventListeners(): void
    {
        Event::listen(Login::class, LogSuccessfulLogin::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
