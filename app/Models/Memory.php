<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Memory extends Model
{
    protected $fillable = ['user_id', 'key', 'value', 'type'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
