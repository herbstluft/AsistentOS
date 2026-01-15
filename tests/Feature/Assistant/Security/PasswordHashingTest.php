<?php

namespace Tests\Feature\Assistant\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PasswordHashingTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create([
            'is_admin' => true,
            'security_nip' => '1234'
        ]);
    }

    /** @test */
    public function automaticallyHashesPasswordsInUpdateQueries()
    {
        $this->actingAs($this->admin);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'update',
            'sql' => "UPDATE users SET password = 'new-plain-password' WHERE id = [ID_USUARIO_ACTUAL]",
            'nip' => '1234'
        ]);

        $response->assertStatus(200);

        $this->admin->refresh();
        $this->assertTrue(Hash::check('new-plain-password', $this->admin->password));
    }

    /** @test */
    public function automaticallyHashesPasswordsInInsertQueries()
    {
        $this->actingAs($this->admin);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'insert',
            'sql' => "INSERT INTO users (name, email, password, is_admin, security_nip, created_at, updated_at) VALUES ('New User', 'new@example.com', 'secret123', 0, '0000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            'nip' => '1234'
        ]);

        $response->assertStatus(200);

        $newUser = User::where('email', 'new@example.com')->first();
        $this->assertNotNull($newUser);
        $this->assertTrue(Hash::check('secret123', $newUser->password));
    }
}
