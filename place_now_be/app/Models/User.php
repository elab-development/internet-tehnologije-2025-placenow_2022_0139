<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Seller relacije.

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'seller_id');
    }

    public function issuedInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'issued_by');
    }

    public function assignedMaintenanceRequests(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class, 'assigned_to');
    }

    public function sellerReservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'seller_id');
    }

    // Buyer relacije.

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'buyer_id');
    }

    public function paidInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'paid_by');
    }

    public function reportedMaintenanceRequests(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class, 'reported_by');
    }
}
