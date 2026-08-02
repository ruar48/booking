<?php

namespace App\Jobs;

use App\Models\Tournament;
use App\Services\TournamentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateBracketJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Tournament $tournament,
    ) {}

    public function handle(TournamentService $tournamentService): void
    {
        $tournamentService->generateBracket($this->tournament);
    }
}
