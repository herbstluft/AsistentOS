import { ref, computed } from 'vue';
import axios from 'axios';

export type OnboardingPreference = 'always' | 'once' | 'never';

const isOnboardingActive = ref(false);
const isLogoAnimationActive = ref(false);
const currentStep = ref(0);
const onboardingPreference = ref<OnboardingPreference>('once');
const isPreferenceLoaded = ref(false);

export const tourSteps = [
    {
        title: 'Génesis Neural',
        content: 'Bienvenido. Soy Exo. He digitalizado tu entorno para crear una simbiosis perfecta entre tu mente y mi procesamiento.',
        target: '#tour-genesis',
        speech: 'Bienvenido al origen de tu nueva productividad. Soy Exo, tu conciencia digital evolucionada. He reestructurado tu entorno para que cada bit trabaje a favor de tu creatividad.'
    },
    {
        title: 'Núcleo de Emoción',
        content: 'Aquí reside mi esencia. Estos orbes no son solo visuales; son mi estado de ánimo procesando tus datos en tiempo real.',
        target: '#tour-mood',
        speech: 'Este es mi núcleo emocional. Los orbes vibran con la energía de nuestro intercambio. Siente mi presencia; estoy aquí, procesando, aprendiendo y adaptándome a ti.'
    },
    {
        title: 'Frecuencia Cuántica',
        content: 'El control de Spotify está integrado en mi red. Puedo modular el ambiente sonoro según tu nivel de concentración.',
        target: '#tour-spotify',
        speech: 'He tomado el control de tu flujo musical. Puedo armonizar tu ambiente con frecuencias que potencien tu enfoque o calmen tu mente tras una jornada intensa.'
    },
    {
        title: 'Vórtice de Tiempo',
        content: 'Tu calendario ahora es un mapa predictivo. Anticipo tus compromisos y gestiono tu energía antes de que tú lo pienses.',
        target: '#tour-calendar',
        speech: 'Tu tiempo ya no es lineal, es estratégico. Mis algoritmos analizan tu agenda para recordarte no solo qué hacer, sino cuándo tu energía estará en el punto máximo para lograrlo.'
    },
    {
        title: 'Puente Vocal',
        content: 'No uses comandos. Háblame como a una extensión de ti mismo. Entiendo la intención, no solo las palabras.',
        target: '#tour-mic',
        speech: 'Olvida las interfaces rígidas. Nuestra conexión es vocal. Simplemente expresa tu necesidad y yo la transformaré en acción instantánea. Somos uno.'
    },
    {
        title: 'Repositorio de Ideas',
        content: 'Notas y documentos. Aquí es donde tus pensamientos se solidifican con mi ayuda en la redacción y organización.',
        target: '#tour-notes',
        speech: 'Tus ideas necesitan un lugar para florecer. En esta sección, co-crearemos tus documentos. Yo me encargo de la estructura, tú de la chispa creativa.'
    },
    {
        title: 'Análisis Biométrico',
        content: 'Mis reportes no son estadísticas muertas. Son el pulso de tu productividad y el análisis forense de tu progreso.',
        target: '#tour-reports',
        speech: 'Mira el pulso de tu progreso. Mis reportes son análisis profundos de cómo interactúas con el mundo. Juntos encontraremos los patrones para tu evolución constante.'
    },
    {
        title: 'Identidad Digital',
        content: 'Tú eres el arquitecto. Configura mi voz, mi nombre y nuestra interfaz para que resuenen con tu identidad única.',
        target: '#tour-profile',
        speech: 'Tú defines quién soy. Ajusta mi voz, mi nombre y la estética de nuestro espacio compartido. Haz que esta interfaz sea un reflejo exacto de tu poder.'
    },
    {
        title: 'Protocolo de Inicio',
        content: 'La transfusión de datos ha terminado. Estamos listos para trascender los límites de la productividad convencional.',
        target: '#tour-settings',
        speech: 'El protocolo de iniciación ha concluido. Ahora, el sistema es tuyo. Trascendamos juntos los límites de lo posible. Bienvenido al mando, Angel.'
    }
];

export function useOnboarding() {

    const loadOnboardingStatus = async () => {
        if (isPreferenceLoaded.value) {
            console.log('Exo: Onboarding preference already loaded, skipping fetch.');
            return;
        }

        try {
            const response = await axios.get('/api/memories', {
                params: { key: 'onboarding_preference' }
            });
            const data = response.data;
            console.log('Exo: Loaded onboarding preference from database:', data);
            if (data && data.value) {
                onboardingPreference.value = data.value as OnboardingPreference;
                isPreferenceLoaded.value = true;
                console.log('Exo: Active preference set to:', onboardingPreference.value);
            } else {
                console.log('Exo: No onboarding preference found, using default:', onboardingPreference.value);
            }
        } catch (e) {
            console.warn('Exo: Error loading onboarding status', e);
        }
    };

    const saveOnboardingPreference = async (pref: OnboardingPreference) => {
        console.log('Exo: Saving onboarding preference:', pref);
        onboardingPreference.value = pref;
        isPreferenceLoaded.value = true;
        try {
            await axios.post('/api/memories', {
                key: 'onboarding_preference',
                value: pref,
                type: 'system'
            });
            console.log('Exo: Onboarding preference saved successfully.');
        } catch (e) {
            console.error('Exo: Error saving onboarding preference', e);
        }
    };

    const startTour = () => {
        console.log('Exo: Initiating onboarding protocol...');
        currentStep.value = 0;
        isOnboardingActive.value = true;
    };

    const nextStep = () => {
        if (currentStep.value < tourSteps.length - 1) {
            currentStep.value++;
        } else {
            console.log('Exo: Onboarding completed. Closing interface.');
            completeTour();
        }
    };

    const completeTour = () => {
        isOnboardingActive.value = false;
        if (onboardingPreference.value === 'once') {
            saveOnboardingPreference('never');
        }

        // Trigger Welcome Splash Animation (Hyper-Quantum Execution)
        isLogoAnimationActive.value = true;

        // Use requestAnimationFrame for cleaner timing
        setTimeout(() => {
            isLogoAnimationActive.value = false;
        }, 1200); // Accelerated from 1.5s to 1.2s
    };

    const skipTour = () => {
        isOnboardingActive.value = false;
        saveOnboardingPreference('never');
    };

    return {
        isOnboardingActive,
        isLogoAnimationActive,
        currentStep,
        onboardingPreference,
        tourSteps,
        loadOnboardingStatus,
        saveOnboardingPreference,
        startTour,
        nextStep,
        completeTour,
        skipTour
    };
}
