<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Memory;
use Illuminate\Support\Facades\Auth;

class MemoryController extends Controller
{
    /**
     * Get memories for the authenticated user.
     * Optionally filter by key.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $query = Memory::where('user_id', $user->id);

        // Priority 1: Exact Key Match
        if ($request->has('key') && !$request->has('q')) {
            $memory = $query->where('key', $request->key)->first();
            return response()->json($memory);
        }

        // Priority 2: Fuzzy Search (Across Key and Value)
        if ($request->has('q')) {
            $searchTerm = '%' . $request->q . '%';
            $results = $query->where(function ($q) use ($searchTerm) {
                $q->where('key', 'LIKE', $searchTerm)
                  ->orWhere('value', 'LIKE', $searchTerm);
            })->latest()->limit(10)->get();
            return response()->json($results);
        }

        // Default: List latest memories
        return response()->json($query->latest()->limit(20)->get());
    }

    /**
     * Specialized search for the AI orchestrator.
     */
    public function search(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json([]);

        $searchTerm = $request->query('query');
        if (!$searchTerm) return response()->json([]);

        $parts = explode(' ', $searchTerm);
        $query = Memory::where('user_id', $user->id);

        $query->where(function($q) use ($parts) {
            foreach ($parts as $part) {
                if (strlen($part) < 3) continue;
                $q->orWhere('key', 'LIKE', "%$part%")
                  ->orWhere('value', 'LIKE', "%$part%");
            }
        });

        return response()->json($query->latest()->limit(5)->get());
    }

    /**
     * Store or update a memory.
     */
    public function store(Request $request)
    {
        $request->validate([
            'key' => 'required|string|max:255',
            'value' => 'required',
            'type' => 'nullable|string|max:50',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $memory = Memory::updateOrCreate(
            ['user_id' => $user->id, 'key' => $request->key],
            ['value' => $request->value, 'type' => $request->type ?? 'general']
        );

        return response()->json([
            'success' => true,
            'memory' => $memory
        ]);
    }
}
