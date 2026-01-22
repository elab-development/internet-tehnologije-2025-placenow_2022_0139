<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReservationSeeder extends Seeder
{
    public function run(): void
    {
        $buyers = User::query()->where('role', 'buyer')->get();
        $properties = Property::query()->get();

        if ($buyers->isEmpty() || $properties->isEmpty()) {
            return;
        }

        // Npr. 60 rezervacija ukupno.
        for ($i = 0; $i < 60; $i++) {
            $property = $properties->random();
            $buyer = $buyers->random();

            Reservation::factory()->create([
                'property_id' => $property->id,
                'buyer_id' => $buyer->id,
                'seller_id' => $property->seller_id,
            ]);
        }
    }
}
