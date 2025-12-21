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
        if (!$user) return response()->json(['palette_id' => 1, 'assistant_name' => 'Assistant']); // Default

        $pref = AssistantPreference::where('user_id', $user->id)->first();
        
        return response()->json([
            'palette_id' => $pref ? $pref->palette_id : 1,
            'assistant_name' => $pref ? ($pref->assistant_name ?? 'Assistant') : 'Assistant'
        ]);
    }

    // Guardar preferencia
    public function savePreference(Request $request)
    {
        $request->validate([
            'palette_id' => 'sometimes|exists:palettes,id',
            'assistant_name' => 'sometimes|string|max:50'
        ]);

        $user = Auth::user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $data = ['user_id' => $user->id];
        if ($request->has('palette_id')) $data['palette_id'] = $request->palette_id;
        if ($request->has('assistant_name')) $data['assistant_name'] = $request->assistant_name;

        $pref = AssistantPreference::updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        return response()->json([
            'success' => true,
            'palette_id' => $pref->palette_id,
            'assistant_name' => $pref->assistant_name
        ]);
    }
}
