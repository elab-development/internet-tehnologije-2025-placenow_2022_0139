<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'buyer_id' => $this->buyer_id,
            'seller_id' => $this->seller_id,

            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'guests' => $this->guests,
            'total_price' => $this->total_price,
            'status' => $this->status,

            'property' => $this->whenLoaded('property', fn () => new PropertyResource($this->property)),
            'created_at' => $this->created_at,
        ];
    }
}
