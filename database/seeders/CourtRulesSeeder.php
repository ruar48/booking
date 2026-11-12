<?php

namespace Database\Seeders;

use App\Enums\PolicyPlacement;
use App\Enums\Sport;
use App\Models\Policy;
use App\Services\HomePageService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Starter house rules for the "Court rules" policy placement, shown on the
 * home and booking pages, in the FAQ and in the Terms of Service. Admins edit
 * them under Policies like any other policy, one rule per line.
 *
 * House rules apply to every sport; pickleball and billiard rules show only
 * when that sport is picked. Run it on its own, since a plain `db:seed` also
 * loads the demo data:
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
    /** @var list<string> Every sport. */
    public const GENERAL_RULES = [
        'Play only within your booked time — warm-up and cool-down must fit inside your slot.',
        'Keep the venue clean: use the trash bins and take your belongings with you.',
        // Required anyway in public places (EO 26 s. 2017; RA 11900 for vapes).
        'No smoking or vaping anywhere in the venue.',
        'Children must be supervised by a parent or guardian at all times.',
        'Follow the instructions of venue staff, and report any injury or damage to them right away.',
    ];

    /** @var list<string> */
    public const PICKLEBALL_RULES = [
        'Wear proper non-marking athletic court shoes at all times.',
        'Return rented paddles and balls in good condition; damage or loss is charged at replacement cost.',
    ];

    /** @var list<string> */
    public const BILLIARD_RULES = [
        'Handle the cues, balls and table with care; damage to the cloth or equipment is charged at repair or replacement cost.',
        'No jump or massé shots — they tear the cloth.',
        'Keep food and drinks off the table and its rails.',
        'Do not sit or lean on the table.',
        'Rack the balls and return the cues to the rack when your time is up.',
    ];

    public function run(): void
    {
        if (Policy::query()->where('placement', PolicyPlacement::CourtRules)->exists()) {
            $this->command->info('Court rules already exist; left unchanged.');

            return;
        }

        $this->create('House Rules', null, self::GENERAL_RULES, 0);
        $this->create('Pickleball Court Rules', Sport::Pickleball, self::PICKLEBALL_RULES, 1);
        $this->create('Billiard Table Rules', Sport::Billiards, self::BILLIARD_RULES, 2);

        // The home page caches its props briefly; show the rules straight away.
        HomePageService::forget();

        $this->command->info('Added starter house, pickleball and billiard rules. Edit them under Admin > Policies.');
    }

    /**
     * @param  list<string>  $rules
     */
    private function create(string $title, ?Sport $sport, array $rules, int $sortOrder): void
    {
        Policy::query()->create([
            'title' => $title,
            // Set here, not left to the model: DatabaseSeeder runs without model events.
            'slug' => Str::slug($title).'-'.Str::random(6),
            'placement' => PolicyPlacement::CourtRules,
            'sport' => $sport,
            'body' => implode("\n", $rules),
            'is_active' => true,
            'sort_order' => $sortOrder,
        ]);
    }
}
