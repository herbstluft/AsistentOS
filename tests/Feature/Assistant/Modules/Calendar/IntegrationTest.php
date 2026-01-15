<?php

namespace Tests\Feature\Assistant\Modules\Calendar;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Appointment;

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
    public function canCreateAppointmentViaSql()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'insert',
            'sql' => "INSERT INTO appointments (user_id, title, start_time, end_time, status, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], 'Reunión de Negocios', '2026-01-05 10:00:00', '2026-01-05 11:00:00', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', [
            'user_id' => $this->user->id,
            'title' => 'Reunión de Negocios'
        ]);
    }

    /** @test */
    public function canListTodaysAppointments()
    {
        $this->actingAs($this->user);

        // Create one for today and one for tomorrow
        Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Cita Hoy',
            'start_time' => now()->format('Y-m-d 09:00:00'),
            'end_time' => now()->format('Y-m-d 10:00:00'),
        ]);

        Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Cita Mañana',
            'start_time' => now()->addDay()->format('Y-m-d 09:00:00'),
            'end_time' => now()->addDay()->format('Y-m-d 10:00:00'),
        ]);

        $today = now()->format('Y-m-d');
        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT * FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND DATE(start_time) = '{$today}'"
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Cita Hoy', $response->json('data.0.title'));
    }

    /** @test */
    public function canUpdateAppointmentStatus()
    {
        $this->actingAs($this->user);

        $appointment = Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Cita para Cancelar',
            'start_time' => '2026-01-05 10:00:00',
            'end_time' => '2026-01-05 11:00:00',
            'status' => 'pending'
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'update',
            'sql' => "UPDATE appointments SET status = 'cancelled' WHERE id = {$appointment->id} AND user_id = [ID_USUARIO_ACTUAL]"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled'
        ]);
    }

    /** @test */
    public function canDeleteAppointment()
    {
        $this->actingAs($this->user);

        $appointment = Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Cita Efímera',
            'start_time' => '2026-01-05 10:00:00',
            'end_time' => '2026-01-05 11:00:00',
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'delete',
            'sql' => "DELETE FROM appointments WHERE id = {$appointment->id} AND user_id = [ID_USUARIO_ACTUAL]"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('appointments', ['id' => $appointment->id]);
    }

    /** @test */
    public function canSearchAppointmentsByTitleFuzzy()
    {
        $this->actingAs($this->user);

        Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Reunión con el CEO',
            'start_time' => '2026-01-05 10:00:00',
            'end_time' => '2026-01-05 11:00:00',
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT * FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND title LIKE '%CEO%'"
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }
}
