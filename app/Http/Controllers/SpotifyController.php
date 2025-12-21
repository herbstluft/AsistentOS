<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Carbon\Carbon;

class SpotifyController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('spotify')
            ->scopes([
                'user-read-email',
                'user-read-private',
                'user-modify-playback-state',
                'user-read-playback-state',
                'user-read-currently-playing',
                'user-library-modify',
                'user-library-read',
                'streaming',
                'app-remote-control'
            ])
            ->redirect();
    }

    public function callback()
    {
        try {
            $spotifyUser = Socialite::driver('spotify')->user();
            $user = User::find(Auth::id());

            $user->update([
                'spotify_id' => $spotifyUser->id,
                'spotify_access_token' => $spotifyUser->token,
                'spotify_refresh_token' => $spotifyUser->refreshToken,
                'spotify_token_expires_at' => Carbon::now()->addSeconds($spotifyUser->expiresIn),
            ]);

            return redirect('/dashboard')->with('status', 'Spotify connected successfully!');
        } catch (\Exception $e) {
            return redirect('/dashboard')->with('error', 'Failed to connect Spotify.');
        }
    }

    public function disconnect()
    {
        $user = User::find(Auth::id());
        $user->update([
            'spotify_id' => null,
            'spotify_access_token' => null,
            'spotify_refresh_token' => null,
            'spotify_token_expires_at' => null,
        ]);

        return back()->with('status', 'Spotify disconnected.');
    }

    public function status()
    {
        $user = Auth::user();
        return response()->json([
            'connected' => !is_null($user->spotify_access_token),
            'name' => $user->spotify_id // Or fetch profile if needed
        ]);
    }

    private function getAccessToken(User $user)
    {
        if (!$user->spotify_access_token) {
            return null;
        }

        if (Carbon::now()->gte($user->spotify_token_expires_at)) {
            // Refresh token
            $response = Http::asForm()->withBasicAuth(
                config('services.spotify.client_id'),
                config('services.spotify.client_secret')
            )->post('https://accounts.spotify.com/api/token', [
                'grant_type' => 'refresh_token',
                'refresh_token' => $user->spotify_refresh_token,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $user->update([
                    'spotify_access_token' => $data['access_token'],
                    'spotify_token_expires_at' => Carbon::now()->addSeconds($data['expires_in']),
                ]);
                // Update refresh token if provided (sometimes it rotates)
                if (isset($data['refresh_token'])) {
                    $user->update(['spotify_refresh_token' => $data['refresh_token']]);
                }
                return $data['access_token'];
            } else {
                return null; // Failed to refresh
            }
        }

        return $user->spotify_access_token;
    }

    public function play(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);

        if (!$token) {
            return response()->json(['error' => 'Spotify not connected or token expired'], 401);
        }

        $query = $request->input('query');
        $type = $request->input('type', 'track'); // track, artist_random
        $deviceId = $request->input('device_id');

        $url = 'https://api.spotify.com/v1/me/player/play';
        if ($deviceId) {
            $url .= "?device_id={$deviceId}";
        }

        if (!$query) {
            // Just resume. Send empty object to ensure valid JSON body if required, or just empty array which Laravel handles.
            // Spotify expects a JSON object for the body if provided.
            $response = Http::withToken($token)->put($url, (object)[]);

            if ($response->status() === 404) {
                return response()->json(['error' => 'No active device found. Please open Spotify on a device.'], 404);
            }

            if ($response->failed()) {
                return response()->json(['error' => 'Resume failed', 'details' => $response->json()], $response->status());
            }

            return response()->json(['status' => 'resumed']);
        }

        // Search
        $searchType = ($type === 'artist_random') ? 'artist' : 'track';
        $searchResponse = Http::withToken($token)->get('https://api.spotify.com/v1/search', [
            'q' => $query,
            'type' => $searchType,
            'limit' => 1
        ]);

        if ($searchResponse->failed()) {
            return response()->json(['error' => 'Search failed'], 500);
        }

        $searchResults = $searchResponse->json();

        $uriToPlay = null;
        $contextUri = null;

        if ($type === 'artist_random') {
            $items = $searchResults['artists']['items'] ?? [];
            if (count($items) > 0) {
                // Play artist top tracks usually requires context_uri, but for artist it's best to use context_uri
                $contextUri = $items[0]['uri'];
            }
        } else {
            $items = $searchResults['tracks']['items'] ?? [];
            if (count($items) > 0) {
                $trackItem = $items[0];
                $uriToPlay = $trackItem['uri'];
                // Use album context if available to allow continuous playback
                if (isset($trackItem['album']['uri'])) {
                    $contextUri = $trackItem['album']['uri'];
                }
            }
        }

        if (!$uriToPlay && !$contextUri) {
            return response()->json(['error' => 'No results found'], 404);
        }

        $baseUrl = 'https://api.spotify.com/v1/me/player/play';
        $url = $deviceId ? "{$baseUrl}?device_id={$deviceId}" : $baseUrl;

        // Attempt 1: Try playing with Album Context (for continuous playback)
        if ($contextUri && $uriToPlay && $type !== 'artist_random') {
            $body = [
                'context_uri' => $contextUri,
                'offset' => ['uri' => $uriToPlay]
            ];
            
            $response = Http::withToken($token)->put($url, $body);
            
            if ($response->successful()) {
                return response()->json(['status' => 'playing', 'query' => $query, 'mode' => 'album_context']);
            }
            // If failed, continue to fallback
        }

        // Attempt 2: Fallback to simple playback (Artist Context or Single Track)
        $body = [];
        if ($contextUri && $type === 'artist_random') {
            $body['context_uri'] = $contextUri;
        } elseif ($uriToPlay) {
            $body['uris'] = [$uriToPlay];
        }

        $playResponse = Http::withToken($token)->put($url, $body);

        if ($playResponse->status() === 404) {
             return response()->json(['error' => 'No active device found. Please open Spotify on a device.'], 404);
        }

        if ($playResponse->failed()) {
            return response()->json(['error' => 'Playback failed', 'details' => $playResponse->json()], $playResponse->status());
        }

        return response()->json(['status' => 'playing', 'query' => $query, 'mode' => 'simple']);
    }

    public function pause(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['error' => 'Not connected'], 401);

        $deviceId = $request->input('device_id');
        $url = 'https://api.spotify.com/v1/me/player/pause';
        if ($deviceId) $url .= "?device_id={$deviceId}";

        Http::withToken($token)->put($url);
        return response()->json(['status' => 'paused']);
    }

    public function next(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['error' => 'Not connected'], 401);

        $deviceId = $request->input('device_id');
        $url = 'https://api.spotify.com/v1/me/player/next';
        if ($deviceId) $url .= "?device_id={$deviceId}";

        $response = Http::withToken($token)->post($url);
        
        if ($response->failed()) {
            return response()->json($response->json(), $response->status());
        }
        
        return response()->json(['status' => 'next']);
    }

    public function previous(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['error' => 'Not connected'], 401);

        $deviceId = $request->input('device_id');
        $url = 'https://api.spotify.com/v1/me/player/previous';
        if ($deviceId) $url .= "?device_id={$deviceId}";

        $response = Http::withToken($token)->post($url);

        if ($response->failed()) {
            return response()->json($response->json(), $response->status());
        }

        return response()->json(['status' => 'previous']);
    }

    public function volume(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['error' => 'Not connected'], 401);

        $volume = $request->input('volume_percent');
        $deviceId = $request->input('device_id');
        
        $url = "https://api.spotify.com/v1/me/player/volume?volume_percent={$volume}";
        if ($deviceId) $url .= "&device_id={$deviceId}";

        Http::withToken($token)->put($url);
        return response()->json(['status' => 'volume_set', 'volume' => $volume]);
    }

    public function playerState()
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['connected' => false]);

        try {
            $response = Http::withToken($token)->get('https://api.spotify.com/v1/me/player');
            
            if ($response->status() === 204) {
                return response()->json(['is_playing' => false, 'item' => null]);
            }

            if ($response->failed()) {
                return response()->json(['is_playing' => false, 'item' => null, 'error' => 'Spotify API Error']);
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            // Network error or other exception
            return response()->json(['is_playing' => false, 'item' => null, 'error' => 'Network Error']);
        }
    }

    public function token()
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        return response()->json(['token' => $token]);
    }
    public function seek(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['error' => 'Not connected'], 401);

        $positionMs = $request->input('position_ms');
        $deviceId = $request->input('device_id');
        
        $url = "https://api.spotify.com/v1/me/player/seek?position_ms={$positionMs}";
        if ($deviceId) $url .= "&device_id={$deviceId}";

        Http::withToken($token)->put($url);
        return response()->json(['status' => 'seeked', 'position_ms' => $positionMs]);
    }

    public function saveTrack(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['error' => 'Not connected'], 401);

        $trackId = $request->input('track_id');
        if (!$trackId) return response()->json(['error' => 'Track ID required'], 400);

        $response = Http::withToken($token)->put("https://api.spotify.com/v1/me/tracks?ids={$trackId}");

        if ($response->successful()) {
            return response()->json(['status' => 'saved']);
        }
        
        \Illuminate\Support\Facades\Log::error('Spotify Save Track Error', ['response' => $response->json(), 'status' => $response->status()]);
        return response()->json(['error' => 'Failed to save track', 'details' => $response->json()], 500);
    }

    public function removeTrack(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['error' => 'Not connected'], 401);

        $trackId = $request->input('track_id');
        if (!$trackId) return response()->json(['error' => 'Track ID required'], 400);

        $response = Http::withToken($token)->delete("https://api.spotify.com/v1/me/tracks?ids={$trackId}");

        if ($response->successful()) {
            return response()->json(['status' => 'removed']);
        }

        \Illuminate\Support\Facades\Log::error('Spotify Remove Track Error', ['response' => $response->json(), 'status' => $response->status()]);
        return response()->json(['error' => 'Failed to remove track', 'details' => $response->json()], 500);
    }

    public function checkSaved(Request $request)
    {
        $user = User::find(Auth::id());
        $token = $this->getAccessToken($user);
        if (!$token) return response()->json(['error' => 'Not connected'], 401);

        $trackId = $request->input('track_id');
        if (!$trackId) return response()->json(['error' => 'Track ID required'], 400);

        $response = Http::withToken($token)->get("https://api.spotify.com/v1/me/tracks/contains?ids={$trackId}");

        if ($response->successful()) {
            $data = $response->json();
            return response()->json(['is_saved' => $data[0] ?? false]);
        }

        return response()->json(['is_saved' => false]);
    }
}
