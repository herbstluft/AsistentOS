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
        Schema::table('assistant_preferences', function (Blueprint $table) {
            if (!Schema::hasColumn('assistant_preferences', 'assistant_name')) {
                $table->string('assistant_name')->default('Assistant');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assistant_preferences', function (Blueprint $table) {
            $table->dropColumn('assistant_name');
        });
    }
};
