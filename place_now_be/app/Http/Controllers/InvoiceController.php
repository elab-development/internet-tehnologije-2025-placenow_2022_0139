<?php

namespace App\Http\Controllers;

use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
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

    // Seller/Admin list.
    public function index(Request $request)
    {
        if ($resp = $this->ensureSellerOrAdmin($request)) return $resp;

        $q = Invoice::query()->with('reservation.property');

        if ($request->user()->role === 'seller') {
            $q->where('issued_by', $request->user()->id);
        }

        return response()->json([
            'success' => true,
            'data' => InvoiceResource::collection($q->orderByDesc('id')->get()),
        ]);
    }

    // Seller/Admin create for reservation.
    public function store(Request $request, Reservation $reservation)
    {
        if ($resp = $this->ensureSellerOrAdmin($request)) return $resp;

        if ($request->user()->role === 'seller' && (int)$reservation->seller_id !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo svoje rezervacije.']],
            ], 403);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'due_date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', Rule::in(['unpaid', 'paid', 'overdue', 'cancelled'])],
        ]);

        $invoice = Invoice::create([
            'reservation_id' => $reservation->id,
            'issued_by' => $request->user()->id,
            'paid_by' => null,
            'amount' => $validated['amount'],
            'due_date' => $validated['due_date'],
            'description' => $validated['description'] ?? null,
            'paid_at' => null,
            'status' => $validated['status'] ?? 'unpaid',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Faktura kreirana.',
            'data' => new InvoiceResource($invoice->load('reservation.property')),
        ], 201);
    }

    // Buyer list my invoices.
    public function buyerIndex(Request $request)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        $items = Invoice::query()
            ->whereHas('reservation', fn($q) => $q->where('buyer_id', $request->user()->id))
            ->with('reservation.property')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => InvoiceResource::collection($items),
        ]);
    }

    // Buyer pay invoice.
    public function pay(Request $request, Invoice $invoice)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        $invoice->load('reservation');

        if ((int)$invoice->reservation->buyer_id !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu.',
                'errors' => ['authorization' => ['Samo svoje fakture.']],
            ], 403);
        }

        if (!in_array($invoice->status, ['unpaid', 'overdue'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Ne može plaćanje.',
                'errors' => ['status' => ['Dozvoljeno samo unpaid/overdue.']],
            ], 422);
        }

        $invoice->update([
            'paid_by' => $request->user()->id,
            'paid_at' => now(),
            'status' => 'paid',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Faktura plaćena.',
            'data' => new InvoiceResource($invoice->load('reservation.property')),
        ]);
    }
}
