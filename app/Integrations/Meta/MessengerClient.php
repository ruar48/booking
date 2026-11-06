<?php

namespace App\Integrations\Meta;

use App\Enums\MessengerTemplate;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Thin client for the parts of Meta's Graph API the venue's Facebook Page
 * uses: the Send API, page-owned Utility Templates, and the one-time Page
 * setup calls. Knows nothing about bookings — callers hand it text.
 *
 * @see https://developers.facebook.com/documentation/business-messaging/messenger-platform/send-messages
 */
class MessengerClient
{
    public function isConfigured(): bool
    {
        return filled($this->pageId()) && filled(config('services.messenger.page_access_token'));
    }

    /**
     * Where a user starts the conversation. Meta passes `ref` back to the
     * webhook, which is how a Messenger user is matched to an account here.
     */
    public function conversationUrl(string $ref): string
    {
        $page = config('services.messenger.page_username') ?: $this->pageId();

        return 'https://m.me/'.rawurlencode((string) $page).'?ref='.rawurlencode($ref);
    }

    /**
     * An ordinary message, allowed only within 24 hours of the person's last
     * message to the Page. A button is attached when given one.
     *
     * @return string Meta's message id
     */
    public function sendMessage(string $psid, string $text, ?string $buttonTitle = null, ?string $buttonUrl = null): string
    {
        $message = $buttonTitle !== null && $buttonUrl !== null
            ? ['attachment' => [
                'type' => 'template',
                'payload' => [
                    'template_type' => 'button',
                    'text' => mb_substr($text, 0, 640),
                    'buttons' => [['type' => 'web_url', 'url' => $buttonUrl, 'title' => mb_substr($buttonTitle, 0, 20)]],
                ],
            ]]
            : ['text' => mb_substr($text, 0, 2000)];

        return $this->send([
            'recipient' => ['id' => $psid],
            'messaging_type' => 'UPDATE',
            'message' => $message,
        ]);
    }

    /**
     * An approved Utility Template, the only kind of message Meta delivers
     * outside the 24-hour window.
     *
     * @param  array<string, string>  $parameters  named body placeholders
     * @param  string|null  $urlSuffix  fills the button's `{{1}}`, relative to APP_URL
     * @return string Meta's message id
     */
    public function sendTemplate(string $psid, MessengerTemplate $template, array $parameters, ?string $urlSuffix): string
    {
        $components = [[
            'type' => 'body',
            'parameters' => collect($template->placeholders())
                ->map(fn (string $name) => [
                    'type' => 'text',
                    'parameter_name' => $name,
                    'text' => $parameters[$name] ?? '-',
                ])
                ->all(),
        ]];

        if ($urlSuffix !== null) {
            $components[] = [
                'type' => 'buttons',
                'parameters' => [['type' => 'URL', 'url' => $urlSuffix]],
            ];
        }

        return $this->send([
            'recipient' => ['id' => $psid],
            'messaging_type' => 'UTILITY',
            'message' => [
                'template' => [
                    'name' => $template->templateName(),
                    'language' => ['code' => config('services.messenger.template_language', 'en')],
                    'components' => $components,
                ],
            ],
        ]);
    }

    /**
     * Registers one template with Meta for review.
     *
     * @return array{id?: string, status?: string}
     */
    public function createTemplate(MessengerTemplate $template, string $buttonBaseUrl): array
    {
        return $this->post($this->pageId().'/message_templates', [
            'name' => $template->templateName(),
            'language' => config('services.messenger.template_language', 'en'),
            'category' => 'UTILITY',
            'parameter_format' => 'NAMED',
            'components' => [
                [
                    'type' => 'BODY',
                    'text' => $template->body(),
                    'example' => [
                        'body_text_named_params' => collect($template->examples())
                            ->map(fn (string $example, string $name) => ['param_name' => $name, 'example' => $example])
                            ->values()
                            ->all(),
                    ],
                ],
                [
                    'type' => 'BUTTONS',
                    'buttons' => [[
                        'type' => 'URL',
                        'text' => $template->buttonLabel(),
                        'url' => $buttonBaseUrl.'/{{1}}',
                        'url_suffix_example' => $buttonBaseUrl.'/bookings/1',
                    ]],
                ],
            ],
        ])->json();
    }

    /**
     * The "Get Started" button a first-time visitor taps. Meta only delivers
     * an m.me `ref` for a brand-new conversation alongside that tap.
     *
     * @param  list<string>  $whitelistedDomains
     */
    public function configureProfile(string $getStartedPayload, array $whitelistedDomains): void
    {
        $this->post($this->pageId().'/messenger_profile', [
            'get_started' => ['payload' => $getStartedPayload],
            'whitelisted_domains' => $whitelistedDomains,
        ]);
    }

    /**
     * @param  list<string>  $fields
     */
    public function subscribePage(array $fields): void
    {
        $this->post($this->pageId().'/subscribed_apps', [
            'subscribed_fields' => implode(',', $fields),
        ]);
    }

    /**
     * Checks Meta's X-Hub-Signature-256 header against the raw body.
     */
    public function hasValidSignature(string $body, ?string $header): bool
    {
        $secret = (string) config('services.messenger.app_secret');

        if ($secret === '' || $header === null || ! str_starts_with($header, 'sha256=')) {
            return false;
        }

        return hash_equals('sha256='.hash_hmac('sha256', $body, $secret), $header);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function send(array $payload): string
    {
        return (string) $this->post($this->pageId().'/messages', $payload)->json('message_id');
    }

    /**
     * @param  array<string, mixed>  $payload
     *
     * @throws MessengerException
     */
    private function post(string $path, array $payload): Response
    {
        if (! $this->isConfigured()) {
            throw new MessengerException('Messenger is not configured.');
        }

        try {
            $response = $this->request()->post($path, $payload);
        } catch (ConnectionException $e) {
            throw new MessengerException('Could not reach the Graph API: '.$e->getMessage());
        }

        if ($response->failed()) {
            throw new MessengerException(
                (string) ($response->json('error.message') ?? 'Graph API returned HTTP '.$response->status()),
                is_numeric($response->json('error.code')) ? (int) $response->json('error.code') : null,
                is_numeric($response->json('error.error_subcode')) ? (int) $response->json('error.error_subcode') : null,
            );
        }

        return $response;
    }

    private function request(): PendingRequest
    {
        $token = (string) config('services.messenger.page_access_token');
        $secret = (string) config('services.messenger.app_secret');

        $request = Http::baseUrl('https://graph.facebook.com/'.config('services.messenger.graph_version', 'v27.0'))
            ->acceptJson()
            ->asJson()
            ->timeout(10)
            ->connectTimeout(5)
            // In the header rather than the query string, so the token never
            // shows up in a logged URL or exception message.
            ->withToken($token);

        // Required when the Meta app has "Require app secret" switched on;
        // harmless otherwise.
        return $secret !== ''
            ? $request->withQueryParameters(['appsecret_proof' => hash_hmac('sha256', $token, $secret)])
            : $request;
    }

    private function pageId(): ?string
    {
        $id = config('services.messenger.page_id');

        return filled($id) ? (string) $id : null;
    }
}
