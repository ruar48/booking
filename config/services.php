<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * Open-Meteo needs no API key or account. Coordinates default to
     * Binalonan, Pangasinan; override per environment if the venue moves.
     */
    'weather' => [
        'latitude' => env('WEATHER_LATITUDE', 16.0503),
        'longitude' => env('WEATHER_LONGITUDE', 120.5926),
        'timezone' => env('WEATHER_TIMEZONE', 'Asia/Manila'),
    ],

    'paymongo' => [
        'secret_key' => env('PAYMONGO_SECRET_KEY'),
        'public_key' => env('PAYMONGO_PUBLIC_KEY'),
        'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
        // Convenience fee passed on to the customer so the venue nets the
        // full price. Set to PayMongo's current QR Ph rate for your account.
        'fee_percent' => (float) env('PAYMONGO_FEE_PERCENT', 1.5),
        'fee_fixed' => (float) env('PAYMONGO_FEE_FIXED', 0),
    ],

    /*
     * Facebook Page Messenger notifications. Leave the token empty to turn
     * the channel off entirely: nothing is sent and the settings page says
     * the feature is unavailable. See `php artisan messenger:setup`.
     */
    'messenger' => [
        'page_id' => env('MESSENGER_PAGE_ID'),
        // The Page's username, for the m.me link (m.me/<username>). Falls
        // back to the numeric Page ID, which m.me also accepts.
        'page_username' => env('MESSENGER_PAGE_USERNAME'),
        'page_access_token' => env('MESSENGER_PAGE_ACCESS_TOKEN'),
        'app_secret' => env('MESSENGER_APP_SECRET'),
        'verify_token' => env('MESSENGER_VERIFY_TOKEN'),
        'graph_version' => env('MESSENGER_GRAPH_VERSION', 'v27.0'),
        'template_language' => env('MESSENGER_TEMPLATE_LANGUAGE', 'en'),
        // Lets staff reply from the inbox for up to 7 days after a customer's
        // last message, instead of 24 hours. Turn on only once Meta has
        // approved the app for the Human Agent permission.
        'human_agent' => (bool) env('MESSENGER_HUMAN_AGENT', false),
    ],

];
