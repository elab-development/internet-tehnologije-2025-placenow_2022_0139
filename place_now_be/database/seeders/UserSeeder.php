<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'email' => 'admin@placenow.com',
            'name' => 'Admin',
            'role' => 'admin',
            'password' => Hash::make('adminplacenow'),
        ]);

        User::factory()->seller()->count(10)->create();
        User::factory()->buyer()->count(30)->create();
    }
}
