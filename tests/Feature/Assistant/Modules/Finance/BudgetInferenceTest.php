<?php

namespace Tests\Feature\Assistant\Modules\Finance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Income;
use App\Models\Expense;

class BudgetInferenceTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function canCalculateNetBalance()
    {
        $this->actingAs($this->user);

        // Income: 1000
        Income::create(['user_id' => $this->user->id, 'amount' => 1000, 'description' => 'Salary', 'date' => now()]);
        
        // Expenses: 200 + 300 = 500
        Expense::create(['user_id' => $this->user->id, 'amount' => 200, 'description' => 'Rent', 'date' => now()]);
        Expense::create(['user_id' => $this->user->id, 'amount' => 300, 'description' => 'Food', 'date' => now()]);

        // Query for net balance
        // The assistant might use a UNION or just two queries. 
        // If it uses one complex query:
        $sql = "SELECT (SELECT SUM(amount) FROM incomes WHERE user_id = [ID_USUARIO_ACTUAL]) - (SELECT SUM(amount) FROM expenses WHERE user_id = [ID_USUARIO_ACTUAL]) as balance";
        
        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'complex',
            'sql' => $sql
        ]);

        $response->assertStatus(200);
        $this->assertEquals(500, $response->json('data.0.balance'));
    }
}
