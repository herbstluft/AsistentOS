<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Income extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'description',
        'source',
        'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
