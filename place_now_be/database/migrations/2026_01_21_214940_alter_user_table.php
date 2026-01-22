<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * This migration alters the default Laravel `users` table
     * to match your User model (adds: role, phone).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add role + phone after existing columns for readability.
            // Adjust `after()` positions if your DB driver doesn’t support it.
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('buyer')->after('password');
            }

            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('role');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'phone')) {
                $table->dropColumn('phone');
            }

            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};
