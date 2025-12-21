<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeminiController extends Controller
{
    public function proxy(Request $request)
    {
        $apiKey = 'AIzaSyAZAs3i0-OEFm7F1BCqPTXjVsDvjlX4-8M'; // Ideally from env, but hardcoded for now to match frontend
        
        // Construct the request body for Gemini API
        // We expect the frontend to send the 'contents' array and 'generationConfig'
        $body = $request->all();
        
        // Default generation config if not provided, ensuring JSON response
        if (!isset($body['generationConfig'])) {
            $body['generationConfig'] = [
                'temperature' => 0.7,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 8192,
                'responseMimeType' => 'application/json',
            ];
        }

        // Add system instruction if provided (Gemini 1.5/2.5 API style)
        // Frontend might send 'system_instruction' separately
        $payload = [
            'contents' => $body['contents'] ?? [],
            'generationConfig' => $body['generationConfig'],
        ];

        if ($request->has('system_instruction')) {
            $payload['systemInstruction'] = [
                'parts' => [
                    ['text' => $request->input('system_instruction')]
                ]
            ];
        }

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}", $payload);

        if ($response->failed()) {
            return response()->json([
                'error' => 'Gemini API Error',
                'details' => $response->json()
            ], $response->status());
        }

        return $response->json();
    }
}
