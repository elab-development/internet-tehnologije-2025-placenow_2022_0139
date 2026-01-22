<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PropertyFactory extends Factory
{
    protected $model = Property::class;

    public function definition(): array
    {
        return [
            'seller_id' => User::factory()->seller(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->city(),
            'price_per_night' => $this->faker->randomFloat(2, 20, 400),
            'status' => $this->faker->randomElement(['available', 'unavailable', 'paused']),
            '360_image_url' => $this->faker->optional()->url(),
            '3d_sketchfab_model_url' => $this->faker->optional()->url(),
        ];
    }
}
