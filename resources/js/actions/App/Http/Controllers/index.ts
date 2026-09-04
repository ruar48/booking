import HomeController from './HomeController'
import PaymongoWebhookController from './PaymongoWebhookController'
import SupportChatController from './SupportChatController'
import ResourceBookingController from './ResourceBookingController'
import OpenPlay from './OpenPlay'
import Rental from './Rental'
import NotificationController from './NotificationController'
import DashboardController from './DashboardController'
import PaymentController from './PaymentController'
import PlayerController from './PlayerController'
import ResourceController from './ResourceController'
import Pos from './Pos'
import ReportController from './ReportController'
import AnnouncementController from './AnnouncementController'
import Admin from './Admin'
import Settings from './Settings'
import SessionController from './SessionController'
const Controllers = {
    HomeController: Object.assign(HomeController, HomeController),
PaymongoWebhookController: Object.assign(PaymongoWebhookController, PaymongoWebhookController),
SupportChatController: Object.assign(SupportChatController, SupportChatController),
ResourceBookingController: Object.assign(ResourceBookingController, ResourceBookingController),
OpenPlay: Object.assign(OpenPlay, OpenPlay),
Rental: Object.assign(Rental, Rental),
NotificationController: Object.assign(NotificationController, NotificationController),
DashboardController: Object.assign(DashboardController, DashboardController),
PaymentController: Object.assign(PaymentController, PaymentController),
PlayerController: Object.assign(PlayerController, PlayerController),
ResourceController: Object.assign(ResourceController, ResourceController),
Pos: Object.assign(Pos, Pos),
ReportController: Object.assign(ReportController, ReportController),
AnnouncementController: Object.assign(AnnouncementController, AnnouncementController),
Admin: Object.assign(Admin, Admin),
Settings: Object.assign(Settings, Settings),
SessionController: Object.assign(SessionController, SessionController),
}

export default Controllers