<?php

namespace Tests\Feature\Assistant\Modules\Finance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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
    public function canRecordNewExpenseViaSql()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'insert',
            'sql' => "INSERT INTO expenses (user_id, amount, category, description, date, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], 2500, 'Renta', 'Pago mensual de departamento', '2026-01-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('expenses', [
            'user_id' => $this->user->id,
            'amount' => 2500,
            'category' => 'Renta'
        ]);
    }

    /** @test */
    public function canCalculateTotalMonthlyExpenses()
    {
        $this->actingAs($this->user);

        // Seed expenses
        DB::table('expenses')->insert([
            ['user_id' => $this->user->id, 'amount' => 100, 'category' => 'Comida', 'description' => 'Almuerzo', 'date' => '2026-01-01'],
            ['user_id' => $this->user->id, 'amount' => 200, 'category' => 'Transporte', 'description' => 'Uber', 'date' => '2026-01-02'],
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT SUM(amount) as total FROM expenses WHERE user_id = [ID_USUARIO_ACTUAL] AND date LIKE '2026-01%'"
        ]);

        $response->assertStatus(200);
        $this->assertEquals(300, (float)$response->json('data.0.total'));
    }

    /** @test */
    public function canListExpensesByCategory()
    {
        $this->actingAs($this->user);

        DB::table('expenses')->insert([
            ['user_id' => $this->user->id, 'amount' => 50, 'category' => 'Ocio', 'description' => 'Cine', 'date' => '2026-01-01'],
            ['user_id' => $this->user->id, 'amount' => 100, 'category' => 'Comida', 'description' => 'Cena', 'date' => '2026-01-01'],
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT * FROM expenses WHERE user_id = [ID_USUARIO_ACTUAL] AND category = 'Ocio'"
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals(50, (float)$response->json('data.0.amount'));
    }

    /** @test */
    public function canSearchExpensesByDescription()
    {
        $this->actingAs($this->user);

        DB::table('expenses')->insert([
            ['user_id' => $this->user->id, 'amount' => 10, 'category' => 'Varios', 'description' => 'Chicles en el OXXO', 'date' => '2026-01-01'],
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT * FROM expenses WHERE user_id = [ID_USUARIO_ACTUAL] AND description LIKE '%OXXO%'"
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    /** @test */
    public function canDeleteExpense()
    {
        $this->actingAs($this->user);

        $id = DB::table('expenses')->insertGetId([
            'user_id' => $this->user->id,
            'amount' => 100,
            'category' => 'Error',
            'description' => 'Test',
            'date' => '2026-01-01'
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'delete',
            'sql' => "DELETE FROM expenses WHERE id = {$id} AND user_id = [ID_USUARIO_ACTUAL]"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('expenses', ['id' => $id]);
    }
}
