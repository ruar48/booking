<?php

namespace App\Http\Controllers;

use App\Services\HomePageService;
use Illuminate\Http\Response as HttpResponse;
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

    /**
     * Plain-text venue summary for AI assistants (the llms.txt convention),
     * built from the same cached home payload so it never drifts from the site.
     */
    public function llms(): HttpResponse
    {
        return response()
            ->view('llms', $this->homePage->props())
            ->header('Content-Type', 'text/plain; charset=utf-8');
    }
}
