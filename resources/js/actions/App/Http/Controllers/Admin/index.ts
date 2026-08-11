import SettingController from './SettingController'
import AuditLogController from './AuditLogController'
const Admin = {
    SettingController: Object.assign(SettingController, SettingController),
AuditLogController: Object.assign(AuditLogController, AuditLogController),
}

export default Admin