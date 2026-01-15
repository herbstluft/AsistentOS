<?php

namespace Tests\Feature\Assistant\Modules\Preferences;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\AssistantPreference;

class IntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PaletteSeeder::class);
        $this->user = User::factory()->create();
    }

    /** @test */
    public function canChangeAssistantNameViaSql()
    {
        $this->actingAs($this->user);

        // Ensure preference exists
        AssistantPreference::updateOrCreate(
            ['user_id' => $this->user->id],
            ['assistant_name' => 'Exo', 'palette_id' => 1]
        );

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'update',
            'sql' => "UPDATE assistant_preferences SET assistant_name = 'Jarvis' WHERE user_id = [ID_USUARIO_ACTUAL]"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('assistant_preferences', [
            'user_id' => $this->user->id,
            'assistant_name' => 'Jarvis'
        ]);
    }
}
