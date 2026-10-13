<?php

namespace App\Providers;

use App\Listeners\LogSuccessfulLogin;
use App\Models\Announcement;
use App\Models\Coach;
use App\Models\GameMatch;
use App\Models\OpenPlaySession;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Tournament;
use App\Models\TrainingSession;
use App\Policies\AnnouncementPolicy;
use App\Policies\CoachPolicy;
use App\Policies\GameMatchPolicy;
use App\Policies\OpenPlaySessionPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\PlayerPolicy;
use App\Policies\ResourceBookingPolicy;
use App\Policies\ResourcePolicy;
use App\Policies\TournamentPolicy;
use App\Policies\TrainingSessionPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    protected array $policies = [
        Player::class => PlayerPolicy::class,
        Resource::class => ResourcePolicy::class,
        ResourceBooking::class => ResourceBookingPolicy::class,
        Tournament::class => TournamentPolicy::class,
        GameMatch::class => GameMatchPolicy::class,
        Announcement::class => AnnouncementPolicy::class,
        OpenPlaySession::class => OpenPlaySessionPolicy::class,
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
        $this->configureMail();
        $this->configureRateLimiting();
    }

    /**
     * Abuse limits for the whole web app. "flood" runs before the session
     * starts so a rejected request costs no session write; "web" runs after
     * it, when the signed-in user is known.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('flood', function (Request $request) {
            // PayMongo retries webhooks from a handful of IPs — never block them.
            if ($request->is('webhooks/*')) {
                return Limit::none();
            }

            // Generous: a whole venue or mobile carrier can share one IP.
            return Limit::perMinute(300)->by('flood|'.$request->ip());
        });

        RateLimiter::for('web', function (Request $request) {
            $user = $request->user();

            if ($request->is('webhooks/*') || ($user?->isVenueAdmin() ?? false)) {
                return Limit::none();
            }

            $limits = [
                $user !== null
                    ? Limit::perMinute(240)->by('web|user|'.$user->id)
                    : Limit::perMinute(120)->by('web|guest|'.$request->ip()),
            ];

            // Each sign-up or reset sends an email — stop bots farming them.
            if ($request->isMethod('POST') && $request->is('register')) {
                $limits[] = Limit::perHour(10)->by('register|'.$request->ip());
            }

            if ($request->isMethod('POST') && $request->is('forgot-password')) {
                $limits[] = Limit::perHour(10)->by('forgot-password|'.$request->ip());
            }

            return $limits;
        });
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

    /**
     * Customize the content of framework-generated emails.
     */
    protected function configureMail(): void
    {
        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            return (new MailMessage)
                ->subject('Verify Your Email Address')
                ->greeting('Hello '.$notifiable->name.'!')
                ->line('Thanks for signing up for '.config('app.name').'. Please confirm your email address to activate your account.')
                ->action('Verify Email Address', $url)
                ->line('This verification link will expire in 60 minutes.')
                ->line("Can't find the email? Check your spam or junk folder — verification emails sometimes end up there by mistake.")
                ->line('If you did not create an account, no further action is required.')
                ->salutation('Regards, '.config('app.name'));
        });
    }
}
