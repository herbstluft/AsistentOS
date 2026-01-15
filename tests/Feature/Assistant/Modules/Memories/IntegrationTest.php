<?php

namespace Tests\Feature\Assistant\Modules\Memories;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Memory;

class IntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function canStorePreferenceAsMemoryViaSql()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'insert',
            'sql' => "INSERT INTO memories (user_id, `key`, `value`, type, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], 'pref_nickname', 'Angelito', 'preference', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('memories', [
            'user_id' => $this->user->id,
            'key' => 'pref_nickname',
            'value' => 'Angelito'
        ]);
    }

    /** @test */
    public function canRetrieveMemoryByExactKeyViaApi()
    {
        $this->actingAs($this->user);

        Memory::create([
            'user_id' => $this->user->id,
            'key' => 'secret_password',
            'value' => 'hunter2'
        ]);

        $response = $this->getJson('/api/memories?key=secret_password');

        $response->assertStatus(200)
            ->assertJson(['value' => 'hunter2']);
    }

    /** @test */
    public function canFuzzySearchMemoriesViaApi()
    {
        $this->actingAs($this->user);

        Memory::create([
            'user_id' => $this->user->id,
            'key' => 'favorite_food',
            'value' => 'Sushi is my life'
        ]);

        $response = $this->getJson('/api/memories/search?query=Sushi');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
        $this->assertStringContainsString('Sushi', $response->json('0.value'));
    }

    /** @test */
    public function canUpdateExistingMemoryViaSql()
    {
        $this->actingAs($this->user);

        $memory = Memory::create([
            'user_id' => $this->user->id,
            'key' => 'current_mood',
            'value' => 'Happy'
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'update',
            'sql' => "UPDATE memories SET `value` = 'Excited' WHERE id = {$memory->id} AND user_id = [ID_USUARIO_ACTUAL]"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('memories', [
            'id' => $memory->id,
            'value' => 'Excited'
        ]);
    }

    /** @test */
    public function canDeleteMemoryViaSql()
    {
        $this->actingAs($this->user);

        $memory = Memory::create([
            'user_id' => $this->user->id,
            'key' => 'to_be_forgotten',
            'value' => 'Gone'
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'delete',
            'sql' => "DELETE FROM memories WHERE id = {$memory->id} AND user_id = [ID_USUARIO_ACTUAL]"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('memories', ['id' => $memory->id]);
    }
}
