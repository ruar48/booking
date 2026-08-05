import settings from './settings'
import auditLogs from './audit-logs'
import schedule from './schedule'
const admin = {
    settings: Object.assign(settings, settings),
auditLogs: Object.assign(auditLogs, auditLogs),
schedule: Object.assign(schedule, schedule),
}

export default admin