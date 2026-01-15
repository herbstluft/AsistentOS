<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Gemini Realtime API Controller
 * 
 * Handles requests related to Gemini 2.0 Flash Realtime Multimodal Voice API
 */
class GeminiRealtimeController extends Controller
{
    /**
     * Check if Gemini Realtime API is available and configured
     */
    public function status(): JsonResponse
    {
        $apiKey = config('services.gemini.api_key');
        
        if (empty($apiKey)) {
            return response()->json([
                'available' => false,
                'reason' => 'Gemini API key not configured'
            ]);
        }

        // TODO: Add additional checks if needed
        // - API quota
        // - Network connectivity
        // - Feature flags
        
        return response()->json([
            'available' => true,
            'features' => [
                'audio_streaming' => true,
                'function_calling' => true,
                'barge_in' => true,
                'server_vad' => true
            ],
            'config' => [
                'sample_rate' => 24000,
                'audio_format' => 'pcm16',
                'max_audio_duration' => 300, // 5 minutes
            ]
        ]);
    }

    /**
     * Get Gemini API token (same endpoint as existing proxy)
     * This is used by the realtime WebSocket connection
     */
    public function token(): JsonResponse
    {
        $apiKey = config('services.gemini.api_key');
        
        if (empty($apiKey)) {
            return response()->json([
                'error' => 'API key not configured'
            ], 500);
        }

        return response()->json([
            'token' => $apiKey
        ]);
    }

    /**
     * Log realtime session events for debugging
     * (Optional - useful for monitoring)
     */
    public function logEvent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_type' => 'required|string',
            'session_id' => 'nullable|string',
            'data' => 'nullable|array',
            'timestamp' => 'nullable|integer'
        ]);

        // Log to Laravel log
        \Log::info('Gemini Realtime Event', [
            'user_id' => auth()->id(),
            'event' => $validated['event_type'],
            'session' => $validated['session_id'] ?? null,
            'data' => $validated['data'] ?? null,
            'timestamp' => $validated['timestamp'] ?? time()
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Get realtime session statistics
     * (Optional - for analytics dashboard)
     */
    public function stats(): JsonResponse
    {
        // This would query your database for session metrics
        // For now, returning mock data
        
        return response()->json([
            'total_sessions' => 0,
            'active_sessions' => 0,
            'avg_session_duration' => 0,
            'total_audio_minutes' => 0,
            'function_calls' => [
                'execute_sql' => 0,
                'control_spotify' => 0,
                'add_expense' => 0,
                'web_search' => 0,
            ]
        ]);
    }
}
