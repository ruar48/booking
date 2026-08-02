<?php

namespace App\Enums;

enum Role: string
{
    case SuperAdmin = 'super_admin';
    case ClubAdmin = 'club_admin';
    case TournamentOrganizer = 'tournament_organizer';
    case Coach = 'coach';
    case Player = 'player';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::ClubAdmin => 'Club Admin',
            self::TournamentOrganizer => 'Tournament Organizer',
            self::Coach => 'Coach',
            self::Player => 'Player',
        };
    }
}
