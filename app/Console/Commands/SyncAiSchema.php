<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SyncAiSchema extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:sync-schema';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza el esquema de la base de datos con el archivo de configuración de la IA';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Sincronizando esquema de base de datos con la IA...');

        // Obtener tablas de forma nativa (compatible con MySQL/MariaDB)
        $tables = DB::select('SHOW TABLES');
        $schemaText = "CONTEXTO DE BASE DE DATOS (MySQL / Laravel):\n";

        foreach ($tables as $tableObj) {
            // El nombre de la propiedad depende de la BD, suele ser "Tables_in_database_name"
            // Lo obtenemos dinámicamente tomando el primer valor del objeto
            $tableArray = (array) $tableObj;
            $tableName = reset($tableArray);

            // Ignorar tablas internas
            if (in_array($tableName, ['migrations', 'password_reset_tokens', 'failed_jobs', 'personal_access_tokens'])) {
                continue;
            }

            $columns = Schema::getColumnListing($tableName);
            $columnsStr = implode(', ', $columns);
            
            $schemaText .= "- $tableName ($columnsStr)\n";
            $this->line("  ✅ Tabla procesada: $tableName");
        }

        // Formato final para el archivo TS
        $fileContent = "export const DB_SCHEMA = `\n" . $schemaText . "`;\n";

        // Guardar archivo
        $path = resource_path('js/config/db-schema.ts');
        file_put_contents($path, $fileContent);

        $this->info("✨ Esquema guardado exitosamente en: $path");
        $this->info("🤖 Ahora la IA conoce tu estructura de base de datos actualizada.");
    }
}
