<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'reported_by' => $this->reported_by,
            'assigned_to' => $this->assigned_to,

            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'status' => $this->status,

            'reported_at' => $this->reported_at,
            'resolved_at' => $this->resolved_at,

            'property' => $this->whenLoaded('property', fn () => new PropertyResource($this->property)),
            'created_at' => $this->created_at,
        ];
    }
}
