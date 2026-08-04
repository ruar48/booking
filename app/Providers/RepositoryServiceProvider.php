<?php

namespace App\Providers;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Contracts\Repositories\ClubRepositoryInterface;
use App\Contracts\Repositories\DashboardRepositoryInterface;
use App\Contracts\Repositories\GameMatchRepositoryInterface;
use App\Contracts\Repositories\PlayerRepositoryInterface;
use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Contracts\Repositories\ResourceRepositoryInterface;
use App\Contracts\Repositories\SaleRepositoryInterface;
use App\Contracts\Repositories\TournamentRepositoryInterface;
use App\Repositories\AnnouncementRepository;
use App\Repositories\ClubRepository;
use App\Repositories\DashboardRepository;
use App\Repositories\GameMatchRepository;
use App\Repositories\PlayerRepository;
use App\Repositories\ProductRepository;
use App\Repositories\ResourceBookingRepository;
use App\Repositories\ResourceRepository;
use App\Repositories\SaleRepository;
use App\Repositories\TournamentRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        ClubRepositoryInterface::class => ClubRepository::class,
        PlayerRepositoryInterface::class => PlayerRepository::class,
        ResourceRepositoryInterface::class => ResourceRepository::class,
        ResourceBookingRepositoryInterface::class => ResourceBookingRepository::class,
        TournamentRepositoryInterface::class => TournamentRepository::class,
        GameMatchRepositoryInterface::class => GameMatchRepository::class,
        DashboardRepositoryInterface::class => DashboardRepository::class,
        AnnouncementRepositoryInterface::class => AnnouncementRepository::class,
        ProductRepositoryInterface::class => ProductRepository::class,
        SaleRepositoryInterface::class => SaleRepository::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
