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
        Schema::table('users', function (Blueprint $table) {
            $table->string('security_nip')->nullable()->after('password');
            // Agregamos is_admin por si acaso no lo habías migrado en Laravel, 
            // pero usando hasColumn para no romper si ya lo hiciste manual.
            if (!Schema::hasColumn('users', 'is_admin')) {
                $table->boolean('is_admin')->default(0)->after('email');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
