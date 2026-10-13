import SettingController from './SettingController'
import AuditLogController from './AuditLogController'
import AnalyticsController from './AnalyticsController'
import PolicyController from './PolicyController'
import GalleryPhotoController from './GalleryPhotoController'
import GalleryCategoryController from './GalleryCategoryController'
const Admin = {
    SettingController: Object.assign(SettingController, SettingController),
AuditLogController: Object.assign(AuditLogController, AuditLogController),
AnalyticsController: Object.assign(AnalyticsController, AnalyticsController),
PolicyController: Object.assign(PolicyController, PolicyController),
GalleryPhotoController: Object.assign(GalleryPhotoController, GalleryPhotoController),
GalleryCategoryController: Object.assign(GalleryCategoryController, GalleryCategoryController),
}

export default Admin