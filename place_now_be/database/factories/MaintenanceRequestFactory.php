<?php

namespace Database\Factories;

use App\Models\MaintenanceRequest;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MaintenanceRequestFactory extends Factory
{
    protected $model = MaintenanceRequest::class;

    public function definition(): array
    {
        $assigned = $this->faker->boolean(70);
        $resolved = $this->faker->boolean(40);

        return [
            'property_id' => Property::factory(),
            'reported_by' => User::factory()->buyer(),
            'assigned_to' => $assigned ? User::factory()->seller() : null,
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'status' => $resolved ? 'resolved' : $this->faker->randomElement(['open', 'in_progress']),
            'reported_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'resolved_at' => $resolved ? $this->faker->dateTimeBetween('-10 days', 'now') : null,
        ];
    }
}
