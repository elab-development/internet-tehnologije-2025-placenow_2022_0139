<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_id' => $this->reservation_id,
            'issued_by' => $this->issued_by,
            'paid_by' => $this->paid_by,

            'amount' => $this->amount,
            'description' => $this->description,

            'due_date' => $this->due_date,
            'paid_at' => $this->paid_at,
            'status' => $this->status,

            'reservation' => $this->whenLoaded('reservation', fn () => new ReservationResource($this->reservation)),
            'created_at' => $this->created_at,
        ];
    }
}
