<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // USERS: obavezno.
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
            $table->string('email')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
            $table->string('role')->nullable(false)->change();
            // phone ostaje nullable.
        });

        // PROPERTIES: obavezno.
        Schema::table('properties', function (Blueprint $table) {
            $table->unsignedBigInteger('seller_id')->nullable(false)->change();
            $table->string('title')->nullable(false)->change();
            $table->string('address')->nullable(false)->change();
            $table->string('city')->nullable(false)->change();
            $table->decimal('price_per_night', 10, 2)->nullable(false)->change();
            $table->string('status')->nullable(false)->change();
            // description i url-ovi ostaju nullable.
        });

        // RESERVATIONS: obavezno.
        Schema::table('reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('property_id')->nullable(false)->change();
            $table->unsignedBigInteger('buyer_id')->nullable(false)->change();
            $table->unsignedBigInteger('seller_id')->nullable(false)->change();

            $table->date('start_date')->nullable(false)->change();
            $table->date('end_date')->nullable(false)->change();

            $table->unsignedInteger('guests')->nullable(false)->change();
            $table->decimal('total_price', 10, 2)->nullable(false)->change();

            $table->string('status')->nullable(false)->change();
        });

        // INVOICES: obavezno osim paid_by i paid_at.
        Schema::table('invoices', function (Blueprint $table) {
            $table->unsignedBigInteger('reservation_id')->nullable(false)->change();
            $table->unsignedBigInteger('issued_by')->nullable(false)->change();

            // paid_by može biti null dok nije plaćeno.
            $table->unsignedBigInteger('paid_by')->nullable()->change();
            $table->timestamp('paid_at')->nullable()->change();

            $table->decimal('amount', 10, 2)->nullable(false)->change();
            $table->date('due_date')->nullable(false)->change();
            $table->string('status')->nullable(false)->change();
            // description ostaje nullable.
        });

        // MAINTENANCE REQUESTS: obavezno osim assigned_to i resolved_at.
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('property_id')->nullable(false)->change();
            $table->unsignedBigInteger('reported_by')->nullable(false)->change();

            // assigned_to može biti null dok se ne dodeli.
            $table->unsignedBigInteger('assigned_to')->nullable()->change();

            $table->string('title')->nullable(false)->change();
            $table->text('description')->nullable(false)->change();

            $table->string('priority')->nullable(false)->change();
            $table->string('status')->nullable(false)->change();

            $table->timestamp('reported_at')->nullable(false)->change();
            $table->timestamp('resolved_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Vraćamo na nullable, kao u inicijalnoj migraciji.

        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('property_id')->nullable()->change();
            $table->unsignedBigInteger('reported_by')->nullable()->change();
            $table->unsignedBigInteger('assigned_to')->nullable()->change();
            $table->string('title')->nullable()->change();
            $table->text('description')->nullable()->change();
            $table->string('priority')->nullable()->change();
            $table->string('status')->nullable()->change();
            $table->timestamp('reported_at')->nullable()->change();
            $table->timestamp('resolved_at')->nullable()->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->unsignedBigInteger('reservation_id')->nullable()->change();
            $table->unsignedBigInteger('issued_by')->nullable()->change();
            $table->unsignedBigInteger('paid_by')->nullable()->change();
            $table->decimal('amount', 10, 2)->nullable()->change();
            $table->text('description')->nullable()->change();
            $table->date('due_date')->nullable()->change();
            $table->timestamp('paid_at')->nullable()->change();
            $table->string('status')->nullable()->change();
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('property_id')->nullable()->change();
            $table->unsignedBigInteger('buyer_id')->nullable()->change();
            $table->unsignedBigInteger('seller_id')->nullable()->change();
            $table->date('start_date')->nullable()->change();
            $table->date('end_date')->nullable()->change();
            $table->unsignedInteger('guests')->nullable()->change();
            $table->decimal('total_price', 10, 2)->nullable()->change();
            $table->string('status')->nullable()->change();
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->unsignedBigInteger('seller_id')->nullable()->change();
            $table->string('title')->nullable()->change();
            $table->text('description')->nullable()->change();
            $table->string('address')->nullable()->change();
            $table->string('city')->nullable()->change();
            $table->decimal('price_per_night', 10, 2)->nullable()->change();
            $table->string('status')->nullable()->change();
            $table->string('360_image_url')->nullable()->change();
            $table->string('3d_sketchfab_model_url')->nullable()->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable()->change();
            $table->string('email')->nullable()->change();
            $table->string('password')->nullable()->change();
            $table->string('role')->nullable()->change();
            $table->string('phone')->nullable()->change();
        });
    }
};
