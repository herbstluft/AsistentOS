<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { Head, router } from '@inertiajs/vue3';
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { Plus, Search, Trash2, Edit2, X, Save, FileText, Calendar, CheckSquare, Square } from 'lucide-vue-next';
import { useAssistantOrchestrator } from '@/composables/useAssistantOrchestrator';
import { useConfirm } from '@/composables/useConfirm';
import { useNotifications } from '@/composables/useNotifications';
import axios from 'axios';
import Pagination from '@/components/Pagination.vue';

// Types
interface Note {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

const notes = ref<Note[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentNote = ref<{ id?: number | null, title: string, content: string }>({ title: '', content: '' });

// Selection mode
const isSelectionMode = ref(false);
const selectedNotes = ref<Set<number>>(new Set());

// Pagination
const currentPage = ref(1);
const itemsPerPage = 12;

import { useSocketIO } from '@/composables/useSocketIO';

// Use Assistant to speak actions
const { speak } = useAssistantOrchestrator();
const { confirm } = useConfirm();
const { addNotification } = useNotifications();
const socketIO = useSocketIO();

// Fetch Notes
const fetchNotes = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('/api/notes');
        notes.value = response.data;
    } catch (e) {
        console.error("Error fetching notes", e);
        addNotification('Error', 'No se pudieron cargar las notas', 'error');
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchNotes();
    
    // Conectar a Socket.IO
    socketIO.connect();
    
    // Escuchar actualizaciones de notas via WebSocket
    socketIO.on('notes:updated', (data: any) => {
        console.log('🔔 [SOCKET] Actualización de notas recibida:', data);
        fetchNotes();
    });
    
    // Escuchar evento de refresh manual desde el botón
    const handleTabRefresh = (event: any) => {
        console.log('🔄 [TAB_REFRESH] Evento recibido:', event.detail);
        if (event.detail?.url === '/notes' || event.detail?.url.includes('/notes')) {
            fetchNotes();
        }
    };
    
    window.addEventListener('tab-refresh', handleTabRefresh);
    window.addEventListener('refresh-all', fetchNotes);
    
    // Store for cleanup
    (window as any).__notesTabRefreshHandler = handleTabRefresh;
});

// Cleanup
onBeforeUnmount(() => {
    socketIO.off('notes:updated');
    
    const handler = (window as any).__notesTabRefreshHandler;
    if (handler) {
        window.removeEventListener('tab-refresh', handler);
        window.removeEventListener('refresh-all', fetchNotes);
        delete (window as any).__notesTabRefreshHandler;
    }
});

// Computed
const filteredNotes = computed(() => {
    if (!searchQuery.value) return notes.value;
    const q = searchQuery.value.toLowerCase();
    return notes.value.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
});

const notesCountLabel = computed(() => {
    return filteredNotes.value.length === 1 ? 'nota guardada' : 'notas guardadas';
});

const paginatedNotes = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredNotes.value.slice(start, end);
});

// Actions
const openCreateModal = () => {
    currentNote.value = { title: '', content: '' };
    isEditing.value = false;
    isModalOpen.value = true;
};

const openEditModal = (note: Note) => {
    currentNote.value = { id: note.id, title: note.title, content: note.content };
    isEditing.value = true;
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    currentNote.value = { title: '', content: '' };
};

const saveNote = async () => {
    if (!currentNote.value.title.trim() || !currentNote.value.content.trim()) return;

    try {
        if (isEditing.value) {
            await axios.put(`/api/notes/${currentNote.value.id}`, currentNote.value);
            addNotification('Nota actualizada', 'Los cambios se guardaron correctamente', 'success');
        } else {
            await axios.post('/api/notes', currentNote.value);
            addNotification('Nota creada', 'La nota se creó exitosamente', 'success');
        }

        await fetchNotes();
        closeModal();
        speak(isEditing.value ? "Nota actualizada." : "Nueva nota creada.");
    } catch (e) {
        console.error(e);
        addNotification('Error al guardar', 'No se pudo guardar la nota', 'error');
        speak("Hubo un error al guardar la nota.");
    }
};

const deleteNote = async (id: number) => {
    const confirmed = await confirm({
        title: 'Eliminar nota',
        message: '¿Estás seguro de eliminar esta nota?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
    });

    if (!confirmed) return;

    try {
        await axios.delete(`/api/notes/${id}`);
        notes.value = notes.value.filter(n => n.id !== id);
        addNotification('Nota eliminada', 'La nota se eliminó correctamente', 'success');
        speak("Nota eliminada.");
    } catch (e) {
        console.error(e);
        addNotification('Error al eliminar', 'No se pudo eliminar la nota', 'error');
    }
};

// Selection Mode Functions
const toggleSelectionMode = () => {
    isSelectionMode.value = !isSelectionMode.value;
    if (!isSelectionMode.value) {
        selectedNotes.value.clear();
    }
};

const toggleNoteSelection = (id: number) => {
    if (selectedNotes.value.has(id)) {
        selectedNotes.value.delete(id);
    } else {
        selectedNotes.value.add(id);
    }
};

const selectAll = () => {
    paginatedNotes.value.forEach(note => selectedNotes.value.add(note.id));
};

const deselectAll = () => {
    selectedNotes.value.clear();
};

const deleteSelectedNotes = async () => {
    if (selectedNotes.value.size === 0) return;

    const confirmed = await confirm({
        title: 'Eliminar notas seleccionadas',
        message: `¿Estás seguro de eliminar ${selectedNotes.value.size} nota(s)?`,
        confirmText: 'Eliminar todas',
        cancelText: 'Cancelar',
        type: 'danger'
    });

    if (!confirmed) return;

    try {
        // Delete all selected notes
        await Promise.all(
            Array.from(selectedNotes.value).map(id => axios.delete(`/api/notes/${id}`))
        );
        
        // Remove from local state
        notes.value = notes.value.filter(n => !selectedNotes.value.has(n.id));
        
        addNotification('Notas eliminadas', `${selectedNotes.value.size} nota(s) eliminadas correctamente`, 'success');
        speak(`${selectedNotes.value.size} notas eliminadas.`);
        
        // Clear selection and exit selection mode
        selectedNotes.value.clear();
        isSelectionMode.value = false;
    } catch (e) {
        console.error(e);
        addNotification('Error al eliminar', 'No se pudieron eliminar algunas notas', 'error');
    }
};

// Date Formatter
const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Notas', href: '/notes' },
];
</script>

<template>

    <Head title="Mis Notas" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="h-full w-full bg-background text-foreground p-4 md:p-6 lg:p-8 overflow-auto">

            <div class="max-w-7xl mx-auto space-y-6">

                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-3">
                            <div class="p-2 rounded-xl bg-primary/10">
                                <FileText class="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 class="text-2xl md:text-3xl font-semibold text-foreground">Mis Notas</h1>
                                <p class="text-sm text-muted-foreground mt-0.5">
                                    <span v-if="!isSelectionMode">{{ filteredNotes.length }} {{ notesCountLabel }}</span>
                                    <span v-else class="text-primary font-medium">{{ selectedNotes.size }} seleccionada(s)</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Normal Mode Actions -->
                    <div v-if="!isSelectionMode" class="flex items-center gap-3">
                        <!-- Search -->
                        <div class="relative flex-1 sm:flex-initial sm:w-64">
                            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input v-model="searchQuery" placeholder="Buscar..."
                                class="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                        
                        <!-- Selection Mode Button -->
                        <button v-if="filteredNotes.length > 0" @click="toggleSelectionMode"
                            class="shrink-0 bg-card hover:bg-muted border border-border text-foreground px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-medium text-sm">
                            <CheckSquare class="w-4 h-4" />
                            <span class="hidden sm:inline">Seleccionar</span>
                        </button>
                        
                        <!-- Create Button -->
                        <button @click="openCreateModal"
                            class="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-medium text-sm">
                            <Plus class="w-4 h-4" />
                            <span class="hidden sm:inline">Nueva</span>
                        </button>
                    </div>

                    <!-- Selection Mode Actions -->
                    <div v-else class="flex items-center gap-2 flex-wrap">
                        <button @click="selectAll"
                            class="px-3 py-2 bg-card hover:bg-muted border border-border text-foreground rounded-xl transition-all text-sm font-medium">
                            Seleccionar todo
                        </button>
                        <button @click="deselectAll"
                            class="px-3 py-2 bg-card hover:bg-muted border border-border text-foreground rounded-xl transition-all text-sm font-medium">
                            Deseleccionar
                        </button>
                        <button @click="deleteSelectedNotes" :disabled="selectedNotes.size === 0"
                            class="px-3 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            <Trash2 class="w-4 h-4" />
                            Eliminar ({{ selectedNotes.size }})
                        </button>
                        <button @click="toggleSelectionMode"
                            class="px-3 py-2 bg-card hover:bg-muted border border-border text-foreground rounded-xl transition-all text-sm font-medium">
                            <X class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="isLoading" class="flex items-center justify-center py-20">
                    <div class="text-muted-foreground text-sm">Cargando notas...</div>
                </div>

                <!-- Empty State -->
                <div v-else-if="filteredNotes.length === 0"
                    class="flex flex-col items-center justify-center py-20 text-center">
                    <div class="p-4 rounded-full bg-muted/50 mb-4">
                        <FileText class="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <h3 class="text-lg font-medium text-foreground mb-2">No hay notas</h3>
                    <p class="text-sm text-muted-foreground mb-6">Comienza creando tu primera nota</p>
                    <button @click="openCreateModal"
                        class="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl transition-all flex items-center gap-2">
                        <Plus class="w-4 h-4" />
                        Crear nota
                    </button>
                </div>

                <!-- Notes Grid -->
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div v-for="note in paginatedNotes" :key="note.id"
                        :class="[
                            'group relative bg-card border rounded-2xl p-5 transition-all duration-300 flex flex-col h-[280px]',
                            isSelectionMode ? 'cursor-pointer' : 'cursor-pointer hover:shadow-lg hover:border-primary/20',
                            selectedNotes.has(note.id) ? 'border-primary bg-primary/5' : 'border-border'
                        ]"
                        @click="isSelectionMode ? toggleNoteSelection(note.id) : openEditModal(note)">
                        
                        <!-- Checkbox (Selection Mode) -->
                        <div v-if="isSelectionMode" class="absolute top-3 left-3 z-10">
                            <div class="p-1 rounded-lg bg-background border border-border">
                                <CheckSquare v-if="selectedNotes.has(note.id)" class="w-5 h-5 text-primary" />
                                <Square v-else class="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                        
                        <!-- Actions (visible on hover on desktop, always on mobile) - Hidden in selection mode -->
                        <div v-if="!isSelectionMode"
                            class="absolute top-3 right-3 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button @click.stop="openEditModal(note)"
                                class="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                                title="Editar">
                                <Edit2 class="w-3.5 h-3.5" />
                            </button>
                            <button @click.stop="deleteNote(note.id)"
                                class="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"
                                title="Eliminar">
                                <Trash2 class="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <!-- Date -->
                        <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                            <Calendar class="w-3 h-3" />
                            {{ formatDate(note.created_at) }}
                        </div>

                        <!-- Title -->
                        <h3 class="text-lg font-semibold text-foreground mb-3 line-clamp-2 leading-tight">
                            {{ note.title }}
                        </h3>

                        <!-- Content Preview -->
                        <div class="flex-1 overflow-hidden relative">
                            <p class="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-5">
                                {{ note.content }}
                            </p>
                            <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <Pagination v-if="filteredNotes.length > 0" v-model:currentPage="currentPage"
                    :totalItems="filteredNotes.length" :itemsPerPage="itemsPerPage" />

            </div>
        </div>

        <!-- Create/Edit Modal -->
        <Teleport to="body">
            <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

                    <Transition enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                        leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
                        leave-to-class="opacity-0 scale-95">
                        <div v-if="isModalOpen"
                            class="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                            
                            <!-- Header -->
                            <div class="flex items-center justify-between p-6 border-b border-border">
                                <h3 class="text-xl font-semibold text-foreground">
                                    {{ isEditing ? 'Editar Nota' : 'Nueva Nota' }}
                                </h3>
                                <button @click="closeModal"
                                    class="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                    <X class="w-5 h-5" />
                                </button>
                            </div>

                            <!-- Content -->
                            <div class="p-6 overflow-y-auto flex-1 space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-foreground mb-2">Título</label>
                                    <input v-model="currentNote.title" placeholder="Título de la nota..."
                                        class="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                
                                <div class="flex-1 flex flex-col">
                                    <label class="block text-sm font-medium text-foreground mb-2">Contenido</label>
                                    <textarea v-model="currentNote.content" placeholder="Escribe aquí..."
                                        class="flex-1 min-h-[300px] resize-none bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"></textarea>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="flex items-center justify-end gap-3 p-6 border-t border-border">
                                <button @click="closeModal"
                                    class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Cancelar
                                </button>
                                <button @click="saveNote"
                                    class="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-medium">
                                    <Save class="w-4 h-4" />
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>

    </AppLayout>
</template>
