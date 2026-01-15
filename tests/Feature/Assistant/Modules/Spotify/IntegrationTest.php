<?php

namespace Tests\Feature\Assistant\Modules\Spotify;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class IntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'spotify_access_token' => 'mock_token',
            'spotify_refresh_token' => 'mock_refresh',
            'spotify_token_expires_at' => now()->addHour()
        ]);
    }

    /** @test */
    public function canGetSpotifyStatus()
    {
        $this->actingAs($this->user);

        $response = $this->getJson('/api/spotify/status');

        $response->assertStatus(200)
            ->assertJson(['connected' => true]);
    }

    /** @test */
    public function canTriggerPlayWithQuery()
    {
        $this->actingAs($this->user);

        // Mock Spotify Search API
        Http::fake([
            'https://api.spotify.com/v1/search*' => Http::response([
                'tracks' => [
                    'items' => [
                        ['uri' => 'spotify:track:123', 'name' => 'Mock Song']
                    ]
                ]
            ], 200),
            'https://api.spotify.com/v1/me/player/play*' => Http::response([], 204),
        ]);

        $response = $this->postJson('/api/spotify/play', [
            'query' => 'Radiohead',
            'type' => 'track'
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'playing']);
    }

    /** @test */
    public function canPausePlayback()
    {
        $this->actingAs($this->user);

        Http::fake([
            'https://api.spotify.com/v1/me/player/pause*' => Http::response([], 204),
        ]);

        $response = $this->postJson('/api/spotify/pause');

        $response->assertStatus(200)
            ->assertJson(['status' => 'paused']);
    }

    /** @test */
    public function canSkipToNextTrack()
    {
        $this->actingAs($this->user);

        Http::fake([
            'https://api.spotify.com/v1/me/player/next*' => Http::response([], 204),
        ]);

        $response = $this->postJson('/api/spotify/next');

        $response->assertStatus(200)
            ->assertJson(['status' => 'next']);
    }

    /** @test */
    public function canChangeVolume()
    {
        $this->actingAs($this->user);

        Http::fake([
            'https://api.spotify.com/v1/me/player/volume*' => Http::response([], 204),
        ]);

        $response = $this->putJson('/api/spotify/volume', [
            'volume_percent' => 50
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'volume_set', 'volume' => 50]);
    }

    /** @test */
    public function canDisconnectSpotify()
    {
        $this->actingAs($this->user);

        // Also mock the pause attempt during disconnect
        Http::fake([
            'https://api.spotify.com/v1/me/player/pause' => Http::response([], 204)
        ]);

        $response = $this->postJson('/api/spotify/disconnect');

        $response->assertStatus(200);
        $this->user->refresh();
        $this->assertNull($this->user->spotify_access_token);
    }
}
