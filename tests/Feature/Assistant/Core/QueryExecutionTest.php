<?php

namespace Tests\Feature\Assistant\Core;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class QueryExecutionTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'is_admin' => true,
            'security_nip' => '1234'
        ]);
    }

    /** @test */
    public function canExecuteSelectQueryWithUserPlaceholder()
    {
        $this->actingAs($this->user);

        // Seed some data
        DB::table('notes')->insert([
            'user_id' => $this->user->id,
            'title' => 'Test Note',
            'content' => 'Test Content',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => 'SELECT * FROM notes WHERE user_id = [ID_USUARIO_ACTUAL]'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    [
                        'title' => 'Test Note'
                    ]
                ]
            ]);
    }

    /** @test */
    public function canExecuteInsertQueryOnSafeTablesWithoutNip()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'insert',
            'sql' => "INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], 'AI Note', 'Content', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ]);

        if ($response->status() !== 200) dump($response->json());
        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('notes', [
            'user_id' => $this->user->id,
            'title' => 'AI Note'
        ]);
    }

    /** @test */
    public function replacesAllCommonUserIdPlaceholders()
    {
        $this->actingAs($this->user);

        $sqlTemplates = [
            'SELECT * FROM notes WHERE user_id = [ID_USUARIO_ACTUAL]',
            'SELECT * FROM notes WHERE user_id = [USER_ID]',
            'SELECT * FROM notes WHERE user_id = @current_user_id',
            'SELECT * FROM notes WHERE user_id = :user_id',
        ];

        foreach ($sqlTemplates as $sql) {
            $response = $this->postJson('/api/execute-ai-query', [
                'intent' => 'select',
                'sql' => $sql
            ]);

            $response->assertStatus(200);
            $this->assertEquals($this->user->id, $response->json('executed_sql') ? explode('= ', $response->json('executed_sql'))[1] : null);
        }
    }
}
