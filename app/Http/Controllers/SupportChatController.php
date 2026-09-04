<?php

namespace App\Http\Controllers;

use App\Services\SupportAssistant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SupportChatController extends Controller
{
    public function __construct(private readonly SupportAssistant $assistant) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:24'],
            'messages.*.role' => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:2000'],
        ]);

        try {
            return response()->json(
                $this->assistant->reply($validated['messages'], $request->user()),
            );
        } catch (\Throwable $e) {
            Log::error('support.chat.failed', [
                'user_id' => $request->user()?->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('Sorry, I could not answer just now. Please try again, or contact the venue directly.'),
                'suggestions' => [],
            ], 500);
        }
    }
}
