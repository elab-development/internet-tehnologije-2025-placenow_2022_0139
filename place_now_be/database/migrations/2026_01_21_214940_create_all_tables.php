<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // USERS.
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();

            $table->string('role')->nullable();
            $table->string('phone')->nullable();

            $table->timestamps();
        });

        // PROPERTIES.
        Schema::create('properties', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('seller_id')->nullable();

            $table->string('title')->nullable();
            $table->text('description')->nullable();

            $table->string('address')->nullable();
            $table->string('city')->nullable();

            $table->decimal('price_per_night', 10, 2)->nullable();
            $table->string('status')->nullable();

            $table->string('360_image_url')->nullable();
            $table->string('3d_sketchfab_model_url')->nullable();

            $table->timestamps();
        });

        // RESERVATIONS.
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('property_id')->nullable();
            $table->unsignedBigInteger('buyer_id')->nullable();
            $table->unsignedBigInteger('seller_id')->nullable();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->unsignedInteger('guests')->nullable();
            $table->decimal('total_price', 10, 2)->nullable();

            $table->string('status')->nullable();

            $table->timestamps();
        });

        // INVOICES.
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('reservation_id')->nullable();

            $table->unsignedBigInteger('issued_by')->nullable();
            $table->unsignedBigInteger('paid_by')->nullable();

            $table->decimal('amount', 10, 2)->nullable();
            $table->text('description')->nullable();

            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->string('status')->nullable();

            $table->timestamps();
        });

        // MAINTENANCE REQUESTS.
        Schema::create('maintenance_requests', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('property_id')->nullable();
            $table->unsignedBigInteger('reported_by')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable();

            $table->string('title')->nullable();
            $table->text('description')->nullable();

            $table->string('priority')->nullable();
            $table->string('status')->nullable();

            $table->timestamp('reported_at')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_requests');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('properties');
        Schema::dropIfExists('users');
    }
};
