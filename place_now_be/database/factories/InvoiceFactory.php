<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $isPaid = $this->faker->boolean(55);

        return [
            'reservation_id' => Reservation::factory(),
            'issued_by' => User::factory()->seller(),
            'paid_by' => $isPaid ? User::factory()->buyer() : null,
            'amount' => $this->faker->randomFloat(2, 10, 5000),
            'description' => $this->faker->optional()->sentence(),
            'due_date' => $this->faker->dateTimeBetween('-10 days', '+30 days')->format('Y-m-d'),
            'paid_at' => $isPaid ? $this->faker->dateTimeBetween('-10 days', 'now') : null,
            'status' => $isPaid ? 'paid' : $this->faker->randomElement(['unpaid', 'overdue']),
        ];
    }
}
