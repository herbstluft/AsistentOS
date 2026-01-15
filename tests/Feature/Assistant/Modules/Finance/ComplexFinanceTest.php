<?php

namespace Tests\Feature\Assistant\Modules\Finance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Expense;
use Carbon\Carbon;

class ComplexFinanceTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function canCalculateExpensesForSpecificTimeRange()
    {
        $this->actingAs($this->user);

        // Expense today
        Expense::create([
            'user_id' => $this->user->id,
            'amount' => 100,
            'category' => 'Comida',
            'description' => 'Almuerzo hoy',
            'date' => now()->format('Y-m-d'),
        ]);

        // Expense 2 days ago
        Expense::create([
            'user_id' => $this->user->id,
            'amount' => 50,
            'category' => 'Comida',
            'description' => 'Cena antier',
            'date' => now()->subDays(2)->format('Y-m-d'),
        ]);

        // Expense 5 days ago (should be excluded)
        Expense::create([
            'user_id' => $this->user->id,
            'amount' => 200,
            'category' => 'Comida',
            'description' => 'Súper semana pasada',
            'date' => now()->subDays(5)->format('Y-m-d'),
        ]);

        $threeDaysAgo = now()->subDays(3)->format('Y-m-d');
        
        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT SUM(amount) as total FROM expenses WHERE user_id = [ID_USUARIO_ACTUAL] AND category = 'Comida' AND date >= '{$threeDaysAgo}'"
        ]);

        $response->assertStatus(200);
        $this->assertEquals(150, $response->json('data.0.total'));
    }

    /** @test */
    public function canGroupExpensesByCategory()
    {
        $this->actingAs($this->user);

        Expense::create(['user_id' => $this->user->id, 'amount' => 10, 'category' => 'A', 'description' => 'test', 'date' => now()]);
        Expense::create(['user_id' => $this->user->id, 'amount' => 20, 'category' => 'A', 'description' => 'test', 'date' => now()]);
        Expense::create(['user_id' => $this->user->id, 'amount' => 15, 'category' => 'B', 'description' => 'test', 'date' => now()]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = [ID_USUARIO_ACTUAL] GROUP BY category"
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(2, $data);
        
        $aTotal = collect($data)->firstWhere('category', 'A')['total'];
        $this->assertEquals(30, $aTotal);
    }
}
