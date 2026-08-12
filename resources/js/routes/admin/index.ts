import settings from './settings'
import auditLogs from './audit-logs'
import policies from './policies'
const admin = {
    settings: Object.assign(settings, settings),
auditLogs: Object.assign(auditLogs, auditLogs),
policies: Object.assign(policies, policies),
}

export default admin