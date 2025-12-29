<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DeepgramController extends Controller
{
    /**
     * Return the Deepgram API token for authenticated users.
     * This keeps the API key secure on the server side.
     */
    public function token(Request $request)
    {
        $apiKey = config('services.deepgram.api_key');
        
        if (!$apiKey) {
            return response()->json([
                'error' => 'Deepgram API key not configured'
            ], 500);
        }

        return response()->json([
            'token' => $apiKey
        ]);
    }
}
