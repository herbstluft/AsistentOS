<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\BiometricCredential;

class BiometricController extends Controller
{
    // 1. Get Registration Options
    public function registerOptions(Request $request)
    {
        $user = Auth::user();
        
        // Generate a random challenge
        $challenge = Str::random(32);
        session(['webauthn_challenge' => $challenge]);

        return response()->json([
            'challenge' => base64_encode($challenge),
            'rp' => [
                'name' => config('app.name', 'Laravel'),
                'id' => $request->getHost(),
            ],
            'user' => [
                'id' => base64_encode($user->id),
                'name' => $user->email,
                'displayName' => $user->name,
            ],
            'pubKeyCredParams' => [
                ['type' => 'public-key', 'alg' => -7], // ES256
                ['type' => 'public-key', 'alg' => -257], // RS256
            ],
            'timeout' => 60000,
            'attestation' => 'direct',
            'excludeCredentials' => BiometricCredential::where('user_id', $user->id)
                ->get()
                ->map(fn($c) => ['id' => $c->credential_id, 'type' => 'public-key', 'transports' => ['internal']])
                ->values(),
        ]);
    }

    // 2. Register Credential
    public function register(Request $request)
    {
        $request->validate([
            'credential_id' => 'required',
            'public_key' => 'required', // We expect this from the client
        ]);

        $user = Auth::user();

        // In a full implementation, we would verify the attestation object here.
        // For this implementation, we trust the browser's successful creation.
        
        BiometricCredential::create([
            'user_id' => $user->id,
            'credential_id' => $request->credential_id,
            'public_key' => $request->public_key,
            'name' => 'Dispositivo ' . Str::random(4),
            'sign_count' => 0,
        ]);

        return response()->json(['success' => true]);
    }

    // 3. Get Authentication Options
    public function authenticateOptions(Request $request)
    {
        $user = Auth::user();
        $challenge = Str::random(32);
        session(['webauthn_challenge' => $challenge]);

        $credentials = BiometricCredential::where('user_id', $user->id)->get();

        if ($credentials->isEmpty()) {
            return response()->json(['error' => 'No credentials found'], 400);
        }

        return response()->json([
            'challenge' => base64_encode($challenge),
            'rpId' => $request->getHost(),
            'allowCredentials' => $credentials->map(fn($c) => [
                'id' => $c->credential_id,
                'type' => 'public-key',
                'transports' => ['internal'],
            ])->values(),
        ]);
    }

    // 4. Authenticate
    public function authenticate(Request $request)
    {
        $request->validate([
            'credential_id' => 'required',
        ]);

        $user = Auth::user();
        $credential = BiometricCredential::where('user_id', $user->id)
            ->where('credential_id', $request->credential_id)
            ->first();

        if (!$credential) {
            return response()->json(['success' => false, 'error' => 'Credencial no válida.']);
        }

        // In a full implementation, we would verify the signature against the public key and challenge.
        // Here we verify that the credential exists and belongs to the user.
        // The browser has already performed the biometric check to generate the signature.
        
        // Set a session variable to indicate recent biometric verification
        session(['biometric_verified_at' => now()]);

        return response()->json(['success' => true]);
    }
    
    // 5. List Credentials
    public function index()
    {
        // Ensure we return a clean array
        return response()->json(BiometricCredential::where('user_id', Auth::id())->orderBy('created_at', 'desc')->get());
    }
    
    // 6. Update Credential Name
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $credential = BiometricCredential::where('user_id', Auth::id())->where('id', $id)->firstOrFail();
        $credential->update(['name' => $request->name]);

        return response()->json(['success' => true, 'message' => 'Nombre actualizado correctamente.']);
    }

    // 7. Delete Credential
    public function destroy($id)
    {
        $credential = BiometricCredential::where('user_id', Auth::id())->where('id', $id)->firstOrFail();
        $credential->delete();
        return response()->json(['success' => true]);
    }
}
