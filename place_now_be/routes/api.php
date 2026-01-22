<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\MaintenanceRequestController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\AdminMetricsController;

// Auth.
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public properties.
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{property}', [PropertyController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Admin: users + metrics.
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::patch('/admin/users/{user}/role', [AdminUserController::class, 'updateRole']);
    Route::get('/admin/metrics/summary', [AdminMetricsController::class, 'summary']);
    Route::get('/admin/reports', [AdminMetricsController::class, 'report']);

    // Seller: properties CRUD.
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::patch('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);

    // Reservations.
    Route::get('/buyer/reservations', [ReservationController::class, 'buyerIndex']);
    Route::post('/properties/{property}/reservations', [ReservationController::class, 'store']);
    Route::patch('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

    Route::get('/seller/reservations', [ReservationController::class, 'sellerIndex']);
    Route::patch('/seller/reservations/{reservation}/status', [ReservationController::class, 'updateStatus']);

    // Maintenance Requests.
    Route::get('/buyer/maintenance-requests', [MaintenanceRequestController::class, 'buyerIndex']);
    Route::post('/properties/{property}/maintenance-requests', [MaintenanceRequestController::class, 'store']);

    Route::get('/maintenance-requests', [MaintenanceRequestController::class, 'index']);
    Route::patch('/maintenance-requests/{maintenanceRequest}/status', [MaintenanceRequestController::class, 'updateStatus']);

    // Invoices.
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/reservations/{reservation}/invoices', [InvoiceController::class, 'store']);

    Route::get('/buyer/invoices', [InvoiceController::class, 'buyerIndex']);
    Route::post('/buyer/invoices/{invoice}/pay', [InvoiceController::class, 'pay']);
});
