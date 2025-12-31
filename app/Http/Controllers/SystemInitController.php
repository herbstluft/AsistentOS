<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\AssistantPreferenceController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\SpotifyController;

class SystemInitController extends Controller
{
    public function bootstrap(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        // Batch responses
        return response()->json([
            'subscription' => app(SubscriptionController::class)->status()->getData(),
            'preferences' => app(AssistantPreferenceController::class)->getPreference()->getData(),
            'appointments' => app(AppointmentController::class)->index($request)->getData(),
            'spotify_token' => app(SpotifyController::class)->token($request)->getData(),
            'deepgram_token' => app(DeepgramController::class)->token($request)->getData(),
            'onboarding_preference' => \App\Models\Memory::where('user_id', $user->id)->where('key', 'onboarding_preference')->first(),
            'elevenlabs_token' => config('services.elevenlabs.api_key'),
        ]);
    }
}
