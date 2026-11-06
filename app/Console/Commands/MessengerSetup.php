<?php

namespace App\Console\Commands;

use App\Enums\MessengerTemplate;
use App\Integrations\Meta\MessengerClient;
use App\Integrations\Meta\MessengerException;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('messenger:setup {--templates-only : Only (re)submit the Utility Templates}')]
#[Description('Configure the Facebook Page for Messenger notifications and submit the Utility Templates for approval')]
class MessengerSetup extends Command
{
    /**
     * Webhook fields the app needs: messages and postbacks open the 24-hour
     * window, referrals carry the account-linking ref, and template status
     * updates report Meta's review decisions.
     */
    private const WEBHOOK_FIELDS = [
        'messages',
        'messaging_postbacks',
        'messaging_referrals',
        'message_template_status_update',
    ];

    public function handle(MessengerClient $client): int
    {
        if (! $client->isConfigured()) {
            $this->error('Set MESSENGER_PAGE_ID and MESSENGER_PAGE_ACCESS_TOKEN in .env first.');

            return self::FAILURE;
        }

        $appUrl = rtrim((string) config('app.url'), '/');

        if (! str_starts_with($appUrl, 'https://')) {
            $this->warn("APP_URL is {$appUrl}. Meta requires a public https:// URL for template buttons and the webhook.");
        }

        $failed = false;

        if (! $this->option('templates-only')) {
            $failed = ! $this->step('Subscribing the Page to webhook events', fn () => $client->subscribePage(self::WEBHOOK_FIELDS));
            $failed = ! $this->step('Adding the Get Started button', fn () => $client->configureProfile('GET_STARTED', [$appUrl])) || $failed;
        }

        foreach (MessengerTemplate::cases() as $template) {
            $failed = ! $this->step("Submitting template {$template->templateName()}", function () use ($client, $template, $appUrl) {
                $result = $client->createTemplate($template, $appUrl);

                return $result['status'] ?? 'submitted';
            }) || $failed;
        }

        $this->newLine();
        $this->line('Webhook callback URL: '.route('webhooks.messenger'));
        $this->line('Watch the log for messenger.template_status to see each review result.');

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    private function step(string $label, callable $call): bool
    {
        try {
            $result = $call();
            $this->components->twoColumnDetail($label, is_string($result) ? "<fg=green>{$result}</>" : '<fg=green>done</>');

            return true;
        } catch (MessengerException $e) {
            // Re-running setup resubmits templates Meta already has; that is
            // expected, not a failure.
            if (str_contains(strtolower($e->getMessage()), 'already exists')) {
                $this->components->twoColumnDetail($label, '<fg=yellow>already exists</>');

                return true;
            }

            $this->components->twoColumnDetail($label, '<fg=red>failed</>');
            $this->line("  <fg=red>{$e->getMessage()}</>");

            return false;
        }
    }
}
