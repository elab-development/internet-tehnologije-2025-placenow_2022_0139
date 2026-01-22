<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminMetricsController extends Controller
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

    public function summary(Request $request)
    {
        if ($resp = $this->ensureAdmin($request)) return $resp;

        $revenueByMonth = Invoice::query()
            ->where('status', 'paid')
            ->selectRaw("DATE_FORMAT(paid_at, '%Y-%m') as month, SUM(amount) as revenue")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_reservations' => Reservation::count(),
                'active_properties' => Property::where('status', 'available')->count(),
                'open_maintenance_requests' => DB::table('maintenance_requests')->whereIn('status', ['open', 'in_progress'])->count(),
                'revenue_by_month' => $revenueByMonth,
            ],
        ]);
    }

    public function report(Request $request)
    {
        if ($resp = $this->ensureAdmin($request)) return $resp;

        $validated = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date'],
        ]);

        $reservations = Reservation::query()
            ->whereDate('start_date', '>=', $validated['date_from'])
            ->whereDate('end_date', '<=', $validated['date_to'])
            ->with(['property', 'invoices'])
            ->orderByDesc('id')
            ->get();

        $revenue = Invoice::query()
            ->where('status', 'paid')
            ->whereDate('paid_at', '>=', $validated['date_from'])
            ->whereDate('paid_at', '<=', $validated['date_to'])
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'period' => $validated,
                'paid_revenue' => $revenue,
                'reservations' => $reservations,
            ],
        ]);
    }
}
