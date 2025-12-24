<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { Head } from '@inertiajs/vue3';
import { ref, onMounted, computed, watch } from 'vue';
import { User, Phone, Mail, Building, Search, Plus, X, Save, Edit2, Trash2, Users, MessageCircle, UploadCloud, Loader2, CheckCircle2, AlertTriangle } from 'lucide-vue-next';
import axios from 'axios';
import { useConfirm } from '@/composables/useConfirm';
import Pagination from '@/components/Pagination.vue';

// Types
interface Contact {
    id?: number;
    name: string;
    phone: string;
    email?: string;
    company?: string;
    notes?: string;
}

const contacts = ref<Contact[]>([]);
const searchQuery = ref('');
const isLoading = ref(true);
const showModal = ref(false);
const isSaving = ref(false);

const form = ref<Contact>({
    name: '',
    phone: '',
    email: '',
    company: '',
    notes: ''
});

const { confirm } = useConfirm();

// Pagination
const currentPage = ref(1);
const itemsPerPage = 12;

// Fetch Contacts
const fetchContacts = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('/api/contacts', { params: { name: searchQuery.value } });
        contacts.value = response.data;
    } catch (error) {
        console.error('Error fetching contacts:', error);
    } finally {
        isLoading.value = false;
    }
};

// CRUD Operations
const saveContact = async () => {
    if (!form.value.name || !form.value.phone) return;

    isSaving.value = true;
    try {
        const response = await axios.post('/api/contacts', form.value);
        contacts.value.push(response.data);
        closeModal();
    } catch (error) {
        console.error('Error saving contact:', error);
    } finally {
        isSaving.value = false;
    }
};

const updateContact = async () => {
    if (!form.value.id || !form.value.name || !form.value.phone) return;

    isSaving.value = true;
    try {
        const response = await axios.put(`/api/contacts/${form.value.id}`, form.value);
        const index = contacts.value.findIndex(c => c.id === form.value.id);
        if (index !== -1) {
            contacts.value[index] = response.data;
        }
        closeModal();
    } catch (error) {
        console.error('Error updating contact:', error);
    } finally {
        isSaving.value = false;
    }
};

const deleteContact = async (id: number) => {
    const confirmed = await confirm({
        title: 'Eliminar contacto',
        message: '¿Estás seguro de eliminar este contacto?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
    });

    if (!confirmed) return;

    try {
        await axios.delete(`/api/contacts/${id}`);
        contacts.value = contacts.value.filter(c => c.id !== id);
    } catch (error) {
        console.error('Error deleting contact:', error);
    }
};

const editContact = (contact: Contact) => {
    form.value = { ...contact };
    showModal.value = true;
};

const handleSave = () => {
    if (form.value.id) {
        updateContact();
    } else {
        saveContact();
    }
};

const closeModal = () => {
    showModal.value = false;
    form.value = { name: '', phone: '', email: '', company: '', notes: '' };
};

const openModal = () => {
    form.value = { name: '', phone: '', email: '', company: '', notes: '' };
    showModal.value = true;
};

// Debounce search
let timeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
    clearTimeout(timeout);
    timeout = setTimeout(fetchContacts, 300);
});

onMounted(() => {
    fetchContacts();
});

const filteredContacts = computed(() => contacts.value);

const contactsCountLabel = computed(() => {
    return filteredContacts.value.length === 1 ? 'contacto guardado' : 'contactos guardados';
});

const paginatedContacts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredContacts.value.slice(start, end);
});

const modalTitle = computed(() => form.value.id ? 'Editar Contacto' : 'Nuevo Contacto');

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Contactos', href: '/contacts' },
];

const getWhatsappLink = (phone: string) => {
    // Basic cleanup: remove everything except numbers and +
    // If it doesn't have country code, assuming local might be tricky for WA API, 
    // but usually WA handles local numbers if using the app. 
    // Best practice: strip non-digits. 
    const cleaned = phone.replace(/[^\d+]/g, '');
    return `https://wa.me/${cleaned}`;
};

const importMode = ref<'csv' | 'text'>('csv');
const importText = ref('');
const showImportModal = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const isImporting = ref(false);

const openImportModal = () => {
    showImportModal.value = true;
    importText.value = '';
    importMode.value = 'csv';
};

const closeImportModal = () => {
    showImportModal.value = false;
};

const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const reader = new FileReader();

    const isVcf = file.name.toLowerCase().endsWith('.vcf');

    reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (text) processImportText(text, !isVcf, isVcf);
    };
    reader.readAsText(file);
};

const importState = ref<'idle' | 'processing' | 'partial' | 'success' | 'error'>('idle');
const importStats = ref({ total: 0, added: 0, duplicates: 0, errors: 0 });

const processImportText = async (text: string, isCsv: boolean, isVcf: boolean = false) => {
    isImporting.value = true;
    importState.value = 'processing';
    importStats.value = { total: 0, added: 0, duplicates: 0, errors: 0 };

    try {
        let contactsToProcess: any[] = [];

        // 1. Parse Data
        if (isVcf) {
            const cards = text.split('BEGIN:VCARD');
            for (const card of cards) {
                if (!card.trim()) continue;
                const fnMatch = card.match(/FN:(.*)/i);
                const name = fnMatch ? fnMatch[1].trim() : '';
                const telMatch = card.match(/TEL.*:(.*)/i);
                const phone = telMatch ? telMatch[1].trim() : '';
                if (name && phone) {
                    contactsToProcess.push({ name, phone, email: '', company: '', notes: 'Importado de VCF' });
                }
            }
        } else {
            const lines = text.split('\n');
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                let name = ''; let phone = '';
                if (isCsv) {
                    const cols = line.split(',');
                    const phoneIdx = cols.findIndex(c => c.replace(/[^0-9]/g, '').length >= 7);
                    if (phoneIdx !== -1) {
                        phone = cols[phoneIdx];
                        const nameIdx = cols.findIndex((c, i) => i !== phoneIdx && c.length > 2);
                        name = nameIdx !== -1 ? cols[nameIdx] : 'Contacto Importado';
                    }
                } else {
                    const phoneMatch = line.match(/(\+?[\d\s-]{7,})/);
                    if (phoneMatch) {
                        phone = phoneMatch[0].trim();
                        name = line.replace(phone, '').trim().replace(/^[-:;,|]+|[-:;,|]+$/g, '').trim();
                    }
                }
                if (!name) name = phone ? `Contacto ${phone}` : 'Sin Nombre';
                if (phone.replace(/[^0-9]/g, '').length < 7) continue;
                contactsToProcess.push({ name, phone, email: '', company: '', notes: 'Importado masivamente' });
            }
        }

        importStats.value.total = contactsToProcess.length;

        // 2. Process Sequentially (for better UI feedback)
        for (const contact of contactsToProcess) {
            try {
                await axios.post('/api/contacts', contact);
                importStats.value.added++;
            } catch (err: any) {
                if (err.response && err.response.status === 409) {
                    importStats.value.duplicates++;
                } else {
                    importStats.value.errors++;
                }
            }
            // Small artificial delay for visual effect if list is short
            if (contactsToProcess.length < 20) await new Promise(r => setTimeout(r, 50));
        }

        await fetchContacts();
        importState.value = importStats.value.errors > 0 ? 'partial' : 'success';

    } catch (e) {
        console.error(e);
        importState.value = 'error';
    } finally {
        isImporting.value = false;
        if (fileInput.value) fileInput.value.value = '';
    }
};

const resetImport = () => {
    importState.value = 'idle';
    importText.value = '';
    closeImportModal();
};
</script>

<template>

    <Head title="Mis Contactos" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="min-h-full w-full bg-background text-foreground p-6 md:p-10 relative overflow-hidden">

            <div class="max-w-7xl mx-auto relative z-10 flex flex-col gap-8 h-full">

                <!-- Header & Controls -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-3xl font-light tracking-tight text-foreground flex items-center gap-2">
                            <Users class="w-8 h-8 text-indigo-500" /> Directorio
                        </h1>
                        <p class="text-muted-foreground mt-1">
                            {{ filteredContacts.length }} {{ contactsCountLabel }}
                        </p>
                    </div>

                    <div class="flex items-center gap-3 w-full md:w-auto">
                        <div class="relative flex-1 md:w-64">
                            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input v-model="searchQuery" placeholder="Buscar contacto..."
                                class="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-light" />
                        </div>
                        <input type="file" ref="fileInput" class="hidden" accept=".csv, .vcf"
                            @change="handleFileUpload" />
                        <button @click="openImportModal"
                            class="bg-card hover:bg-muted text-foreground p-2.5 rounded-xl border border-border transition-colors flex items-center gap-2 pr-4">
                            <UploadCloud class="w-5 h-5" />
                            <span class="font-medium text-sm">Importar</span>
                        </button>
                        <button @click="openModal"
                            class="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-2 pr-4">
                            <Plus class="w-5 h-5" />
                            <span class="font-medium text-sm">Nuevo</span>
                        </button>
                    </div>
                </div>

                <!-- Contacts Grid -->
                <div v-if="isLoading" class="flex items-center justify-center py-20">
                    <div class="text-muted-foreground">Cargando directorio...</div>
                </div>

                <div v-else-if="filteredContacts.length === 0"
                    class="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <User class="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
                    <p class="text-lg font-light text-muted-foreground">No hay contactos guardados.</p>
                    <button @click="openModal" class="mt-4 text-indigo-500 hover:underline">Agregar el primero</button>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div v-for="contact in paginatedContacts" :key="contact.id"
                        class="group relative bg-card/80 hover:bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-[320px]">

                        <!-- Avatar & Name -->
                        <div class="flex flex-col items-center mb-4 mt-2">
                            <div
                                class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-2xl font-light text-indigo-500 mb-3 shadow-inner">
                                {{ contact.name.charAt(0).toUpperCase() }}
                            </div>
                            <h3 class="text-xl font-medium text-foreground text-center line-clamp-1 leading-tight group-hover:text-indigo-500 transition-colors cursor-pointer"
                                @click="editContact(contact)">
                                {{ contact.name }}
                            </h3>
                            <p v-if="contact.company"
                                class="text-xs uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-1">
                                <Building class="w-3 h-3" /> {{ contact.company }}
                            </p>
                        </div>

                        <!-- Details -->
                        <div class="flex-1 flex flex-col gap-4 px-2">
                            <div
                                class="flex items-center gap-3 text-sm text-muted-foreground font-light bg-muted/30 p-2 rounded-lg">
                                <Phone class="w-4 h-4 text-indigo-400" />
                                <span>{{ contact.phone }}</span>
                            </div>
                            <div v-if="contact.email"
                                class="flex items-center gap-3 text-sm text-muted-foreground font-light px-2">
                                <Mail class="w-4 h-4 text-indigo-400" />
                                <span class="truncate">{{ contact.email }}</span>
                            </div>
                            <div v-if="contact.notes"
                                class="mt-2 text-xs text-muted-foreground/70 italic line-clamp-2 px-2">
                                "{{ contact.notes }}"
                            </div>
                        </div>

                        <!-- Actions Bar at Bottom -->
                        <div
                            class="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                            <a :href="'tel:' + contact.phone" title="Llamar"
                                class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 text-zinc-500 transition-all shadow-sm">
                                <Phone class="w-4 h-4" />
                            </a>
                            <a :href="getWhatsappLink(contact.phone)" target="_blank" title="WhatsApp"
                                class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 text-zinc-500 transition-all shadow-sm">
                                <MessageCircle class="w-4 h-4" />
                            </a>
                            <button @click.stop="editContact(contact)" title="Editar"
                                class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 text-zinc-500 transition-all shadow-sm">
                                <Edit2 class="w-4 h-4" />
                            </button>
                            <button @click.stop="deleteContact(contact.id!)" title="Eliminar"
                                class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 text-zinc-500 transition-all shadow-sm">
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <Pagination v-if="filteredContacts.length > 0" v-model:currentPage="currentPage"
                    :totalItems="filteredContacts.length" :itemsPerPage="itemsPerPage" />

            </div>
        </div>

        <!-- Create/Edit Modal -->
        <Teleport to="body">
            <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

                    <div
                        class="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div class="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 class="text-xl font-light text-foreground">{{ modalTitle }}</h3>
                            <button @click="closeModal"
                                class="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                                <X class="w-5 h-5" />
                            </button>
                        </div>

                        <div class="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
                            <!-- Name Input (Hero) -->
                            <div class="space-y-1">
                                <label
                                    class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nombre
                                    Completo</label>
                                <input v-model="form.name" placeholder="Ej. Juan Pérez"
                                    class="text-xl font-medium bg-transparent border-b border-border focus:border-indigo-500 focus:ring-0 placeholder:text-muted-foreground/50 w-full px-0 py-2 transition-colors" />
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label
                                        class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Teléfono</label>
                                    <div
                                        class="flex items-center gap-2 border-b border-border focus-within:border-indigo-500 transition-colors py-2">
                                        <Phone class="w-4 h-4 text-muted-foreground" />
                                        <input v-model="form.phone" placeholder="+52..."
                                            class="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm font-light" />
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Empresa</label>
                                    <div
                                        class="flex items-center gap-2 border-b border-border focus-within:border-indigo-500 transition-colors py-2">
                                        <Building class="w-4 h-4 text-muted-foreground" />
                                        <input v-model="form.company" placeholder="Opcional"
                                            class="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm font-light" />
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label
                                    class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email</label>
                                <div
                                    class="flex items-center gap-2 border-b border-border focus-within:border-indigo-500 transition-colors py-2">
                                    <Mail class="w-4 h-4 text-muted-foreground" />
                                    <input v-model="form.email" placeholder="contacto@ejemplo.com"
                                        class="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm font-light" />
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label
                                    class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Notas</label>
                                <textarea v-model="form.notes" placeholder="Detalles adicionales..."
                                    class="w-full bg-muted/20 border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-light min-h-[100px] resize-none"></textarea>
                            </div>
                        </div>

                        <div class="p-6 border-t border-border flex justify-end gap-3 bg-muted/30">
                            <button @click="closeModal"
                                class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                            <button @click="handleSave" :disabled="isSaving || !form.name || !form.phone"
                                class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Save class="w-4 h-4" /> {{ form.id ? 'Actualizar' : 'Guardar' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Import Modal -->
        <Teleport to="body">
            <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                <div v-if="showImportModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="resetImport"></div>

                    <div
                        class="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-[400px]">

                        <!-- Processing State -->
                        <div v-if="importState === 'processing'"
                            class="flex flex-col items-center justify-center flex-1 p-10 text-center">
                            <Loader2 class="w-16 h-16 text-indigo-500 animate-spin mb-6" />
                            <h3 class="text-xl font-medium text-foreground">Procesando contactos...</h3>
                            <p class="text-muted-foreground mt-2">Analizando y guardando tu información.</p>
                            <div class="mt-6 w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div class="bg-indigo-500 h-full transition-all duration-300"
                                    :style="{ width: (importStats.total > 0 ? (importStats.added + importStats.duplicates + importStats.errors) / importStats.total * 100 : 0) + '%' }">
                                </div>
                            </div>
                            <p class="text-xs font-mono mt-2 text-muted-foreground">{{ importStats.added +
                                importStats.duplicates + importStats.errors }} / {{ importStats.total }}</p>
                        </div>

                        <!-- Results State -->
                        <div v-else-if="importState === 'success' || importState === 'partial'"
                            class="flex flex-col items-center justify-center flex-1 p-8 text-center">
                            <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
                                :class="{ 'bg-yellow-100': importState === 'partial' }">
                                <CheckCircle2 v-if="importState === 'success'" class="w-10 h-10 text-green-600" />
                                <AlertTriangle v-else class="w-10 h-10 text-yellow-600" />
                            </div>

                            <h3 class="text-2xl font-light text-foreground mb-2">¡Importación Completada!</h3>
                            <p class="text-muted-foreground text-sm mb-8">Aquí tienes el resumen de la operación:</p>

                            <div class="grid grid-cols-3 gap-4 w-full mb-8">
                                <div class="bg-muted/30 p-4 rounded-xl flex flex-col items-center">
                                    <span class="text-2xl font-bold text-indigo-500">{{ importStats.added }}</span>
                                    <span
                                        class="text-xs uppercase tracking-wide text-muted-foreground mt-1">Nuevos</span>
                                </div>
                                <div class="bg-muted/30 p-4 rounded-xl flex flex-col items-center">
                                    <span class="text-2xl font-bold text-yellow-500">{{ importStats.duplicates }}</span>
                                    <span
                                        class="text-xs uppercase tracking-wide text-muted-foreground mt-1">Duplicados</span>
                                </div>
                                <div class="bg-muted/30 p-4 rounded-xl flex flex-col items-center">
                                    <span class="text-2xl font-bold text-red-500">{{ importStats.errors }}</span>
                                    <span
                                        class="text-xs uppercase tracking-wide text-muted-foreground mt-1">Errores</span>
                                </div>
                            </div>

                            <button @click="resetImport"
                                class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-transform active:scale-95 font-medium">
                                Entendido, Gracias
                            </button>
                        </div>

                        <!-- Input Mode (Default) -->
                        <template v-else>
                            <div class="p-6 border-b border-border bg-muted/30">
                                <h3 class="text-xl font-light text-foreground">Importar Contactos</h3>
                                <p class="text-xs text-muted-foreground mt-1">Elige cómo quieres añadir tus contactos
                                </p>
                            </div>

                            <div class="flex border-b border-border">
                                <button @click="importMode = 'csv'"
                                    class="flex-1 py-3 text-sm font-medium transition-colors"
                                    :class="importMode === 'csv' ? 'bg-background text-indigo-500 border-b-2 border-indigo-500' : 'bg-muted/50 text-muted-foreground hover:bg-muted'">
                                    Archivo CSV / Excel / VCF
                                </button>
                                <button @click="importMode = 'text'"
                                    class="flex-1 py-3 text-sm font-medium transition-colors"
                                    :class="importMode === 'text' ? 'bg-background text-indigo-500 border-b-2 border-indigo-500' : 'bg-muted/50 text-muted-foreground hover:bg-muted'">
                                    Copiar y Pegar
                                </button>
                            </div>

                            <!-- Text Mode -->
                            <div v-if="importMode === 'text'" class="space-y-4 p-6">
                                <textarea v-model="importText" placeholder="Pega aquí tu lista... Ejemplo:
Juan 555-1234
Maria 666-9876" class="w-full h-40 bg-muted/20 border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 font-mono"></textarea>
                                <p class="text-xs text-muted-foreground">
                                    Detectaremos automáticamente nombres y números.
                                </p>
                            </div>

                            <div class="p-6">
                                <!-- CSV Mode -->
                                <div v-if="importMode === 'csv'" class="space-y-4 text-center">
                                    <div class="p-8 border-2 border-dashed border-border rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                                        @click="fileInput?.click()">
                                        <UploadCloud class="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                                        <p class="text-sm font-medium">Click para subir Excel, VCF o CSV</p>
                                        <p class="text-xs text-muted-foreground mt-1">Soporta contactos de Google,
                                            iCloud y Outlook.</p>
                                    </div>
                                    <p class="text-xs text-muted-foreground bg-blue-500/10 p-3 rounded-lg text-left">
                                        <strong>Tip:</strong> Si tienes un archivo .vcf, .csv o .xls, súbelo aquí y lo
                                        procesaremos automáticamente.
                                    </p>
                                </div>
                            </div>

                            <div class="p-4 border-t border-border flex justify-end gap-3 bg-muted/30">
                                <button @click="resetImport"
                                    class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                                <button v-if="importMode === 'text'" @click="processImportText(importText, false)"
                                    :disabled="!importText || isImporting"
                                    class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all disabled:opacity-50">
                                    {{ isImporting ? 'Procesando...' : 'Procesar Texto' }}
                                </button>
                            </div>
                        </template>
                    </div>
                </div>
            </Transition>
        </Teleport>

    </AppLayout>
</template>

<style scoped></style>
