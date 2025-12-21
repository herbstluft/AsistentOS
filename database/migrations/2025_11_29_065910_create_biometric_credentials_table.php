<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('biometric_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('credential_id')->unique(); // The ID returned by WebAuthn
            $table->text('public_key'); // The public key for verification
            $table->string('name')->default('Dispositivo'); // User friendly name
            $table->unsignedInteger('sign_count')->default(0); // Counter to prevent replay attacks
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biometric_credentials');
    }
};
