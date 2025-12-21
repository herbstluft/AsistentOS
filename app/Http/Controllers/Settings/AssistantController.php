<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AssistantController extends Controller
{
    /**
     * Show the assistant settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/Assistant', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the assistant settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'preferred_voice' => ['nullable', 'string', 'max:255'],
        ]);

        $request->user()->update($validated);

        return back()->with('status', 'assistant-settings-updated');
    }
}
