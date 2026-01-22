<?php

namespace Database\Seeders;

use App\Models\MaintenanceRequest;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;

class MaintenanceRequestSeeder extends Seeder
{
    public function run(): void
    {
        $buyers = User::query()->where('role', 'buyer')->get();
        $properties = Property::query()->get();

        if ($buyers->isEmpty() || $properties->isEmpty()) {
            return;
        }

        // Npr. 40 requestova ukupno.
        for ($i = 0; $i < 40; $i++) {
            $property = $properties->random();
            $buyer = $buyers->random();
            $assigned = (bool) rand(0, 1);

            MaintenanceRequest::factory()->create([
                'property_id' => $property->id,
                'reported_by' => $buyer->id,
                'assigned_to' => $assigned ? $property->seller_id : null,
            ]);
        }
    }
}
