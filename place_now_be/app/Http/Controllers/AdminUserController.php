<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    private function ensureAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo admin.']],
            ], 403);
        }
        return null;
    }

    public function index(Request $request)
    {
        if ($resp = $this->ensureAdmin($request)) return $resp;

        return response()->json([
            'success' => true,
            'data' => UserResource::collection(User::orderByDesc('id')->get()),
        ]);
    }

    public function updateRole(Request $request, User $user)
    {
        if ($resp = $this->ensureAdmin($request)) return $resp;

        $validated = $request->validate([
            'role' => ['required', Rule::in(['buyer', 'seller', 'admin'])],
        ]);

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'success' => true,
            'message' => 'Uloga ažurirana.',
            'data' => ['user' => new UserResource($user)],
        ]);
    }
}
