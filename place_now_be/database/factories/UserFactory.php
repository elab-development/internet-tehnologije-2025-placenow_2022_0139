<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => $this->faker->randomElement(['buyer', 'seller']),
            'phone' => $this->faker->optional()->phoneNumber(),
        ];
    }

    public function seller(): static
    {
        return $this->state(fn () => ['role' => 'seller']);
    }

    public function buyer(): static
    {
        return $this->state(fn () => ['role' => 'buyer']);
    }
}
