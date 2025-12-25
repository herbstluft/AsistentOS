<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Convertir trials expirados a suscripciones activas automáticamente
Schedule::command('subscriptions:convert-expired-trials')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
