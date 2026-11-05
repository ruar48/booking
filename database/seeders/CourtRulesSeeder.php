<?php

namespace Database\Seeders;

use App\Enums\PolicyPlacement;
use App\Models\Policy;
use App\Services\HomePageService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Starter house rules for the "Court rules" policy placement, shown on the
 * home and booking pages, in the FAQ and in the Terms of Service. Admins edit
 * them under Policies like any other policy, one rule per line.
 *
 * The only data the FAQ / Terms / Privacy update needs. Run it on its own,
 * since a plain `db:seed` also loads the demo data:
 *
 *     php artisan migrate --seed --seeder=CourtRulesSeeder
 *
 * or `php artisan db:seed --class=CourtRulesSeeder` after migrating. Add
 * --force on production.
 *
 * Safe to run again: it adds the rules only while there are no court rules,
 * so it never duplicates them or overwrites an admin's wording.
 */
class CourtRulesSeeder extends Seeder
{
    /** @var list<string> */
    public const RULES = [
        'Wear proper non-marking athletic court shoes at all times.',
        'Play only within your booked time — warm-up and cool-down must fit inside your slot.',
        'Return rented paddles and balls in good condition; damage or loss is charged at replacement cost.',
        'Keep the courts clean: use the trash bins and take your belongings with you.',
        // Required anyway in public places (EO 26 s. 2017; RA 11900 for vapes).
        'No smoking or vaping anywhere on the courts.',
        'Children must be supervised by a parent or guardian at all times.',
        'Follow the instructions of venue staff, and report any injury or damage to them right away.',
    ];

    public function run(): void
    {
        if (Policy::query()->where('placement', PolicyPlacement::CourtRules)->exists()) {
            $this->command->info('Court rules already exist; left unchanged.');

            return;
        }

        Policy::query()->create([
            'title' => 'Court Rules',
            // Set here, not left to the model: DatabaseSeeder runs without model events.
            'slug' => Str::slug('Court Rules').'-'.Str::random(6),
            'placement' => PolicyPlacement::CourtRules,
            'body' => implode("\n", self::RULES),
            'is_active' => true,
        ]);

        // The home page caches its props briefly; show the rules straight away.
        HomePageService::forget();

        $this->command->info('Added '.count(self::RULES).' starter court rules. Edit them under Admin > Policies.');
    }
}
