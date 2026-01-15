<?php

namespace Tests\Feature\Assistant\Modules\Calendar;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Appointment;

class ComplexCalendarTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function canFindNextUpcomingAppointment()
    {
        $this->actingAs($this->user);

        // Appointment in the past
        Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Past Meeting',
            'start_time' => now('UTC')->subHours(2)->format('Y-m-d H:i:s'),
            'end_time' => now('UTC')->subHours(1)->format('Y-m-d H:i:s'),
        ]);

        // Appointment in the future (Soonest)
        Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Next Meeting',
            'start_time' => now('UTC')->addHours(1)->format('Y-m-d H:i:s'),
            'end_time' => now('UTC')->addHours(2)->format('Y-m-d H:i:s'),
        ]);

        // Appointment further in the future
        Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Far Meeting',
            'start_time' => now('UTC')->addHours(5)->format('Y-m-d H:i:s'),
            'end_time' => now('UTC')->addHours(6)->format('Y-m-d H:i:s'),
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT * FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND start_time > CURRENT_TIMESTAMP ORDER BY start_time ASC LIMIT 1"
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Next Meeting', $response->json('data.0.title'));
    }

    /** @test */
    public function canCheckForConflicts()
    {
        $this->actingAs($this->user);

        $startTime = '2026-05-20 10:00:00';
        $endTime = '2026-05-20 11:00:00';

        Appointment::create([
            'user_id' => $this->user->id,
            'title' => 'Existing Meeting',
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);

        // Check if there's anything overlapping with 10:30
        $checkTime = '2026-05-20 10:30:00';
        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT * FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND '{$checkTime}' BETWEEN start_time AND end_time"
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }
}
