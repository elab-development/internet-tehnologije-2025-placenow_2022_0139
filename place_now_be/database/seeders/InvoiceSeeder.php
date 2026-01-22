<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Reservation;
use Illuminate\Database\Seeder;

class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $reservations = Reservation::query()->get();

        if ($reservations->isEmpty()) {
            return;
        }

        foreach ($reservations as $reservation) {
            $count = rand(0, 2); // 0-2 invoice-a po rezervaciji.

            for ($i = 0; $i < $count; $i++) {
                $isPaid = (bool) rand(0, 1);

                Invoice::factory()->create([
                    'reservation_id' => $reservation->id,
                    'issued_by' => $reservation->seller_id,
                    'paid_by' => $isPaid ? $reservation->buyer_id : null,
                    'status' => $isPaid ? 'paid' : 'unpaid',
                    'paid_at' => $isPaid ? now()->subDays(rand(0, 20)) : null,
                ]);
            }
        }
    }
}
