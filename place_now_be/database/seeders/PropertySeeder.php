<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;

class PropertySeeder extends Seeder
{
    public function run(): void
    {
        $sellers = User::query()->where('role', 'seller')->get();

        foreach ($sellers as $seller) {
            Property::factory()
                ->count(rand(1, 6))
                ->create(['seller_id' => $seller->id]);
        }
    }
}
