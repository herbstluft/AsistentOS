<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeminiController extends Controller
{
    public function proxy(Request $request)
    {
        $apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY'); // Get from config/env
        
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

        // Endpoint for streaming
        $model = env('GEMINI_MODEL', 'gemini-2.0-flash');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:streamGenerateContent?key={$apiKey}";

        return response()->stream(function () use ($payload, $url) {
            $client = new \GuzzleHttp\Client();
            $response = $client->post($url, [
                'json' => $payload,
                'stream' => true,
            ]);

            $body = $response->getBody();
            while (!$body->eof()) {
                $chunk = $body->read(1024);
                echo $chunk;
                if (connection_aborted()) break;
                flush();
            }
        }, 200, [
            'Cache-Control' => 'no-cache',
            'Content-Type' => 'text/event-stream',
            'X-Accel-Buffering' => 'no', // For Nginx
        ]);
    }
}
