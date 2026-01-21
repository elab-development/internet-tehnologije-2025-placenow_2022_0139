<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // PROPERTIES -> USERS (seller).
        Schema::table('properties', function (Blueprint $table) {
            $table->foreign('seller_id')
                ->references('id')->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        // RESERVATIONS -> PROPERTIES, USERS (buyer, seller).
        Schema::table('reservations', function (Blueprint $table) {
            $table->foreign('property_id')
                ->references('id')->on('properties')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('buyer_id')
                ->references('id')->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('seller_id')
                ->references('id')->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        // INVOICES -> RESERVATIONS, USERS (issuer, payer).
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreign('reservation_id')
                ->references('id')->on('reservations')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('issued_by')
                ->references('id')->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('paid_by')
                ->references('id')->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        // MAINTENANCE REQUESTS -> PROPERTIES, USERS (reported_by, assigned_to).
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->foreign('property_id')
                ->references('id')->on('properties')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('reported_by')
                ->references('id')->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('assigned_to')
                ->references('id')->on('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->dropForeign(['reported_by']);
            $table->dropForeign(['assigned_to']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['reservation_id']);
            $table->dropForeign(['issued_by']);
            $table->dropForeign(['paid_by']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->dropForeign(['buyer_id']);
            $table->dropForeign(['seller_id']);
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->dropForeign(['seller_id']);
        });
    }
};
