<?php

namespace Tests\Feature\Assistant\Modules\Incomes;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Income;

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
    public function canRecordNewIncomeViaSql()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'insert',
            'sql' => "INSERT INTO incomes (user_id, amount, description, source, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], 5000, 'Pago Freelance', 'Upwork', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('incomes', [
            'user_id' => $this->user->id,
            'amount' => 5000,
            'description' => 'Pago Freelance'
        ]);
    }

    /** @test */
    public function canCalculateTotalMonthlyIncomes()
    {
        $this->actingAs($this->user);

        Income::create([
            'user_id' => $this->user->id,
            'amount' => 3000,
            'description' => 'Sueldo',
            'date' => now()->format('Y-m-d'),
        ]);

        Income::create([
            'user_id' => $this->user->id,
            'amount' => 1500,
            'description' => 'Bono',
            'date' => now()->format('Y-m-d'),
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT SUM(amount) as total FROM incomes WHERE user_id = [ID_USUARIO_ACTUAL] AND strftime('%m', date) = strftime('%m', 'now')"
        ]);
        
        // Note: The test uses SQLite. strftime is SQLite syntax. 
        // In MySQL it would be MONTH(date). 
        // Our app likely uses MySQL in prod but SQLite in tests.
        // Let's use a more cross-compatible way if possible or just stick to SQLite for tests.

        $response->assertStatus(200);
        $this->assertEquals(4500, $response->json('data.0.total'));
    }

    /** @test */
    public function canListIncomesBySource()
    {
        $this->actingAs($this->user);

        Income::create(['user_id' => $this->user->id, 'amount' => 100, 'description' => 'A', 'source' => 'Ventas', 'date' => now()]);
        Income::create(['user_id' => $this->user->id, 'amount' => 200, 'description' => 'B', 'source' => 'Sueldo', 'date' => now()]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT * FROM incomes WHERE user_id = [ID_USUARIO_ACTUAL] AND source = 'Sueldo'"
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals(200, $response->json('data.0.amount'));
    }
}
