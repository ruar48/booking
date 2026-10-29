<?php

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Accounts holding the Player role but no player profile never show up on the
 * Players list. Signup always creates one; this catches accounts that got the
 * role some other way before role changes started creating it too.
 */
return new class extends Migration
{
    public function up(): void
    {
        $userIds = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            // Role rows can outlive a deleted account; only backfill real users.
            ->join('users', 'users.id', '=', 'model_has_roles.model_id')
            ->where('roles.name', Role::Player->value)
            ->where('model_has_roles.model_type', (new User)->getMorphClass())
            ->whereNotExists(fn ($query) => $query
                ->from('players')
                ->whereColumn('players.user_id', 'model_has_roles.model_id'))
            ->distinct()
            ->pluck('users.id');

        $now = now();

        DB::table('players')->insert($userIds->map(fn ($userId) => [
            'user_id' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all());
    }

    public function down(): void
    {
        //
    }
};
