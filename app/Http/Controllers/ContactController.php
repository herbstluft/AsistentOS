<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $query = Contact::where('user_id', Auth::id());

        if ($request->has('name')) {
            $query->where('name', 'like', '%' . $request->name . '%');
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ]);

        // Check for duplicates
        $exists = Contact::where('user_id', Auth::id())
            ->where('phone', $request->phone)
            ->first();

        if ($exists) {
            return response()->json(['message' => 'Duplicate contact'], 409);
        }

        $contact = Contact::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'company' => $request->company,
            'notes' => $request->notes,
        ]);

        return response()->json($contact, 201);
    }
    public function update(Request $request, $id)
    {
        $contact = Contact::where('user_id', Auth::id())->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $contact->update($request->all());

        return response()->json($contact);
    }

    public function destroy($id)
    {
        $contact = Contact::where('user_id', Auth::id())->findOrFail($id);
        $contact->delete();
        return response()->json(['message' => 'Contact deleted']);
    }
}
