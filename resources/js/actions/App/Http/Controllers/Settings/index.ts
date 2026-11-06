import ProfileController from './ProfileController'
import SecurityController from './SecurityController'
import MessengerController from './MessengerController'
const Settings = {
    ProfileController: Object.assign(ProfileController, ProfileController),
SecurityController: Object.assign(SecurityController, SecurityController),
MessengerController: Object.assign(MessengerController, MessengerController),
}

export default Settings