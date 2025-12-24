<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AssistantPreference;
use Illuminate\Support\Facades\Auth;

class AssistantPreferenceController extends Controller
{
    // Obtener preferencia del usuario actual
    public function getPreference()
    {
        $user = Auth::user();
        if (!$user) return response()->json(['assistant_name' => 'Exo']);

        $pref = AssistantPreference::where('user_id', $user->id)->first();
        
        return response()->json([
            'assistant_name' => $pref ? ($pref->assistant_name ?? 'Exo') : 'Exo'
        ]);
    }

    // Guardar preferencia
    public function savePreference(Request $request)
    {
        $request->validate([
            'assistant_name' => 'required|string|max:50'
        ]);

        $user = Auth::user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $pref = AssistantPreference::firstOrNew(['user_id' => $user->id]);

        if ($request->has('assistant_name')) {
            $pref->assistant_name = $request->assistant_name;
        }

        $pref->save();

        return response()->json([
            'success' => true,
            'assistant_name' => $pref->assistant_name
        ]);
    }
}
