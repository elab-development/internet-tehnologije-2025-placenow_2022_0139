<?php

namespace Database\Factories;

use App\Models\Reservation;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('-1 month', '+2 months');
        $end = (clone $start)->modify('+' . $this->faker->numberBetween(1, 14) . ' days');

        return [
            'property_id' => Property::factory(),
            'buyer_id' => User::factory()->buyer(),
            'seller_id' => User::factory()->seller(),
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
            'guests' => $this->faker->numberBetween(1, 6),
            'total_price' => $this->faker->randomFloat(2, 50, 5000),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'cancelled', 'completed']),
        ];
    }
}
