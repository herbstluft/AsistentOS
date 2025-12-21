<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NoteController extends Controller
{
    // Render the UI Page
    public function index()
    {
        return Inertia::render('Notes');
    }

    // API: List Notes
    public function list()
    {
        $notes = DB::table('notes')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($notes);
    }

    // API: Create Note
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $id = DB::table('notes')->insertGetId([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'content' => $validated['content'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'id' => $id, 'message' => 'Nota creada']);
    }

    // API: Update Note
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $updated = DB::table('notes')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->update([
                'title' => $validated['title'],
                'content' => $validated['content'],
                'updated_at' => now(),
            ]);

        if (!$updated) {
            return response()->json(['success' => false, 'message' => 'Nota no encontrada o no autorizada'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Nota actualizada']);
    }

    // API: Delete Note
    public function destroy($id)
    {
        $deleted = DB::table('notes')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->delete();

        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Nota no encontrada'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Nota eliminada']);
    }
}
