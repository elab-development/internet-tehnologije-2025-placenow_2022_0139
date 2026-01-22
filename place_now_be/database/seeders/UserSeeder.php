<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->seller()->count(10)->create();
        User::factory()->buyer()->count(30)->create();
    }
}
