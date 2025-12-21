<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Session; // Asegúrate de tener estos modelos o usa DB::table
use Exception;

class AiQueryController extends Controller
{
    public function execute(Request $request)
    {
        // Validar
        $validated = $request->validate([
            'intent' => 'required|string',
            'sql' => 'required|string',
            'eloquent' => 'nullable|string',
            'nip' => 'nullable|string', // Nuevo campo NIP
        ]);

        $intent = $validated['intent'];
        $sql = $validated['sql'];
        $providedNip = $validated['nip'] ?? null;
        
        $user = auth()->user();

        // --- VALIDACIÓN DE NIP (Solo verificación) ---
        if ($intent === 'validate_nip') {
            if (!$user || !$user->is_admin) {
                return response()->json(['success' => false, 'error' => 'ACCESO DENEGADO'], 403);
            }
            if ($user->security_nip !== $providedNip) {
                return response()->json(['success' => false, 'error' => 'NIP INCORRECTO'], 403);
            }
            return response()->json(['success' => true, 'message' => 'NIP Correcto']);
        }

        try {
            $result = null;
            $type = 'read';

            // Limpiar el SQL
            $sql = trim($sql);
            
            // Replace user placeholder
            if ($user) {
                // Ensure ID is injected correctly (handle cases where it might already be replaced if Gemini was smart, but Gemini usually sends the placeholder)
                // Use strict replace for the specific placeholder
                $sql = str_replace('[ID_USUARIO_ACTUAL]', $user->id, $sql);
                // Also handle common variations if Gemini gets creative
                $sql = str_replace('[USER_ID]', $user->id, $sql);
                $sql = str_replace('@current_user_id', $user->id, $sql);
                // Handle :user_id used in frontend manually constructed queries
                $sql = str_replace(':user_id', $user->id, $sql);
            } else {
                 // Should not happen due to 'auth' middleware, but safe fallback
                 $sql = str_replace('[ID_USUARIO_ACTUAL]', '0', $sql);
            }

            $upperSql = strtoupper($sql);
            $lowerSql = strtolower($sql); // Added for table name checks

            // Determinar tipo de consulta
            if (str_starts_with($upperSql, 'SELECT') || str_starts_with($upperSql, 'SHOW') || str_starts_with($upperSql, 'DESCRIBE')) {
                // LECTURA: Permitida para todos (o podrías restringir también)
                $result = DB::select($sql);
                $type = 'read';
                
                // Don't transform column names. Raw SQL names are safer for frontend mapping.
                // If friendly names are needed, use SQL aliases in the query itself (e.g. SELECT name as Nombre...)
                // if (!empty($result) && $intent === 'report') {
                //    $result = $this->transformColumnNames($result, $request);
                // }
            } 
            else {
                // ESCRITURA: Requiere Seguridad
                $type = 'write';

                // --- SEGURIDAD: Validar NIP para operaciones críticas ---
                // Tablas que NO requieren NIP (Datos personales del usuario)
                $safeTables = ['notes', 'assistant_preferences', 'contacts', 'biometric_credentials', 'expenses', 'memories', 'appointments'];
                
                // Verificar si la consulta afecta a tablas críticas
                // Si la consulta contiene alguna tabla segura, asumimos que es segura POR AHORA
                // (Una implementación más robusta analizaría la tabla exacta del FROM/UPDATE)
                $isSafeOperation = false;
                foreach ($safeTables as $table) {
                    if (str_contains($lowerSql, $table)) {
                        // Regla especial para 'contacts': Debe estar delimitada por usuario (user_id)
                        // Si es una operación global (ej: DELETE FROM contacts sin user_id), NO es segura.
                        if ($table === 'contacts' && !str_contains($lowerSql, 'user_id')) {
                            continue; 
                        }
                        $isSafeOperation = true;
                        break;
                    }
                }

                // Tablas CRÍTICAS que SIEMPRE requieren NIP (Override de seguridad)
                $criticalTables = ['users', 'migrations', 'password_reset_tokens', 'jobs', 'failed_jobs'];
                foreach ($criticalTables as $table) {
                    if (str_contains($lowerSql, $table)) {
                        $isSafeOperation = false; // Si toca users, YA NO es segura
                        break;
                    }
                }

                // Apply security checks only if it's not a read operation (already handled above)
                // and it's not considered a "safe" operation.
                // The original code already determined it's a 'write' operation in this 'else' block.
                if (!$isSafeOperation) {
                    // 1. Verificar Admin
                    if (!$user || !$user->is_admin) {
                        return response()->json([
                            'success' => false,
                            'error' => 'ACCESO DENEGADO: Se requieren permisos de administrador para esta operación.'
                        ], 403);
                    }

                    // 2. Verificar NIP o Biometría Reciente
                    $biometricTime = session('biometric_verified_at');
                    // Check if biometric auth happened in the last 5 minutes
                    $isBiometricValid = $biometricTime && \Carbon\Carbon::parse($biometricTime)->diffInMinutes(now()) < 5;

                    if ($user->security_nip !== $providedNip && !$isBiometricValid) {
                        return response()->json([
                            'success' => false,
                            'error' => 'NIP INCORRECTO: La operación no fue autorizada y no se detectó validación biométrica reciente.'
                        ], 403);
                    }
                }

                // Ejecutar si pasó las verificaciones (o si era una operación segura sin NIP)
                
                // --- INTERCEPCIÓN DE PASSWORD (HASHING AUTOMÁTICO) ---
                // --- INTERCEPCIÓN DE PASSWORD (HASHING AUTOMÁTICO) ---
                
                // CASO 1: UPDATE users SET password = '...'
                if (str_contains($lowerSql, 'update users') && str_contains($lowerSql, 'password')) {
                    if (preg_match("/password\s*=\s*['\"]([^'\"]+)['\"]/i", $sql, $matches)) {
                        $plainPassword = $matches[1];
                        $hashedPassword = \Illuminate\Support\Facades\Hash::make($plainPassword);
                        $sql = str_replace($plainPassword, $hashedPassword, $sql);
                    }
                }

                // CASO 2: INSERT INTO users (...) VALUES (...)
                if (str_contains($lowerSql, 'insert into users') && str_contains($lowerSql, 'password')) {
                    if (preg_match("/VALUES\s*\((.+)\)/i", $sql, $matches)) {
                        $valuesPart = $matches[1];
                        // Parsear CSV respetando comillas simples
                        $values = str_getcsv($valuesPart, ',', "'");
                        
                        // Buscar índice de columna password
                        if (preg_match("/users\s*\((.+)\)\s*VALUES/i", $sql, $colsMatches)) {
                            $colsPart = $colsMatches[1];
                            $cols = array_map(function($col) {
                                return trim(strtolower($col));
                            }, explode(',', $colsPart));
                            
                            $passIndex = array_search('password', $cols); // Búsqueda exacta
                            
                            // Si no se encuentra exacto, buscar parcial (fallback)
                            if ($passIndex === false) {
                                foreach ($cols as $i => $col) {
                                    if (str_contains($col, 'password')) {
                                        $passIndex = $i;
                                        break;
                                    }
                                }
                            }
                            
                            if ($passIndex !== false && isset($values[$passIndex])) {
                                $plainPassword = $values[$passIndex];
                                
                                // Solo hashear si no es ya un hash de Laravel
                                if (!str_starts_with($plainPassword, '$2y$')) {
                                    $hashedPassword = \Illuminate\Support\Facades\Hash::make($plainPassword);
                                    $values[$passIndex] = $hashedPassword;
                                    
                                    // Reconstruir la parte VALUES de forma segura
                                    $newValuesStr = implode(", ", array_map(function($v) {
                                        // Escapar comillas simples si es necesario (básico)
                                        $v = str_replace("'", "\'", $v);
                                        return "'$v'";
                                    }, $values));
                                    
                                    // Reemplazar solo la parte de los valores en el SQL original
                                    // Usamos str_replace limitado a 1 ocurrencia o substr_replace si tuviéramos offsets
                                    // Dado que VALUES (...) suele ser único en inserts simples generados por IA:
                                    $sql = str_replace($valuesPart, $newValuesStr, $sql);
                                }
                            }
                        }
                    }
                }

                $result = DB::statement($sql);
                
                if ($intent === 'insert') {
                    $result = ['id' => DB::getPdo()->lastInsertId(), 'message' => 'Registro creado exitosamente.'];
                } else {
                    $result = ['message' => 'Acción ejecutada exitosamente en la base de datos.'];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $result,
                'type' => $type,
                'executed_sql' => $sql,
                'message' => "Consulta ($intent) ejecutada correctamente."
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            $errorCode = $e->errorInfo[1] ?? 0;
            if ($errorCode == 1062) {
                return response()->json([
                    'success' => false,
                    'error' => 'El registro ya existe (posiblemente el correo electrónico ya está en uso).',
                    'sql_attempted' => $sql
                ], 400); // 400 Bad Request
            }
            return response()->json([
                'success' => false,
                'error' => 'Error de base de datos: ' . $e->getMessage(),
                'sql_attempted' => $sql
            ], 500);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'sql_attempted' => $sql
            ], 500);
        }
    }

    /**
     * Transform SQL column names to user-friendly names
     */
    private function transformColumnNames($result, $request)
    {
        if (empty($result)) {
            return $result;
        }

        $transformed = [];
        $reportType = $request->input('report_type', 'bar');
        $title = $request->input('title', '');

        foreach ($result as $row) {
            $newRow = [];
            foreach ((array)$row as $key => $value) {
                // Transform common SQL patterns to friendly names
                $friendlyKey = $this->getFriendlyColumnName($key, $reportType, $title);
                $newRow[$friendlyKey] = $value;
            }
            $transformed[] = (object)$newRow;
        }

        return $transformed;
    }

    /**
     * Get friendly column name based on SQL column name
     */
    private function getFriendlyColumnName($sqlName, $reportType, $title)
    {
        // Common SQL aggregations
        $patterns = [
            '/^COUNT\(.*\)$/i' => 'Total',
            '/^SUM\(.*\)$/i' => 'Suma',
            '/^AVG\(.*\)$/i' => 'Promedio',
            '/^MAX\(.*\)$/i' => 'Máximo',
            '/^MIN\(.*\)$/i' => 'Mínimo',
            '/^TOTAL$/i' => 'Total',
            '/^count$/i' => 'Cantidad',
            '/^sum$/i' => 'Suma',
            '/^avg$/i' => 'Promedio',
        ];

        foreach ($patterns as $pattern => $replacement) {
            if (preg_match($pattern, $sqlName)) {
                // For metric type, use a more specific name based on title
                if ($reportType === 'metric') {
                    if (stripos($title, 'nota') !== false) {
                        return 'Notas';
                    }
                    if (stripos($title, 'usuario') !== false) {
                        return 'Usuarios';
                    }
                    if (stripos($title, 'contacto') !== false) {
                        return 'Contactos';
                    }
                }
                return $replacement;
            }
        }

        // Common field names
        $fieldMap = [
            'created_at' => 'Fecha',
            'updated_at' => 'Actualizado',
            'name' => 'Nombre',
            'email' => 'Correo',
            'title' => 'Título',
            'description' => 'Descripción',
            'status' => 'Estado',
            'type' => 'Tipo',
            'date' => 'Fecha',
            'value' => 'Valor',
            'amount' => 'Cantidad',
        ];

        return $fieldMap[strtolower($sqlName)] ?? ucfirst($sqlName);
    }
}
