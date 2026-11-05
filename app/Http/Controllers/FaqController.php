<?php

namespace App\Http\Controllers;

use App\Services\FaqService;
use Inertia\Inertia;
use Inertia\Response;

class FaqController extends Controller
{
    public function __invoke(FaqService $faq): Response
    {
        return Inertia::render('faq', [
            'topics' => $faq->topics(),
        ]);
    }
}
