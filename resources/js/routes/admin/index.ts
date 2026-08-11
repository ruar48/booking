import settings from './settings'
import auditLogs from './audit-logs'
const admin = {
    settings: Object.assign(settings, settings),
auditLogs: Object.assign(auditLogs, auditLogs),
}

export default admin