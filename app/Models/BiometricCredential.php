<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class BiometricCredential extends Model
{
    protected $fillable = [
        'user_id',
        'credential_id',
        'public_key',
        'name',
        'sign_count',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
