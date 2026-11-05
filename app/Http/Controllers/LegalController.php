<?php

namespace App\Http\Controllers;

use App\Services\LegalPagesPresenter;
use Inertia\Inertia;
use Inertia\Response;

class LegalController extends Controller
{
    public function __construct(
        private readonly LegalPagesPresenter $presenter,
    ) {}

    public function terms(): Response
    {
        return Inertia::render('legal/terms', $this->presenter->terms());
    }

    public function privacy(): Response
    {
        return Inertia::render('legal/privacy', $this->presenter->privacy());
    }
}
