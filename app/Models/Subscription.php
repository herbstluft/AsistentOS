<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'stripe_customer_id',
        'stripe_subscription_id',
        'stripe_payment_method_id',
        'status',
        'trial_ends_at',
        'subscription_ends_at',
        'trial_used',
        'amount',
        'currency',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'trial_used' => 'boolean',
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOnTrial(): bool
    {
        return $this->status === 'trial' && 
               $this->trial_ends_at && 
               $this->trial_ends_at->isFuture();
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['trial', 'active']) && 
               ($this->isOnTrial() || ($this->subscription_ends_at && $this->subscription_ends_at->isFuture()));
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || 
               ($this->trial_ends_at && $this->trial_ends_at->isPast() && $this->status === 'trial');
    }

    public function trialTimeRemaining(): ?int
    {
        if (!$this->isOnTrial()) {
            return null;
        }

        return max(0, now()->diffInSeconds($this->trial_ends_at, false));
    }
}
