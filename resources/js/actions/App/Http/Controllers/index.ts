import AssistantPreferenceController from './AssistantPreferenceController'
import BiometricController from './BiometricController'
import SpotifyController from './SpotifyController'
import AppointmentController from './AppointmentController'
import ContactController from './ContactController'
import NoteController from './NoteController'
import GeminiController from './GeminiController'
import SubscriptionController from './SubscriptionController'
import Settings from './Settings'
import AiQueryController from './AiQueryController'

const Controllers = {
    AssistantPreferenceController: Object.assign(AssistantPreferenceController, AssistantPreferenceController),
    BiometricController: Object.assign(BiometricController, BiometricController),
    SpotifyController: Object.assign(SpotifyController, SpotifyController),
    AppointmentController: Object.assign(AppointmentController, AppointmentController),
    ContactController: Object.assign(ContactController, ContactController),
    NoteController: Object.assign(NoteController, NoteController),
    GeminiController: Object.assign(GeminiController, GeminiController),
    SubscriptionController: Object.assign(SubscriptionController, SubscriptionController),
    Settings: Object.assign(Settings, Settings),
    AiQueryController: Object.assign(AiQueryController, AiQueryController),
}

export default Controllers