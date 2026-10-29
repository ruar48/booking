<?php

namespace App\View\Components;

use Inertia\View\Components\App;

/**
 * Inertia's <x-inertia::app>, plus a slot for HTML to send when the page isn't
 * server-rendered (no SSR server on this host).
 *
 * Without it the server sends an empty <div id="app">: crawlers that don't run
 * JavaScript see a page with no words, headings or links, and phones show a
 * blank screen until the bundle loads. The slot fills that gap. Inertia mounts
 * with createRoot (no data-server-rendered attribute), which replaces whatever
 * the div holds, so the slot never conflicts with React. When SSR is running,
 * its real markup is used and the slot is ignored.
 */
class InertiaApp extends App
{
    public function render(): string
    {
        return <<<'blade'
@if($response)
{!! $response->body !!}
@else
<script data-page="{{ $id }}" type="application/json">{!! $pageJson !!}</script><div id="{{ $id }}">{{ $slot }}</div>
@endif
blade;
    }
}
