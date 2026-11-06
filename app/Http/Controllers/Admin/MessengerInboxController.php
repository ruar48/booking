<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReplyMessengerConversationRequest;
use App\Models\MessengerConversation;
use App\Services\Messenger\MessengerInboxService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MessengerInboxController extends Controller
{
    public function __construct(
        private readonly MessengerInboxService $inbox,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', MessengerConversation::class);

        return Inertia::render('admin/messenger/index', [
            'available' => $this->inbox->isAvailable(),
            'conversations' => $this->inbox->conversations(),
            'active' => null,
        ]);
    }

    public function show(MessengerConversation $conversation): Response
    {
        $this->authorize('view', $conversation);

        return Inertia::render('admin/messenger/index', [
            'available' => $this->inbox->isAvailable(),
            'conversations' => $this->inbox->conversations(),
            'active' => $this->inbox->thread($conversation),
        ]);
    }

    public function reply(ReplyMessengerConversationRequest $request, MessengerConversation $conversation): RedirectResponse
    {
        $this->inbox->reply($conversation, $request->validated('text'), $request->user());

        return to_route('admin.messenger.show', $conversation);
    }

    /**
     * Called by the open thread rather than on page load, so prefetching a
     * conversation link never marks it read.
     */
    public function read(MessengerConversation $conversation): RedirectResponse
    {
        $this->authorize('view', $conversation);

        $this->inbox->markRead($conversation);

        return to_route('admin.messenger.show', $conversation);
    }
}
