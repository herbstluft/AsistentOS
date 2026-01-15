# 🧪 Pruebas de Integración - AsistentOS

Este documento detalla las capacidades del asistente verificadas mediante pruebas de integración automatizadas. Cada módulo representa un "Córtex" funcional del sistema.

---

## 📅 Calendar (Calendario)
Gestión inteligente de citas y eventos mediante SQL dinámico.

*   **`canCreateAppointmentViaSql`**
    *   *Prompt:* "Agenda una reunión de negocios para el 5 de enero a las 10:00"
*   **`canListTodaysAppointments`**
    *   *Prompt:* "¿Qué citas tengo para hoy?"
*   **`canUpdateAppointmentStatus`**
    *   *Prompt:* "Cancela mi cita de las 10:00"
*   **`canDeleteAppointment`**
    *   *Prompt:* "Borra la cita de las 10:00"
*   **`canSearchAppointmentsByTitleFuzzy`**
    *   *Prompt:* "Busca mis reuniones con el CEO"

---

## 🎵 Spotify
Integración con la API de Spotify para control multimedia total.

*   **`canGetSpotifyStatus`**
    *   *Prompt:* "¿Está conectado mi Spotify?"
*   **`canTriggerPlayWithQuery`**
    *   *Prompt:* "Reproduce algo de Radiohead"
*   **`canPausePlayback`**
    *   *Prompt:* "Pausa la música"
*   **`canSkipToNextTrack`**
    *   *Prompt:* "Siguiente canción"
*   **`canChangeVolume`**
    *   *Prompt:* "Pon el volumen al 50%"
*   **`canDisconnectSpotify`**
    *   *Prompt:* "Desconecta mi cuenta de Spotify"

---

## 💰 Finance (Finanzas)
Control de gastos personales y análisis financiero.

*   **`canRecordNewExpenseViaSql`**
    *   *Prompt:* "Anota un gasto de 2500 de renta"
*   **`canCalculateTotalMonthlyExpenses`**
    *   *Prompt:* "¿Cuánto he gastado este mes?"
*   **`canListExpensesByCategory`**
    *   *Prompt:* "Muéstrame mis gastos de comida"
*   **`canSearchExpensesByDescription`**
    *   *Prompt:* "Busca mis gastos en el OXXO"
*   **`canDeleteExpense`**
    *   *Prompt:* "Borra mi último gasto registrado de 100 pesos"

---

## 🧠 Memories (Memorias)
Persistencia de datos del usuario, preferencias y hechos aprendidos.

*   **`canStorePreferenceAsMemoryViaSql`**
    *   *Prompt:* "Recuerda que mi apodo favorito es Angelito"
*   **`canRetrieveMemoryByExactKeyViaApi`**
    *   *Prompt:* "¿Cómo me llamo según tus memorias?"
*   **`canFuzzySearchMemoriesViaApi`**
    *   *Prompt:* "¿Qué sabes sobre mi comida favorita?"
*   **`canUpdateExistingMemoryViaSql`**
    *   *Prompt:* "Ya no estoy feliz, ahora me siento emocionado"
*   **`canDeleteMemoryViaSql`**
    *   *Prompt:* "Olvida lo que te dije sobre mi apodo"

---

## 📝 Notes (Notas)
Gestión de investigación, ideas y borradores de texto.

*   **`canCreateNoteViaSql`**
    *   *Prompt:* "Crea una nota sobre mi investigación científica"
*   **`canRetrieveNotesViaApi`**
    *   *Prompt:* "Muéstrame todas mis notas"
*   **`canUpdateNoteViaApi`**
    *   *Prompt:* "Actualiza mi nota 1 con el título 'Investigación Avanzada'"
*   **`canDeleteNoteViaApi`**
    *   *Prompt:* "Borra mi nota sobre ideas millonarias"
*   **`canSearchNotesViaSqlFuzzy`**
    *   *Prompt:* "Busca notas que hablen de 'millonaria'"

---

## 🔐 Security & Core (Seguridad)
Validaciones críticas de sistema y protección de datos.

*   **`Denies Critical Operations to Non-Admin Users`** - Bloqueo de acceso no autorizado.
*   **`Requires NIP for Critical Operations even for Admins`** - Doble factor para acciones peligrosas.
*   **`Automatically Hashes Passwords in Update Queries`** - Seguridad automática en gestión de usuarios.

---

## 📞 Contacts (Contactos)
Gestión de red de contactos y búsqueda inteligente.

*   **`canAddContactViaSql`**
    *   *Prompt:* "Agrega a Steve Wozniak a mis contactos, su teléfono es 555-1234"
*   **`canSearchContactsFuzzy`**
    *   *Prompt:* "¿Cuál es el teléfono de Wozniak?"
*   **`canUpdateContactDetails`**
    *   *Prompt:* "Cambia el teléfono de Bill Gates a 9999"

---

## 🎨 Preferences (Preferencias)
Personalización del núcleo del asistente.

*   **`canChangeAssistantNameViaSql`**
    *   *Prompt:* "A partir de ahora llámate Jarvis"

---

---

## 📈 Incomes (Ingresos)
Seguimiento de entradas de capital y fuentes de ingresos.

*   **`canRecordNewIncomeViaSql`**
    *   *Prompt:* "Anota un ingreso de 5000 por mi sueldo en Upwork"
*   **`canCalculateTotalMonthlyIncomes`**
    *   *Prompt:* "¿Cuánto he ganado este mes?"
*   **`canListIncomesBySource`**
    *   *Prompt:* "Muéstrame mis ingresos de Freelance"

---

## ⚖️ Financial Balance (Balance Neto)
Análisis cruzado de ingresos vs gastos.

*   **`canCalculateNetBalance`**
    *   *Prompt:* "¿Cuál es mi balance neto actual? (Ingresos - Gastos)"

---

## 🗓️ Advanced Calendar Logic (Calendario Pro)
Predicción y resolución de conflictos.

*   **`canFindNextUpcomingAppointment`**
    *   *Prompt:* "¿Cuál es mi siguiente cita?"
*   **`canCheckForConflicts`**
    *   *Prompt:* "¿Tengo algo que se cruce con mi comida a las 2?"

---

## 🌦️ Weather & Features (Clima y Funciones)
Capacidades externas integradas.

*   **`weather_check`** (Frontend)
    *   *Prompt:* "¿Cómo estará el clima en CDMX?"
*   **`finance_check`** (Frontend)
    *   *Prompt:* "¿A cuánto está el dólar hoy?"
*   **`google_search`** (Frontend)
    *   *Prompt:* "Investiga quién ganó el mundial de 1986"

---

## 📊 Analytics (Análisis Completo)
Consultas SQL avanzadas para toma de decisiones.

*   **`canCalculateExpensesForSpecificTimeRange`**
    *   *Prompt:* "¿Cuánto gasté en comida los últimos 3 días?"
*   **`canGroupExpensesByCategory`**
    *   *Prompt:* "Dame un resumen de mis gastos agrupados por categoría"

