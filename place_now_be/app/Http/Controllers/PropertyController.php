<?php

namespace App\Http\Controllers;

use App\Http\Resources\PropertyResource;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PropertyController extends Controller
{
    // Public list with simple filter/sort.
    public function index(Request $request)
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(['available', 'unavailable', 'paused'])],
            'sort' => ['nullable', Rule::in(['title', 'city', 'price_per_night', 'status', 'id'])],
            'dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $query = Property::query();

        $query->when($validated['status'] ?? null, fn($x) => $x->where('status', $validated['status']));
        $query->when($validated['q'] ?? null, fn($x) => $x->where('title', 'like', '%' . $validated['q'] . '%'));
        $query->when($validated['city'] ?? null, fn($x) => $x->where('city', 'like', '%' . $validated['city'] . '%'));

        $sort = $validated['sort'] ?? 'id';
        $dir = $validated['dir'] ?? 'desc';

        $paginator = $query->orderBy($sort, $dir)->paginate(6)->withQueryString();

        return PropertyResource::collection($paginator)->additional([
            'success' => true,
        ]);
    }

    public function show(Property $property)
    {
        return response()->json([
            'success' => true,
            'data' => new PropertyResource($property),
        ]);
    }

    private function ensureSeller(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo seller.']],
            ], 403);
        }
        return null;
    }

    private function ensureOwn(Request $request, Property $property)
    {
        if ((int)$property->seller_id !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu nad ovom nekretninom.',
                'errors' => ['authorization' => ['Samo svoje nekretnine.']],
            ], 403);
        }
        return null;
    }

    public function store(Request $request)
    {
        if ($resp = $this->ensureSeller($request)) return $resp;

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:200'],
            'description' => ['nullable', 'string', 'max:3000'],
            'address' => ['required', 'string', 'min:2', 'max:255'],
            'city' => ['required', 'string', 'min:2', 'max:120'],
            'price_per_night' => ['required', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['available', 'unavailable', 'paused'])],
            '360_image_url' => ['nullable', 'url', 'max:500'],
            '3d_sketchfab_model_url' => ['nullable', 'url', 'max:500'],
        ]);

        $property = Property::create([
            'seller_id' => $request->user()->id,
            ...$validated,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Nekretnina kreirana.',
            'data' => new PropertyResource($property),
        ], 201);
    }

    public function update(Request $request, Property $property)
    {
        if ($resp = $this->ensureSeller($request)) return $resp;
        if ($resp = $this->ensureOwn($request, $property)) return $resp;

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'min:2', 'max:200'],
            'description' => ['nullable', 'string', 'max:3000'],
            'address' => ['sometimes', 'required', 'string', 'min:2', 'max:255'],
            'city' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'price_per_night' => ['sometimes', 'required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', Rule::in(['available', 'unavailable', 'paused'])],
            '360_image_url' => ['nullable', 'url', 'max:500'],
            '3d_sketchfab_model_url' => ['nullable', 'url', 'max:500'],
        ]);

        $property->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Nekretnina ažurirana.',
            'data' => new PropertyResource($property),
        ]);
    }

    public function destroy(Request $request, Property $property)
    {
        if ($resp = $this->ensureSeller($request)) return $resp;
        if ($resp = $this->ensureOwn($request, $property)) return $resp;

        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'Nekretnina obrisana.',
            'data' => null,
        ]);
    }
}
