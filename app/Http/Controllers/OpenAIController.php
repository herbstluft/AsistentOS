<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;

class OpenAIController extends Controller
{
    public function proxy(Request $request)
    {
        $apiKey = env('OPENAI_API_KEY');
        
        $payload = [
            'model' => $request->input('model', 'gpt-4o-mini'),
            'messages' => $request->input('messages', []),
            'temperature' => $request->input('temperature', 0.7),
            'stream' => true,
            'response_format' => $request->input('response_format'),
        ];

        return response()->stream(function () use ($payload, $apiKey) {
            $client = new Client();
            $response = $client->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => $payload,
                'stream' => true,
            ]);

            $body = $response->getBody();
            while (!$body->eof()) {
                // Read 1 byte at a time to ensure immediate flushing of every single character/token
                $chunk = $body->read(1);
                echo $chunk;
                if (connection_aborted()) break;
                flush();
            }
        }, 200, [
            'Cache-Control' => 'no-cache',
            'Content-Type' => 'text/event-stream',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
