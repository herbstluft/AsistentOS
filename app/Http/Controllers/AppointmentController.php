<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $appointments = $user->appointments()
            ->orderBy('start_time', 'asc')
            ->get();
        
        return response()->json($appointments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after:start_time',
            'reminder_minutes_before' => 'integer|min:0',
            'status' => 'string|in:pending,completed,cancelled',
        ]);

        // Default end_time to 1 hour after start_time if not provided
        if (!isset($validated['end_time'])) {
            $validated['end_time'] = \Carbon\Carbon::parse($validated['start_time'])->addHour();
        }

        $appointment = $request->user()->appointments()->create($validated);

        $this->broadcastUpdate($request->user()->id);

        return response()->json($appointment, 201);
    }

    public function update(Request $request, $id)
    {
        $appointment = $request->user()->appointments()->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'sometimes|date',
            'end_time' => 'nullable|date|after:start_time',
            'reminder_minutes_before' => 'integer|min:0',
            'status' => 'sometimes|string|in:pending,completed,cancelled',
        ]);

        $appointment->update($validated);

        $this->broadcastUpdate($request->user()->id);

        return response()->json($appointment);
    }

    public function destroy(Request $request, $id)
    {
        $appointment = $request->user()->appointments()->findOrFail($id);
        $appointment->delete();

        $this->broadcastUpdate($request->user()->id);

        return response()->json(['message' => 'Deleted successfully']);
    }

    private function broadcastUpdate($userId)
    {
        try {
            \Illuminate\Support\Facades\Http::timeout(1)->post(config('services.socket_server.url') . '/api/broadcast', [
                'event' => 'appointments:updated',
                'data' => [
                    'userId' => $userId
                ]
            ]);
        } catch (\Exception $e) {
            // Ignore if socket server is down to avoid breaking the app
        }
    }
}
