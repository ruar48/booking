<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Court rules can now belong to one sport. A rule with no sport applies
 * everywhere; the booking and home pages show those plus the selected
 * sport's own rules, so picking "Billiard" no longer lists paddle rules.
 *
 * The starter rules were written for pickleball. If they are still the
 * seeded wording, they are split into house rules (every sport) and
 * pickleball rules. Rules an admin has reworded are left as they are.
 * Either way, starter billiard rules are added so the Billiard tab has some.
 */
return new class extends Migration
{
    /** The seeded wording, exactly as CourtRulesSeeder first wrote it. */
    private const ORIGINAL = [
        'Wear proper non-marking athletic court shoes at all times.',
        'Play only within your booked time — warm-up and cool-down must fit inside your slot.',
        'Return rented paddles and balls in good condition; damage or loss is charged at replacement cost.',
        'Keep the courts clean: use the trash bins and take your belongings with you.',
        'No smoking or vaping anywhere on the courts.',
        'Children must be supervised by a parent or guardian at all times.',
        'Follow the instructions of venue staff, and report any injury or damage to them right away.',
    ];

    private const GENERAL = [
        'Play only within your booked time — warm-up and cool-down must fit inside your slot.',
        'Keep the venue clean: use the trash bins and take your belongings with you.',
        'No smoking or vaping anywhere in the venue.',
        'Children must be supervised by a parent or guardian at all times.',
        'Follow the instructions of venue staff, and report any injury or damage to them right away.',
    ];

    private const PICKLEBALL = [
        'Wear proper non-marking athletic court shoes at all times.',
        'Return rented paddles and balls in good condition; damage or loss is charged at replacement cost.',
    ];

    private const BILLIARDS = [
        'Handle the cues, balls and table with care; damage to the cloth or equipment is charged at repair or replacement cost.',
        'No jump or massé shots — they tear the cloth.',
        'Keep food and drinks off the table and its rails.',
        'Do not sit or lean on the table.',
        'Rack the balls and return the cues to the rack when your time is up.',
    ];

    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->string('sport')->nullable()->after('placement');
        });

        $courtRules = DB::table('policies')->where('placement', 'court_rules')->get();

        // A venue that never set up court rules gets none added.
        if ($courtRules->isEmpty()) {
            return;
        }

        $seeded = $courtRules->first(fn (object $policy): bool => $this->lines($policy->body) === self::ORIGINAL);

        if ($seeded !== null) {
            DB::table('policies')->where('id', $seeded->id)->update([
                'title' => 'House Rules',
                'body' => implode("\n", self::GENERAL),
                'version' => $seeded->version + 1,
                'updated_at' => now(),
            ]);

            $this->insert('Pickleball Court Rules', 'pickleball', self::PICKLEBALL, $seeded->sort_order + 1);
        }

        $this->insert('Billiard Table Rules', 'billiards', self::BILLIARDS, ($seeded->sort_order ?? 0) + 2);

        // The home page caches its props, court rules included.
        Cache::forget('home:payload');
    }

    public function down(): void
    {
        DB::table('policies')
            ->where('placement', 'court_rules')
            ->whereIn('title', ['Pickleball Court Rules', 'Billiard Table Rules'])
            ->delete();

        $general = DB::table('policies')
            ->where('placement', 'court_rules')
            ->where('title', 'House Rules')
            ->get()
            ->first(fn (object $policy): bool => $this->lines($policy->body) === self::GENERAL);

        if ($general !== null) {
            DB::table('policies')->where('id', $general->id)->update([
                'title' => 'Court Rules',
                'body' => implode("\n", self::ORIGINAL),
                'version' => max(1, $general->version - 1),
                'updated_at' => now(),
            ]);
        }

        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn('sport');
        });
    }

    /**
     * @param  list<string>  $lines
     */
    private function insert(string $title, string $sport, array $lines, int $sortOrder): void
    {
        DB::table('policies')->insert([
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::random(6),
            'placement' => 'court_rules',
            'sport' => $sport,
            'body' => implode("\n", $lines),
            'is_active' => true,
            'version' => 1,
            'sort_order' => $sortOrder,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return list<string>
     */
    private function lines(string $body): array
    {
        return array_values(array_filter(array_map('trim', preg_split('/\R/', $body) ?: [])));
    }
};
