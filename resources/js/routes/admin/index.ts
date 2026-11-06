import settings from './settings'
import auditLogs from './audit-logs'
import analytics from './analytics'
import users from './users'
import policies from './policies'
import messenger from './messenger'
import gallery from './gallery'
import galleryCategories from './gallery-categories'
const admin = {
    settings: Object.assign(settings, settings),
auditLogs: Object.assign(auditLogs, auditLogs),
analytics: Object.assign(analytics, analytics),
users: Object.assign(users, users),
policies: Object.assign(policies, policies),
messenger: Object.assign(messenger, messenger),
gallery: Object.assign(gallery, gallery),
galleryCategories: Object.assign(galleryCategories, galleryCategories),
}

export default admin