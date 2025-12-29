import ProfileController from './ProfileController'
import AvatarController from './AvatarController'
import PasswordController from './PasswordController'
import TwoFactorAuthenticationController from './TwoFactorAuthenticationController'
import AssistantController from './AssistantController'

const Settings = {
    ProfileController: Object.assign(ProfileController, ProfileController),
    AvatarController: Object.assign(AvatarController, AvatarController),
    PasswordController: Object.assign(PasswordController, PasswordController),
    TwoFactorAuthenticationController: Object.assign(TwoFactorAuthenticationController, TwoFactorAuthenticationController),
    AssistantController: Object.assign(AssistantController, AssistantController),
}

export default Settings