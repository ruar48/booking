import settings from './settings'
import auditLogs from './audit-logs'
import policies from './policies'
import gallery from './gallery'
import galleryCategories from './gallery-categories'
const admin = {
    settings: Object.assign(settings, settings),
auditLogs: Object.assign(auditLogs, auditLogs),
policies: Object.assign(policies, policies),
gallery: Object.assign(gallery, gallery),
galleryCategories: Object.assign(galleryCategories, galleryCategories),
}

export default admin