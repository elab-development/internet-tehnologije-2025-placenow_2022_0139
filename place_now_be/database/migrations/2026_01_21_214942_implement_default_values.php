<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // USERS.
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('buyer')->change();
        });

        // PROPERTIES.
        Schema::table('properties', function (Blueprint $table) {
            $table->string('status')->default('available')->change();
            $table->decimal('price_per_night', 10, 2)->default(0)->change();
        });

        // RESERVATIONS.
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
            $table->unsignedInteger('guests')->default(1)->change();
            $table->decimal('total_price', 10, 2)->default(0)->change();
        });

        // INVOICES.
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('status')->default('unpaid')->change();
            $table->decimal('amount', 10, 2)->default(0)->change();
        });

        // MAINTENANCE REQUESTS.
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->string('status')->default('open')->change();
            $table->string('priority')->default('medium')->change();
            $table->timestamp('reported_at')->default(DB::raw('CURRENT_TIMESTAMP'))->change();
        });
    }

    public function down(): void
    {
        // U down delu samo uklanjamo default-e (postavljamo na NULL). Ovo takođe zahteva ->change().

        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->string('status')->default(null)->change();
            $table->string('priority')->default(null)->change();
            $table->timestamp('reported_at')->default(null)->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('status')->default(null)->change();
            $table->decimal('amount', 10, 2)->default(null)->change();
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->string('status')->default(null)->change();
            $table->unsignedInteger('guests')->default(null)->change();
            $table->decimal('total_price', 10, 2)->default(null)->change();
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->string('status')->default(null)->change();
            $table->decimal('price_per_night', 10, 2)->default(null)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default(null)->change();
        });
    }
};
