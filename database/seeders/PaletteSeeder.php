<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PaletteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $palettes = [
            ['id' => 1, 'name' => 'Purple Night'],
            ['id' => 2, 'name' => 'Sunset'],
            ['id' => 3, 'name' => 'Dark Purple'],
        ];

        foreach ($palettes as $palette) {
            \App\Models\Palette::updateOrCreate(['id' => $palette['id']], $palette);
        }
    }
}
