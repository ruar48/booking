<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string|null $avatar
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $last_login_at
 * @property string|null $last_login_ip
 * @property Carbon|null $terms_accepted_at
 * @property string|null $terms_version
 * @property string|null $privacy_version
 * @property string|null $messenger_psid
 * @property Carbon|null $messenger_connected_at
 * @property Carbon|null $messenger_last_inbound_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'phone', 'avatar', 'password', 'last_login_at', 'last_login_ip', 'terms_accepted_at', 'terms_version', 'privacy_version'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'last_login_ip', 'messenger_psid'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'last_login_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'messenger_connected_at' => 'datetime',
            'messenger_last_inbound_at' => 'datetime',
        ];
    }

    public function players(): HasMany
    {
        return $this->hasMany(Player::class);
    }

    public function coach(): HasOne
    {
        return $this->hasOne(Coach::class);
    }

    public function resourceBookings(): HasMany
    {
        return $this->hasMany(ResourceBooking::class);
    }

    public function salesAsCashier(): HasMany
    {
        return $this->hasMany(Sale::class, 'cashier_id');
    }

    public function salesAsCustomer(): HasMany
    {
        return $this->hasMany(Sale::class, 'customer_id');
    }

    public function approvedBookings(): HasMany
    {
        return $this->hasMany(ResourceBooking::class, 'approved_by');
    }

    public function tournaments(): HasMany
    {
        return $this->hasMany(Tournament::class, 'created_by');
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'created_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function loginHistories(): HasMany
    {
        return $this->hasMany(LoginHistory::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function refereedMatches(): HasMany
    {
        return $this->hasMany(GameMatch::class, 'referee_id');
    }

    public function isVenueAdmin(): bool
    {
        return $this->hasRole(Role::SuperAdmin->value)
            || $this->hasRole(Role::ClubAdmin->value);
    }

    /**
     * Whether the venue's Page may send this user an ordinary Messenger
     * message. Meta allows it for 24 hours after they last wrote to the Page;
     * a few minutes are shaved off so a send queued right at the edge is not
     * rejected. Outside the window only approved templates go through.
     */
    public function hasOpenMessengerWindow(): bool
    {
        return $this->messenger_last_inbound_at !== null
            && $this->messenger_last_inbound_at->greaterThan(now()->subHours(24)->addMinutes(10));
    }
}
