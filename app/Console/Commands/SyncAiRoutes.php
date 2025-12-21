<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class SyncAiRoutes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:sync-routes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Exporta las rutas de la aplicación a un archivo TS para el contexto de la IA';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Sincronizando rutas para la IA...');

        $routes = Route::getRoutes();
        $exportableRoutes = [];

        foreach ($routes as $route) {
            $uri = $route->uri();
            $name = $route->getName();
            $methods = $route->methods();

            // Filtrar rutas:
            // 1. Solo GET
            // 2. No API (a menos que sean vistas), no _ignition, no sanctum
            // 3. Deben tener nombre (opcional, pero ayuda al contexto)
            if (in_array('GET', $methods) && 
                !Str::startsWith($uri, 'api') && 
                !Str::startsWith($uri, '_ignition') && 
                !Str::startsWith($uri, 'sanctum') &&
                !Str::contains($uri, '{') // Excluir rutas con parámetros dinámicos complejos por ahora, o manejarlos
            ) {
                // Humanizar el nombre o la URI para que la IA entienda qué es
                $description = $name ? str_replace(['.', '-', '_'], ' ', $name) : $uri;
                $description = ucwords($description);

                $exportableRoutes[] = [
                    'uri' => '/' . ltrim($uri, '/'),
                    'name' => $name,
                    'description' => $description
                ];
            }
        }

        // Formato TypeScript
        $tsContent = "export const APP_ROUTES = " . json_encode($exportableRoutes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . ";";

        $path = resource_path('js/config/app-routes.ts');
        
        // Asegurar directorio
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        file_put_contents($path, $tsContent);

        $this->info('Rutas exportadas exitosamente a: ' . $path);
        $this->table(['URI', 'Name', 'Description'], $exportableRoutes);
    }
}
