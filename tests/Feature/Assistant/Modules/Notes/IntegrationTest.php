<?php

namespace Tests\Feature\Assistant\Modules\Notes;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Note;

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
    public function canCreateNoteViaSql()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'insert',
            'sql' => "INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], 'Nueva Nota Científica', 'Contenido de la investigación...', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('notes', [
            'user_id' => $this->user->id,
            'title' => 'Nueva Nota Científica'
        ]);
    }

    /** @test */
    public function canRetrieveNotesViaApi()
    {
        $this->actingAs($this->user);

        Note::create([
            'user_id' => $this->user->id,
            'title' => 'Nota 1',
            'content' => 'Lorem ipsum'
        ]);

        $response = $this->getJson('/api/notes');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
    }

    /** @test */
    public function canUpdateNoteViaApi()
    {
        $this->actingAs($this->user);

        $note = Note::create([
            'user_id' => $this->user->id,
            'title' => 'Original Title',
            'content' => 'Old content'
        ]);

        $response = $this->putJson("/api/notes/{$note->id}", [
            'title' => 'Updated Title',
            'content' => 'New content'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Updated Title'
        ]);
    }

    /** @test */
    public function canDeleteNoteViaApi()
    {
        $this->actingAs($this->user);

        $note = Note::create([
            'user_id' => $this->user->id,
            'title' => 'To delete',
            'content' => 'content'
        ]);

        $response = $this->deleteJson("/api/notes/{$note->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    }

    /** @test */
    public function canSearchNotesViaSqlFuzzy()
    {
        $this->actingAs($this->user);

        Note::create([
            'user_id' => $this->user->id,
            'title' => 'Idea millonaria',
            'content' => 'Vender aire enlatado'
        ]);

        $response = $this->postJson('/api/execute-ai-query', [
            'intent' => 'select',
            'sql' => "SELECT * FROM notes WHERE user_id = [ID_USUARIO_ACTUAL] AND title LIKE '%millonaria%'"
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }
}
