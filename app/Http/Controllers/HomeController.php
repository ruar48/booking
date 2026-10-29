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
        $props = $this->homePage->props();

        // The root Blade view prints the SEO tags too, so crawlers get them in the HTML itself.
        return Inertia::render('welcome', $props)->withViewData(['seo' => $props['seo']]);
    }
}
