import SettingController from './SettingController'
import AuditLogController from './AuditLogController'
import PolicyController from './PolicyController'
const Admin = {
    SettingController: Object.assign(SettingController, SettingController),
AuditLogController: Object.assign(AuditLogController, AuditLogController),
PolicyController: Object.assign(PolicyController, PolicyController),
}

export default Admin