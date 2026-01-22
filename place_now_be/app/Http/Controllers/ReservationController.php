<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReservationResource;
use App\Models\Property;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class ReservationController extends Controller
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

    // Buyer: list my reservations.
    public function buyerIndex(Request $request)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        $items = Reservation::query()
            ->where('buyer_id', $request->user()->id)
            ->with('property')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ReservationResource::collection($items),
        ]);
    }

    // Buyer: create reservation for a property.
    public function store(Request $request, Property $property)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        if ($property->status !== 'available') {
            return response()->json([
                'success' => false,
                'message' => 'Nekretnina nije dostupna.',
                'errors' => ['property' => ['Rezervacija je moguća samo ako je status available.']],
            ], 422);
        }

        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $start = Carbon::parse($validated['start_date'])->startOfDay();
        $end = Carbon::parse($validated['end_date'])->startOfDay();

        if ($start->greaterThanOrEqualTo($end)) {
            return response()->json([
                'success' => false,
                'message' => 'Neispravni datumi.',
                'errors' => ['dates' => ['Početni datum mora biti pre krajnjeg.']],
            ], 422);
        }

        $overlap = Reservation::query()
            ->where('property_id', $property->id)
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->where(function ($q) use ($start, $end) {
                $q->where('start_date', '<', $end->toDateString())
                  ->where('end_date', '>', $start->toDateString());
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'success' => false,
                'message' => 'Nekretnina je već rezervisana u tom periodu.',
                'errors' => ['availability' => ['Izaberite drugi period.']],
            ], 422);
        }

        $days = $start->diffInDays($end);
        $total = (float)$property->price_per_night * $days;

        $reservation = Reservation::create([
            'property_id' => $property->id,
            'buyer_id' => $request->user()->id,
            'seller_id' => $property->seller_id,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'guests' => $validated['guests'],
            'total_price' => $total,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rezervacija kreirana.',
            'data' => new ReservationResource($reservation->load('property')),
        ], 201);
    }

    // Buyer: cancel my reservation.
    public function cancel(Request $request, Reservation $reservation)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        if ((int)$reservation->buyer_id !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo svoje rezervacije.']],
            ], 403);
        }

        $start = Carbon::parse($reservation->start_date);
        if ($start->lessThanOrEqualTo(Carbon::today())) {
            return response()->json([
                'success' => false,
                'message' => 'Ne može otkazivanje.',
                'errors' => ['status' => ['Rezervacija je već započela.']],
            ], 422);
        }

        if (!in_array($reservation->status, ['pending', 'confirmed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Ne može otkazivanje u ovom statusu.',
                'errors' => ['status' => ['Dozvoljeno: pending/confirmed.']],
            ], 422);
        }

        $reservation->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Rezervacija otkazana.',
            'data' => new ReservationResource($reservation),
        ]);
    }

    // Seller: list my reservations.
    public function sellerIndex(Request $request)
    {
        if ($resp = $this->ensureSeller($request)) return $resp;

        $items = Reservation::query()
            ->where('seller_id', $request->user()->id)
            ->with('property')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ReservationResource::collection($items),
        ]);
    }

    // Seller: update status for my reservation.
    public function updateStatus(Request $request, Reservation $reservation)
    {
        if ($resp = $this->ensureSeller($request)) return $resp;

        if ((int)$reservation->seller_id !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo rezervacije za vaše nekretnine.']],
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'cancelled', 'completed'])],
        ]);

        $reservation->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Status ažuriran.',
            'data' => new ReservationResource($reservation->load('property')),
        ]);
    }
}
