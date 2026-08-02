<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Models\Coach;
use App\Models\Court;
use App\Models\Player;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function index(Request $request): Response
    {
        $query = $request->string('q')->trim()->toString();

        if ($query === '') {
            return Inertia::render('search/index', [
                'query' => $query,
                'results' => [
                    'clubs' => [],
                    'players' => [],
                    'courts' => [],
                    'tournaments' => [],
                    'coaches' => [],
                ],
            ]);
        }

        return Inertia::render('search/index', [
            'query' => $query,
            'results' => [
                'clubs' => Club::query()
                    ->where('name', 'like', "%{$query}%")
                    ->orWhere('city', 'like', "%{$query}%")
                    ->limit(10)
                    ->get(['id', 'name', 'slug', 'city']),
                'players' => Player::query()
                    ->with('user:id,name,email')
                    ->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$query}%")->orWhere('email', 'like', "%{$query}%"))
                    ->limit(10)
                    ->get(),
                'courts' => Court::query()
                    ->with('club:id,name')
                    ->where('name', 'like', "%{$query}%")
                    ->limit(10)
                    ->get(),
                'tournaments' => Tournament::query()
                    ->where('name', 'like', "%{$query}%")
                    ->limit(10)
                    ->get(['id', 'name', 'slug', 'starts_at']),
                'coaches' => Coach::query()
                    ->with('user:id,name')
                    ->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$query}%"))
                    ->where('is_active', true)
                    ->limit(10)
                    ->get(),
            ],
        ]);
    }
}
