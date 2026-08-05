import SettingController from './SettingController'
import AuditLogController from './AuditLogController'
import ScheduleSettingController from './ScheduleSettingController'
const Admin = {
    SettingController: Object.assign(SettingController, SettingController),
AuditLogController: Object.assign(AuditLogController, AuditLogController),
ScheduleSettingController: Object.assign(ScheduleSettingController, ScheduleSettingController),
}

export default Admin