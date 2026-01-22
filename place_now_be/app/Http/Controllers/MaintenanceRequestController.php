<?php

namespace App\Http\Controllers;

use App\Http\Resources\MaintenanceRequestResource;
use App\Models\MaintenanceRequest;
use App\Models\Property;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class MaintenanceRequestController extends Controller
{
    private function ensureBuyer(Request $request)
    {
        if ($request->user()->role !== 'buyer') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo buyer.']],
            ], 403);
        }
        return null;
    }

    private function ensureSellerOrAdmin(Request $request)
    {
        if (!in_array($request->user()->role, ['seller', 'admin'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo seller/admin.']],
            ], 403);
        }
        return null;
    }

    // Buyer: list my requests.
    public function buyerIndex(Request $request)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        $items = MaintenanceRequest::query()
            ->where('reported_by', $request->user()->id)
            ->with('property')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => MaintenanceRequestResource::collection($items),
        ]);
    }

    // Buyer: create request for a property (must have active or recently ended reservation).
    public function store(Request $request, Property $property)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:160'],
            'description' => ['required', 'string', 'max:3000'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
        ]);

        $today = Carbon::today();
        $recent = $today->copy()->subDays(7)->toDateString();

        $hasReservation = Reservation::query()
            ->where('property_id', $property->id)
            ->where('buyer_id', $request->user()->id)
            ->whereNotIn('status', ['cancelled'])
            ->where(function ($q) use ($today, $recent) {
                $q->where('start_date', '<=', $today->toDateString())
                  ->where('end_date', '>=', $recent);
            })
            ->exists();

        if (!$hasReservation) {
            return response()->json([
                'success' => false,
                'message' => 'Ne možete kreirati zahtev.',
                'errors' => ['reservation' => ['Potrebna je aktivna ili skoro završena rezervacija.']],
            ], 422);
        }

        $mr = MaintenanceRequest::create([
            'property_id' => $property->id,
            'reported_by' => $request->user()->id,
            'assigned_to' => $property->seller_id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => 'open',
            'reported_at' => now(),
            'resolved_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Zahtev kreiran.',
            'data' => new MaintenanceRequestResource($mr->load('property')),
        ], 201);
    }

    // Seller/Admin: list requests.
    public function index(Request $request)
    {
        if ($resp = $this->ensureSellerOrAdmin($request)) return $resp;

        $q = MaintenanceRequest::query()->with('property');

        if ($request->user()->role === 'seller') {
            $q->where('assigned_to', $request->user()->id);
        }

        return response()->json([
            'success' => true,
            'data' => MaintenanceRequestResource::collection($q->orderByDesc('id')->get()),
        ]);
    }

    // Seller/Admin: update status.
    public function updateStatus(Request $request, MaintenanceRequest $maintenanceRequest)
    {
        if ($resp = $this->ensureSellerOrAdmin($request)) return $resp;

        if ($request->user()->role === 'seller' && (int)$maintenanceRequest->assigned_to !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo zahteve dodeljene vama.']],
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['open', 'in_progress', 'resolved', 'closed'])],
        ]);

        $maintenanceRequest->update([
            'status' => $validated['status'],
            'resolved_at' => in_array($validated['status'], ['resolved', 'closed'], true)
                ? ($maintenanceRequest->resolved_at ?? now())
                : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status ažuriran.',
            'data' => new MaintenanceRequestResource($maintenanceRequest->load('property')),
        ]);
    }
}
