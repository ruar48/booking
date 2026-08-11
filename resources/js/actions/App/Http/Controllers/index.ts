import HomeController from './HomeController'
import PaymongoWebhookController from './PaymongoWebhookController'
import ResourceBookingController from './ResourceBookingController'
import OpenPlayJoinController from './OpenPlayJoinController'
import OpenPlayController from './OpenPlayController'
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
import OpenPlayRegistrationController from './OpenPlayRegistrationController'
import OpenPlayBracketController from './OpenPlayBracketController'
import OpenPlayBracketMatchController from './OpenPlayBracketMatchController'
import OpenPlayTargetScoreController from './OpenPlayTargetScoreController'
import OpenPlayMatchController from './OpenPlayMatchController'
import Admin from './Admin'
import Settings from './Settings'
import SessionController from './SessionController'
const Controllers = {
    HomeController: Object.assign(HomeController, HomeController),
PaymongoWebhookController: Object.assign(PaymongoWebhookController, PaymongoWebhookController),
ResourceBookingController: Object.assign(ResourceBookingController, ResourceBookingController),
OpenPlayJoinController: Object.assign(OpenPlayJoinController, OpenPlayJoinController),
OpenPlayController: Object.assign(OpenPlayController, OpenPlayController),
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
OpenPlayRegistrationController: Object.assign(OpenPlayRegistrationController, OpenPlayRegistrationController),
OpenPlayBracketController: Object.assign(OpenPlayBracketController, OpenPlayBracketController),
OpenPlayBracketMatchController: Object.assign(OpenPlayBracketMatchController, OpenPlayBracketMatchController),
OpenPlayTargetScoreController: Object.assign(OpenPlayTargetScoreController, OpenPlayTargetScoreController),
OpenPlayMatchController: Object.assign(OpenPlayMatchController, OpenPlayMatchController),
Admin: Object.assign(Admin, Admin),
Settings: Object.assign(Settings, Settings),
SessionController: Object.assign(SessionController, SessionController),
}

export default Controllers