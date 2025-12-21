/**
 * 🚀 SISTEMA DE COMANDOS AVANZADOS PARA EL ASISTENTE IA
 * 
 * Este archivo contiene todos los comandos disponibles y sus capacidades.
 * Organizado por categorías para fácil mantenimiento.
 */

export interface AssistantCommand {
    category: string;
    examples: string[];
    description: string;
    intent: string;
}

export const ASSISTANT_COMMANDS: AssistantCommand[] = [
    // ==================== RECORDATORIOS ====================
    {
        category: 'Recordatorios',
        intent: 'reminder',
        description: 'Crear recordatorios',
        examples: [
            'Recuérdame comprar leche en 2 horas',
            'Ponme un recordatorio para llamar al doctor mañana a las 3pm',
            'Avísame en 30 minutos',
            'Recordatorio: reunión en 1 hora'
        ]
    },
    {
        category: 'Recordatorios',
        intent: 'reminder_list',
        description: 'Ver recordatorios activos',
        examples: [
            'Qué recordatorios tengo',
            'Muéstrame mis recordatorios',
            'Lista de recordatorios',
            'Cuáles son mis pendientes'
        ]
    },
    {
        category: 'Recordatorios',
        intent: 'reminder_delete',
        description: 'Eliminar recordatorios',
        examples: [
            'Borra el recordatorio de comprar leche',
            'Elimina todos mis recordatorios',
            'Cancela el recordatorio de las 3pm'
        ]
    },

    // ==================== CALENDARIO ====================
    {
        category: 'Calendario',
        intent: 'calendar_schedule',
        description: 'Agendar citas',
        examples: [
            'Agenda una cita con el dentista mañana a las 10am',
            'Programa una reunión para el viernes a las 2pm',
            'Crea un evento: Cumpleaños de Juan el 15 de diciembre',
            'Añade al calendario: Junta de equipo lunes 9am'
        ]
    },
    {
        category: 'Calendario',
        intent: 'calendar_view',
        description: 'Ver calendario',
        examples: [
            'Muéstrame mi calendario',
            'Qué tengo agendado hoy',
            'Eventos de esta semana',
            'Abre el calendario'
        ]
    },
    {
        category: 'Calendario',
        intent: 'calendar_next',
        description: 'Próxima cita',
        examples: [
            'Cuál es mi próxima cita',
            'Qué sigue en mi agenda',
            'Próximo evento',
            'Qué tengo después'
        ]
    },

    // ==================== NOTAS ====================
    {
        category: 'Notas',
        intent: 'note_create',
        description: 'Crear notas',
        examples: [
            'Crea una nota: Ideas para el proyecto',
            'Anota esto: Comprar pan, leche y huevos',
            'Nueva nota sobre la reunión de hoy',
            'Guarda una nota: Contraseña WiFi es 12345'
        ]
    },
    {
        category: 'Notas',
        intent: 'note_search',
        description: 'Buscar notas',
        examples: [
            'Busca mis notas sobre el proyecto',
            'Encuentra la nota de la contraseña WiFi',
            'Muéstrame notas de esta semana',
            'Busca "reunión" en mis notas'
        ]
    },
    {
        category: 'Notas',
        intent: 'note_list',
        description: 'Listar notas',
        examples: [
            'Muéstrame todas mis notas',
            'Lista de notas',
            'Qué notas tengo',
            'Ver mis notas'
        ]
    },

    // ==================== CONTACTOS ====================
    {
        category: 'Contactos',
        intent: 'contact_add',
        description: 'Agregar contactos',
        examples: [
            'Agrega un contacto: Juan Pérez, 5512345678',
            'Guarda el número de María: 5587654321',
            'Nuevo contacto: Dr. García, 5511112222',
            'Añade a Pedro con número 5599998888'
        ]
    },
    {
        category: 'Contactos',
        intent: 'contact_search',
        description: 'Buscar contactos',
        examples: [
            'Busca el número de Juan',
            'Cuál es el teléfono de María',
            'Encuentra el contacto del doctor',
            'Número de Pedro'
        ]
    },
    {
        category: 'Contactos',
        intent: 'contact_list',
        description: 'Listar contactos',
        examples: [
            'Muéstrame mis contactos',
            'Lista todos los contactos',
            'Qué contactos tengo',
            'Ver agenda telefónica'
        ]
    },

    // ==================== SPOTIFY ====================
    {
        category: 'Spotify',
        intent: 'spotify',
        description: 'Control de música',
        examples: [
            'Reproduce música',
            'Pon Bad Bunny',
            'Play "Shape of You"',
            'Reproduce mi playlist de workout',
            'Pausa la música',
            'Siguiente canción',
            'Canción anterior',
            'Sube el volumen',
            'Baja el volumen',
            'Volumen al 50%'
        ]
    },

    // ==================== NAVEGACIÓN ====================
    {
        category: 'Navegación',
        intent: 'navigate',
        description: 'Navegar por el sistema',
        examples: [
            'Ve al dashboard',
            'Abre configuración',
            'Llévame a mi perfil',
            'Muestra el calendario',
            'Ve a usuarios',
            'Cierra sesión'
        ]
    },

    // ==================== REPORTES ====================
    {
        category: 'Reportes',
        intent: 'report',
        description: 'Generar reportes',
        examples: [
            'Genera un reporte de usuarios',
            'Muéstrame estadísticas de ventas',
            'Reporte de actividad de esta semana',
            'Análisis de datos del mes',
            'Gráfica de usuarios nuevos'
        ]
    },

    // ==================== SISTEMA ====================
    {
        category: 'Sistema',
        intent: 'system_info',
        description: 'Información del sistema',
        examples: [
            'Qué hora es',
            'Qué día es hoy',
            'Cuál es la fecha',
            'Cómo estás',
            'Qué puedes hacer',
            'Ayuda'
        ]
    },
    {
        category: 'Sistema',
        intent: 'change_theme',
        description: 'Cambiar tema visual',
        examples: [
            'Cambia el tema a azul',
            'Pon el tema morado',
            'Tema verde',
            'Cambia los colores'
        ]
    },

    // ==================== USUARIOS ====================
    {
        category: 'Usuarios',
        intent: 'user_create',
        description: 'Crear usuarios',
        examples: [
            'Crea un usuario llamado Juan',
            'Registra a María como administradora',
            'Nuevo usuario: Pedro, correo pedro@mail.com'
        ]
    },
    {
        category: 'Usuarios',
        intent: 'user_search',
        description: 'Buscar usuarios',
        examples: [
            'Busca al usuario Juan',
            'Encuentra a María',
            'Muéstrame los administradores',
            'Lista de usuarios activos'
        ]
    },

    // ==================== BIOMETRÍA ====================
    {
        category: 'Biometría',
        intent: 'biometrics_config',
        description: 'Configurar huella digital',
        examples: [
            'Configura mi huella',
            'Registra huella digital',
            'Activa biometría',
            'Configuración de huella'
        ]
    },

    // ==================== CONVERSACIÓN ====================
    {
        category: 'Conversación',
        intent: 'conversational',
        description: 'Charla casual',
        examples: [
            'Hola',
            'Cómo estás',
            'Cuéntame un chiste',
            'Qué opinas de...',
            'Gracias',
            'Adiós'
        ]
    }
];

/**
 * Obtener comandos por categoría
 */
export function getCommandsByCategory(category: string): AssistantCommand[] {
    return ASSISTANT_COMMANDS.filter(cmd => cmd.category === category);
}

/**
 * Obtener todas las categorías
 */
export function getCategories(): string[] {
    return [...new Set(ASSISTANT_COMMANDS.map(cmd => cmd.category))];
}

/**
 * Buscar comandos por palabra clave
 */
export function searchCommands(query: string): AssistantCommand[] {
    const lowerQuery = query.toLowerCase();
    return ASSISTANT_COMMANDS.filter(cmd =>
        cmd.description.toLowerCase().includes(lowerQuery) ||
        cmd.examples.some(ex => ex.toLowerCase().includes(lowerQuery)) ||
        cmd.category.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Obtener comando aleatorio para sugerencia
 */
export function getRandomCommand(): AssistantCommand {
    return ASSISTANT_COMMANDS[Math.floor(Math.random() * ASSISTANT_COMMANDS.length)];
}
