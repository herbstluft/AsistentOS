<?php

namespace Tests\Feature\Assistant\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class NipVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $normalUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create([
            'is_admin' => true,
            'security_nip' => '1234'
        ]);
        $this->normalUser = User::factory()->create([
            'is_admin' => false,
            'security_nip' => '0000'
        ]);
    }

    /** @test */
    public function deniesCriticalOperationsToNonAdminUsers()
    {
        $this->actingAs($this->normalUser);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'delete',
            'sql' => "DELETE FROM users WHERE id = {$this->admin->id}"
        ]);

        $response->assertStatus(403)
            ->assertJson(['success' => false, 'error' => 'ACCESO DENEGADO: Se requieren permisos de administrador para esta operación.']);
    }

    /** @test */
    public function requiresNipForCriticalOperationsEvenForAdmins()
    {
        $this->actingAs($this->admin);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'delete',
            'sql' => "DELETE FROM users WHERE id = {$this->normalUser->id}"
        ]);

        $response->assertStatus(403)
            ->assertJsonStructure(['success', 'error']);
        
        $this->assertStringContainsString('NIP', $response->json('error'));
    }

    /** @test */
    public function allowsCriticalOperationsWithCorrectNip()
    {
        $this->actingAs($this->admin);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'delete',
            'sql' => "DELETE FROM biometric_credentials WHERE user_id = {$this->admin->id}", // critical if it hits 'users' or unprotected
            'nip' => '1234'
        ]);

        // Note: biometric_credentials is in safeTables, so it might not even need NIP if handled as safe.
        // Let's test hitting 'users' instead.
        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'update',
            'sql' => "UPDATE users SET name = 'New Name' WHERE id = [ID_USUARIO_ACTUAL]",
            'nip' => '1234'
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
        
        $this->assertDatabaseHas('users', ['id' => $this->admin->id, 'name' => 'New Name']);
    }

    /** @test */
    public function validatesNipOnlyViaSpecialIntent()
    {
        $this->actingAs($this->admin);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'validate_nip',
            'sql' => 'none',
            'nip' => '1234'
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'NIP Correcto']);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'validate_nip',
            'sql' => 'none',
            'nip' => 'wrong'
        ]);

        $response->assertStatus(403)
            ->assertJson(['success' => false, 'error' => 'NIP INCORRECTO']);
    }
}
