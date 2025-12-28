<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AiQueryController;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Ruta pública para validar payment methods (antes del registro)
Route::post('/api/subscription/validate-payment', [App\Http\Controllers\SubscriptionController::class, 'validatePayment']);

// Ruta pública para verificar si un email ya está en uso
Route::post('/api/check-email', function (Illuminate\Http\Request $request) {
    $exists = App\Models\User::where('email', $request->email)->exists();
    return response()->json(['exists' => $exists]);
});

Route::middleware([
    'auth',
    config('jetstream.auth_session'),
    'verified',
])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/calendar', function () {
        return Inertia::render('Calendar');
    })->name('calendar');

    Route::get('/capabilities', function () {
        return Inertia::render('Capabilities');
    })->name('capabilities');



    Route::get('/settings/biometrics', function () {
        return Inertia::render('settings/Biometrics');
    })->name('settings.biometrics');

    Route::get('/settings/spotify', function () {
        return Inertia::render('settings/Spotify');
    })->name('settings.spotify');

    // Rutas de Preferencias del Asistente
    Route::get('/api/assistant/preference', [App\Http\Controllers\AssistantPreferenceController::class, 'getPreference']);
    Route::post('/api/assistant/preference', [App\Http\Controllers\AssistantPreferenceController::class, 'savePreference']);

    // Rutas de Biometría (WebAuthn)
    Route::get('/api/biometrics', [App\Http\Controllers\BiometricController::class, 'index']);
    Route::put('/api/biometrics/{id}', [App\Http\Controllers\BiometricController::class, 'update']);
    Route::delete('/api/biometrics/{id}', [App\Http\Controllers\BiometricController::class, 'destroy']);
    Route::get('/api/biometrics/register/options', [App\Http\Controllers\BiometricController::class, 'registerOptions']);
    Route::post('/api/biometrics/register', [App\Http\Controllers\BiometricController::class, 'register']);
    Route::get('/api/biometrics/login/options', [App\Http\Controllers\BiometricController::class, 'authenticateOptions']);
    Route::post('/api/biometrics/login', [App\Http\Controllers\BiometricController::class, 'authenticate']);

    // Spotify Routes
    Route::get('/auth/spotify', [App\Http\Controllers\SpotifyController::class, 'redirect'])->name('spotify.redirect');
    Route::get('/auth/spotify/callback', [App\Http\Controllers\SpotifyController::class, 'callback'])->name('spotify.callback');
    Route::post('/api/spotify/disconnect', [App\Http\Controllers\SpotifyController::class, 'disconnect']);
    Route::get('/api/spotify/status', [App\Http\Controllers\SpotifyController::class, 'status']);
    Route::post('/api/spotify/play', [App\Http\Controllers\SpotifyController::class, 'play']);
    Route::post('/api/spotify/pause', [App\Http\Controllers\SpotifyController::class, 'pause']);
    Route::post('/api/spotify/next', [App\Http\Controllers\SpotifyController::class, 'next']);
    Route::post('/api/spotify/previous', [App\Http\Controllers\SpotifyController::class, 'previous']);
    Route::get('/api/spotify/state', [App\Http\Controllers\SpotifyController::class, 'playerState']);
    Route::get('/api/spotify/token', [App\Http\Controllers\SpotifyController::class, 'token']);
    Route::put('/api/spotify/volume', [App\Http\Controllers\SpotifyController::class, 'volume']);
    Route::put('/api/spotify/seek', [App\Http\Controllers\SpotifyController::class, 'seek']);
    Route::put('/api/spotify/save-track', [App\Http\Controllers\SpotifyController::class, 'saveTrack']);
    Route::delete('/api/spotify/remove-track', [App\Http\Controllers\SpotifyController::class, 'removeTrack']);
    Route::get('/api/spotify/check-saved', [App\Http\Controllers\SpotifyController::class, 'checkSaved']);

    // Appointment Routes
    Route::get('/api/appointments', [App\Http\Controllers\AppointmentController::class, 'index']);
    Route::post('/api/appointments', [App\Http\Controllers\AppointmentController::class, 'store']);
    Route::put('/api/appointments/{id}', [App\Http\Controllers\AppointmentController::class, 'update']);
    Route::delete('/api/appointments/{id}', [App\Http\Controllers\AppointmentController::class, 'destroy']);

    // Contact Routes
    Route::get('/api/contacts', [App\Http\Controllers\ContactController::class, 'index']);
    Route::post('/api/contacts', [App\Http\Controllers\ContactController::class, 'store']);
    Route::put('/api/contacts/{id}', [App\Http\Controllers\ContactController::class, 'update']);
    Route::delete('/api/contacts/{id}', [App\Http\Controllers\ContactController::class, 'destroy']);
    Route::get('/contacts', function () {
        return Inertia::render('Contacts');
    })->name('contacts');

    Route::get('/image-generation', function () {
        return Inertia::render('ImageGenerationView');
    })->name('image-generation');

    // Note Routes
    Route::get('/notes', [App\Http\Controllers\NoteController::class, 'index'])->name('notes');
    Route::get('/api/notes', [App\Http\Controllers\NoteController::class, 'list']);
    Route::post('/api/notes', [App\Http\Controllers\NoteController::class, 'store']);
    Route::put('/api/notes/{id}', [App\Http\Controllers\NoteController::class, 'update']);
    Route::delete('/api/notes/{id}', [App\Http\Controllers\NoteController::class, 'destroy']);

    // Gemini Proxy
    Route::post('/api/gemini/proxy', [App\Http\Controllers\GeminiController::class, 'proxy']);

    // Subscription Routes
    Route::get('/api/subscription/status', [App\Http\Controllers\SubscriptionController::class, 'status']);
    Route::post('/api/subscription/setup-intent', [App\Http\Controllers\SubscriptionController::class, 'setupIntent']);
    Route::post('/api/subscription/start-trial', [App\Http\Controllers\SubscriptionController::class, 'startTrial']);
    Route::post('/api/subscription/cancel-trial', [App\Http\Controllers\SubscriptionController::class, 'cancelTrial']);
    Route::post('/api/subscription/convert', [App\Http\Controllers\SubscriptionController::class, 'convertToSubscription']);
    Route::post('/api/subscription/reactivate', [App\Http\Controllers\SubscriptionController::class, 'reactivate']);
    Route::post('/api/subscription/cancel', [App\Http\Controllers\SubscriptionController::class, 'cancel']);
});

require __DIR__.'/settings.php';

Route::post('/api/execute-ai-query', [AiQueryController::class, 'execute']);
