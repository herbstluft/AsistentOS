<?php

namespace App\Services;

use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\AssistantPreferenceController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\SpotifyController;
use App\Http\Controllers\DeepgramController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppBootstrapService
{
    public static function getData()
    {
        $user = Auth::user();
        if (!$user) return null;

        $request = request();

        try {
            return [
                'subscription' => app(SubscriptionController::class)->status()->getData(),
                'preferences' => app(AssistantPreferenceController::class)->getPreference()->getData(),
                'appointments' => app(AppointmentController::class)->index($request)->getData(),
                'spotify_token' => app(SpotifyController::class)->token($request)->getData(),
                'deepgram_token' => app(DeepgramController::class)->token($request)->getData(),
                'elevenlabs_token' => config('services.elevenlabs.api_key'),
                'openai_token' => config('services.openai.api_key'),
            ];
        } catch (\Exception $e) {
            return null;
        }
    }
}
