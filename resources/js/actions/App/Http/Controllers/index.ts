import HomeController from './HomeController'
import ResourceBookingController from './ResourceBookingController'
import RentalMemberController from './RentalMemberController'
import DashboardController from './DashboardController'
import PaymentController from './PaymentController'
import PlayerController from './PlayerController'
import ResourceController from './ResourceController'
import ProductController from './ProductController'
import PosController from './PosController'
import SaleController from './SaleController'
import ReportController from './ReportController'
import RentalItemController from './RentalItemController'
import RentalController from './RentalController'
import RentalTransactionController from './RentalTransactionController'
import AnnouncementController from './AnnouncementController'
import Admin from './Admin'
import Settings from './Settings'
import SessionController from './SessionController'
const Controllers = {
    HomeController: Object.assign(HomeController, HomeController),
ResourceBookingController: Object.assign(ResourceBookingController, ResourceBookingController),
RentalMemberController: Object.assign(RentalMemberController, RentalMemberController),
DashboardController: Object.assign(DashboardController, DashboardController),
PaymentController: Object.assign(PaymentController, PaymentController),
PlayerController: Object.assign(PlayerController, PlayerController),
ResourceController: Object.assign(ResourceController, ResourceController),
ProductController: Object.assign(ProductController, ProductController),
PosController: Object.assign(PosController, PosController),
SaleController: Object.assign(SaleController, SaleController),
ReportController: Object.assign(ReportController, ReportController),
RentalItemController: Object.assign(RentalItemController, RentalItemController),
RentalController: Object.assign(RentalController, RentalController),
RentalTransactionController: Object.assign(RentalTransactionController, RentalTransactionController),
AnnouncementController: Object.assign(AnnouncementController, AnnouncementController),
Admin: Object.assign(Admin, Admin),
Settings: Object.assign(Settings, Settings),
SessionController: Object.assign(SessionController, SessionController),
}

export default Controllers