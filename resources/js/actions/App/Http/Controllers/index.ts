import SubscriptionController from './SubscriptionController'
import SystemInitController from './SystemInitController'
import DeepgramController from './DeepgramController'
import AssistantPreferenceController from './AssistantPreferenceController'
import BiometricController from './BiometricController'
import SpotifyController from './SpotifyController'
import AppointmentController from './AppointmentController'
import ContactController from './ContactController'
import NoteController from './NoteController'
import GeminiController from './GeminiController'
import OpenAIController from './OpenAIController'
import Api from './Api'
import MemoryController from './MemoryController'
import AiQueryController from './AiQueryController'
import Settings from './Settings'

const Controllers = {
    SubscriptionController: Object.assign(SubscriptionController, SubscriptionController),
    SystemInitController: Object.assign(SystemInitController, SystemInitController),
    DeepgramController: Object.assign(DeepgramController, DeepgramController),
    AssistantPreferenceController: Object.assign(AssistantPreferenceController, AssistantPreferenceController),
    BiometricController: Object.assign(BiometricController, BiometricController),
    SpotifyController: Object.assign(SpotifyController, SpotifyController),
    AppointmentController: Object.assign(AppointmentController, AppointmentController),
    ContactController: Object.assign(ContactController, ContactController),
    NoteController: Object.assign(NoteController, NoteController),
    GeminiController: Object.assign(GeminiController, GeminiController),
    OpenAIController: Object.assign(OpenAIController, OpenAIController),
    Api: Object.assign(Api, Api),
    MemoryController: Object.assign(MemoryController, MemoryController),
    AiQueryController: Object.assign(AiQueryController, AiQueryController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers