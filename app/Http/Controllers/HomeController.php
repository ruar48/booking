<?php

namespace App\Http\Controllers;

use App\Services\HomePageService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly HomePageService $homePage,
    ) {}

    public function index(): Response
    {
        return Inertia::render('welcome', $this->homePage->props());
    }
}
