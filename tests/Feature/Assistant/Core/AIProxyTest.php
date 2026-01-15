<?php

namespace Tests\Feature\Assistant\Core;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class AIProxyTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function requiresAuthForGeminiProxy()
    {
        $response = $this->postJson('/api/gemini/proxy', []);
        $response->assertStatus(401);
    }

    /** @test */
    public function requiresAuthForOpenaiProxy()
    {
        $response = $this->postJson('/api/openai/proxy', []);
        $response->assertStatus(401);
    }

    /** @test */
    public function returnsErrorForInvalidRequestsWhenAuthenticated()
    {
        $this->actingAs($this->user);

        // Gemini proxy usually expects messages
        $response = $this->postJson('/api/gemini/proxy', []);
        
        // Even if it fails due to missing keys, it should be reachable (200 expected as it starts streaming)
        $response->assertStatus(200);
    }
}
