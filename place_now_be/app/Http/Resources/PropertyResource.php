<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'seller_id' => $this->seller_id,

            'title' => $this->title,
            'description' => $this->description,
            'address' => $this->address,
            'city' => $this->city,

            'price_per_night' => $this->price_per_night,
            'status' => $this->status,

            '360_image_url' => $this->{'360_image_url'} ?? null,
            '3d_sketchfab_model_url' => $this->{'3d_sketchfab_model_url'} ?? null,

            'created_at' => $this->created_at,
        ];
    }
}
