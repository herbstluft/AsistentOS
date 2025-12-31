<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { Head, router } from '@inertiajs/vue3';
import { ref, onMounted, computed } from 'vue';
import { Plus, Search, Trash2, Edit2, X, Save, FileText, Calendar } from 'lucide-vue-next';
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

// Pagination
const currentPage = ref(1);
const itemsPerPage = 12;

// Use Assistant to speak actions
const { speak } = useAssistantOrchestrator();
const { confirm } = useConfirm();
const { addNotification } = useNotifications();

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
        <div class="min-h-full w-full bg-transparent text-foreground p-6 md:p-10 relative overflow-hidden">

            <!-- Ambient Background REMOVED -->

            <div class="max-w-7xl mx-auto relative z-10 flex flex-col gap-8 h-full">

                <!-- Header & Controls -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-3xl font-light tracking-tight text-foreground flex items-center gap-2">
                            <FileText class="w-8 h-8 text-indigo-500" /> Mis Notas
                        </h1>
                        <p class="text-muted-foreground mt-1">
                            {{ filteredNotes.length }} {{ notesCountLabel }}
                        </p>
                    </div>

                    <div class="flex items-center gap-3 w-full md:w-auto">
                        <div class="relative flex-1 md:w-64">
                            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input v-model="searchQuery" placeholder="Buscar notas..."
                                class="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-light" />
                        </div>
                        <button @click="openCreateModal"
                            class="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-2 pr-4">
                            <Plus class="w-5 h-5" />
                            <span class="font-medium text-sm">Crear</span>
                        </button>
                    </div>
                </div>

                <!-- Notes Grid -->
                <div v-if="isLoading" class="flex items-center justify-center py-20">
                    <div class="text-muted-foreground">Cargando tus notas...</div>
                </div>

                <div v-else-if="filteredNotes.length === 0"
                    class="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <FileText class="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
                    <p class="text-lg font-light text-muted-foreground">No hay notas que mostrar.</p>
                    <button @click="openCreateModal" class="mt-4 text-indigo-500 hover:underline">Crear la primera
                        nota</button>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div v-for="(note, index) in paginatedNotes" :key="note.id"
                        class="group relative bg-card/50 backdrop-blur-sm hover:bg-card/80 border border-border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-[320px]">
                        <!-- Actions Overlay -->
                        <div
                            class="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                            <button @click.stop="openEditModal(note)"
                                class="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:text-indigo-500 text-zinc-500 transition-colors shadow-sm">
                                <Edit2 class="w-3.5 h-3.5" />
                            </button>
                            <button @click.stop="deleteNote(note.id)"
                                class="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:text-red-500 text-zinc-500 transition-colors shadow-sm">
                                <Trash2 class="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div class="mb-4">
                            <span
                                class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1 mb-2">
                                <Calendar class="w-3 h-3" /> {{ formatDate(note.created_at) }}
                            </span>
                            <h3 class="text-xl font-medium text-foreground line-clamp-2 leading-tight group-hover:text-indigo-500 transition-colors cursor-pointer"
                                @click="openEditModal(note)">
                                {{ note.title }}
                            </h3>
                        </div>

                        <div class="flex-1 overflow-hidden relative cursor-pointer" @click="openEditModal(note)">
                            <p
                                class="text-sm text-muted-foreground font-light leading-relaxed whitespace-pre-line line-clamp-6">
                                {{ note.content }}
                            </p>
                            <div
                                class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent">
                            </div>
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
            <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

                    <div
                        class="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div class="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 class="text-xl font-light text-foreground">{{ isEditing ? 'Editar Nota' : 'Nueva Nota'
                                }}</h3>
                            <button @click="closeModal"
                                class="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                                <X class="w-5 h-5" />
                            </button>
                        </div>

                        <div class="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                            <input v-model="currentNote.title" placeholder="Título de la nota..."
                                class="text-2xl font-medium bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground/50 w-full p-0" />
                            <textarea v-model="currentNote.content" placeholder="Escribe aquí..."
                                class="flex-1 min-h-[300px] resize-none bg-transparent border-none focus:ring-0 text-base leading-relaxed font-light placeholder:text-muted-foreground/50 p-0"></textarea>
                        </div>

                        <div class="p-6 border-t border-border flex justify-end gap-3 bg-muted/30">
                            <button @click="closeModal"
                                class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                            <button @click="saveNote"
                                class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                                <Save class="w-4 h-4" /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

    </AppLayout>
</template>

<style scoped></style>
