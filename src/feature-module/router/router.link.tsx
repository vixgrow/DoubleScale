import { Route } from "react-router";
import { all_routes } from "./all_routes";
import DealsDashboard from "../mainMenu/dealsDashboard";
import Activities from "../crm/activities";
import Campaign from "../crm/campaign";
import ActivityCalls from "../crm/activityCalls";
import ActivityMail from "../crm/activityMail";
import ActivityTask from "../crm/activityTask";
import CampaignComplete from "../crm/campaign/campaignComplete";
import CampaignArchieve from "../crm/campaign/campaignArchieve";
import Appearance from "../settings/websiteSettings/appearence";
import Analytics from "../crm/analytics";
import ConnectedApps from "../settings/generalSettings/connectedApps";
import Countries from "../content/location/countries";
import ContactDetails from "../crm/contacts";
import BankAccounts from "../settings/financialSettings/bankAccounts";
import BlankPage from "../pages/blankPage";
import Calendar from "../mainMenu/apps/calendar";
import Deals from "../crm/deals";
import DealsDetails from "../crm/deals/dealsDetails";
import Currencies from "../settings/financialSettings/currencies";
import DataTable from "../tables/dataTable";
import BasicTable from "../tables/basicTable";
import Country from "../content/countries";
import DealsKanban from "../crm/deals/dealsKanban";
import DealReports from "../reports/dealReports";
import DeleteRequest from "../userManagement/deleteRequest";
import Membershipplan from "../membership/membershipplan";
import MembershipAddon from "../membership/membershipaddon";

import Notes from "../application/notes";
import Cities from "../content/cities";
import ComingSoon from "../pages/comingSoon";
import Manageusers from "../userManagement/manageusers";
import LockScreen from "../authentication/lockscreen";
import Localization from "../settings/websiteSettings/localization";
import LeadsDetails from "../crm/leads";
import Leads from "../crm/leads/leads";
import Companies from "../crm/companies/companies";
import Login from "../auth/login";
import Register from "../auth/register";
import TwoStepVerification from "../auth/twoStepVerification";
import EmailVerification from "../auth/emailVerification";
import Success from "../auth/success";
import ResetPassword from "../auth/resetPassword";
import ForgotPassword from "../auth/forgotPassword";
import Alert from "../uiInterface/base-ui/alert";
import Accordion from "../uiInterface/base-ui/accordion";
import Avatar from "../uiInterface/base-ui/avatar";
import Borders from "../uiInterface/base-ui/borders";
import Breadcrumb from "../uiInterface/base-ui/breadcrumb";
import Buttons from "../uiInterface/base-ui/buttons";
import ButtonsGroup from "../uiInterface/base-ui/buttonsgroup";
import Cards from "../uiInterface/base-ui/cards";
import Carousel from "../uiInterface/base-ui/carousel";
import Colors from "../uiInterface/base-ui/colors";
import Dropdowns from "../uiInterface/base-ui/dropdowns";
import Grid from "../uiInterface/base-ui/grid";
import Images from "../uiInterface/base-ui/images";
import Lightboxes from "../uiInterface/base-ui/lightbox";
import Media from "../uiInterface/base-ui/media";
import Modals from "../uiInterface/base-ui/modals";
import NavTabs from "../uiInterface/base-ui/navtabs";
import Offcanvas from "../uiInterface/base-ui/offcanvas";
import Pagination from "../uiInterface/base-ui/pagination";
import Popovers from "../uiInterface/base-ui/popover";
import RangeSlides from "../uiInterface/base-ui/rangeslider";
import Progress from "../uiInterface/base-ui/progress";
import Spinner from "../uiInterface/base-ui/spinner";
import Toasts from "../uiInterface/base-ui/toasts";
import Typography from "../uiInterface/base-ui/typography";
import Video from "../uiInterface/base-ui/video";
import Error404 from "../pages/error/error-404";
import Error500 from "../pages/error/error-500";
import CustomFields from "../settings/appSettings/customFields";
import InvoiceSettings from "../settings/appSettings/invoiceSettings";
import Printers from "../settings/appSettings/printers";
import TaxRates from "../settings/financialSettings/taxRates";
import Notifications from "../settings/generalSettings/notifications";
import Profile from "../settings/generalSettings/profile";
import Security from "../settings/generalSettings/security";
import Storage from "../settings/otherSettings/storage";
import EmailSettings from "../settings/systemSettings/emailSettings";
import GdprCookies from "../settings/systemSettings/gdprCookies";
import SmsGateways from "../settings/systemSettings/smsGateways";
import CompanySettings from "../settings/websiteSettings/companySettings";
import Language from "../settings/websiteSettings/language";
import Preference from "../settings/websiteSettings/preference";
import Prefixes from "../settings/websiteSettings/prefixes";
import PaymentGateways from "../settings/financialSettings/paymentGateways";
import UnderMaintenance from "../pages/underMaintenance";
import LeadsDashboard from "../mainMenu/leadsDashboard";
import Todo from "../application/todo";
import Email from "../application/email";
import VideoCall from "../application/call/videoCall";
import Chat from "../application/chat";
import Pages from "../content/pages";
import ProjectDashboard from "../mainMenu/projectDashboard";
import ContactList from "../crm/contacts/contactList";
import CompanyReport from "../reports/companyReport";
import ContactReport from "../reports/contactReport";
import LeadReport from "../reports/leadReport";
import ProjectReport from "../reports/projectReport";
import TaskReport from "../reports/taskReport";
import AudioCall from "../application/call/audioCall";
import CallHistory from "../application/call/callHistory";
import FileManager from "../application/fileManager";

import MembershipTransaction from "../membership/membershiptrasaction";
import LeadsKanban from "../crm/leads/leadskanban";
import Calls from "../crmSetting/calls";
import Industry from "../crmSetting/industry";
import Sources from "../crmSetting/sources";
import ContactStage from "../crmSetting/contactStage";
// import BanIpAddress from "../settings/otherSettings/banIpaddress";
// import LostReason from "../crmSetting/lostreason";
import RolesPermissions from "../userManagement/rolesPermissions";
import ContactMessages from "../support/contactMessages";
import Tickets from "../support/tickets";
import Faq from "../content/faq";
import LostReason from "../crmSetting/lostReason";
import ContactGrid from "../crm/contacts/contactGrid";
import CompaniesGrid from "../crm/companies/companiesGrid";
import Pipeline from "../crm/pipeline";
import Projects from "../crm/projects";
import Task from "../crm/task";
import CompaniesDetails from "../crm/companies/companiesDetails";
import States from "../content/states";
import Testimonials from "../content/testimonials";
import ClipBoard from "../uiInterface/advanced-ui/clipboard";
import Counter from "../uiInterface/advanced-ui/counter";
import DragAndDrop from "../uiInterface/advanced-ui/dragdrop";
import Rating from "../uiInterface/advanced-ui/rating";
import Ribbon from "antd/es/badge/Ribbon";
import Stickynote from "../uiInterface/advanced-ui/stickynote";
import TextEditor from "../uiInterface/advanced-ui/texteditor";
import Timeline from "../uiInterface/advanced-ui/timeline";
import Scrollbar from "../uiInterface/advanced-ui/uiscrollbar";
import Apexchart from "../uiInterface/charts/apexcharts";
import FeatherIcons from "../uiInterface/icons/feathericon";
import FontawesomeIcons from "../uiInterface/icons/fontawesome";
import MaterialIcons from "../uiInterface/icons/materialicon";
import PE7Icons from "../uiInterface/icons/pe7icons";
import SimplelineIcons from "../uiInterface/icons/simplelineicon";
import ThemifyIcons from "../uiInterface/icons/themify";
import TypiconIcons from "../uiInterface/icons/typicons";
import WeatherIcons from "../uiInterface/icons/weathericons";
import BasicInputs from "../uiInterface/forms/formelements/basic-inputs";
import CheckboxRadios from "../uiInterface/forms/formelements/checkbox-radios";
import InputGroup from "../uiInterface/forms/formelements/input-group";
import GridGutters from "../uiInterface/forms/formelements/grid-gutters";
import FormSelect from "../uiInterface/forms/formelements/form-select";
import FormMask from "../uiInterface/forms/formelements/form-mask";
import FileUpload from "../uiInterface/forms/formelements/fileupload";
import FormHorizontal from "../uiInterface/forms/formelements/layouts/form-horizontal";
import FormVertical from "../uiInterface/forms/formelements/layouts/form-vertical";
import FloatingLabel from "../uiInterface/forms/formelements/layouts/floating-label";
import FormValidation from "../uiInterface/forms/formelements/layouts/form-validation";
import FormSelect2 from "../uiInterface/forms/formelements/layouts/form-select2";
import FormWizard from "../uiInterface/forms/formelements/form-wizard";
import DataTables from "../uiInterface/table/data-tables";
import TablesBasic from "../uiInterface/table/tables-basic";
import IonicIcons from "../uiInterface/icons/ionicicons";
import TasksImportant from "../crm/task/tasksImportant";
import TaskCompleted from "../crm/task/taskCompleted";
import ActivityMetting from "../crm/activityMetting";
// import ChartJs from "../uiInterface/charts/chartjs";



const route = all_routes;

export const publicRoutes = [
  {
    path: route.dealsDashboard,
    element: <DealsDashboard />,
    route: Route,
  },
  {
    path: route.audioCall,
    element: <AudioCall />,
    route: Route,
  },
  {
    path: route.callHistory,
    element: <CallHistory />,
    route: Route,
  },
  {
    path: route.leadsKanban,
    element: <LeadsKanban />,
    route: Route,
  },
  {
    path: route.callHistory,
    element: <CallHistory />,
    route: Route,
  },
  {
    path: route.activities,
    element: <Activities />,
    route: Route,
  },
  {
    path: route.campaign,
    element: <Campaign />,
    route: Route,
  },
  {
    path: route.activityMeeting,
    element: <ActivityMetting />,
    route: Route,
  },
  {
    path: route.activityCalls,
    element: <ActivityCalls />,
    route: Route,
  },
  {
    path: route.activityMail,
    element: <ActivityMail />,
    route: Route,
  },
  {
    path: route.activityTask,
    element: <ActivityTask />,
    route: Route,
  },
  {
    path: route.campaignComplete,
    element: <CampaignComplete />,
    route: Route,
  },
  {
    path: route.campaignArchieve,
    element: <CampaignArchieve />,
    route: Route,
  },
  {
    path: route.appearance,
    element: <Appearance />,
    route: Route,
  },
  {
    path: route.analytics,
    element: <Analytics />,
    route: Route,
  },
  {
    path: route.connectedApps,
    element: <ConnectedApps />,
    route: Route,
  },
  {
    path: route.countries,
    element: <Country />,
    route: Route,
  },
  {
    path: route.contactDetails,
    element: <ContactDetails />,
    route: Route,
  },
  {
    path: route.bankAccounts,
    element: <BankAccounts />,
    route: Route,
  },
  {
    path: route.blankPage,
    element: <BlankPage />,
    route: Route,
  },
  {
    path: route.calendar,
    element: <Calendar />,
    route: Route,
  },
  {
    path: route.manageusers,
    element: <Manageusers />,
  },
 
  {
    path: route.membershipplan,
    element: <Membershipplan />,
  },
  {
    path: route.membershipAddon,
    element: <MembershipAddon />,
  },
  {
    path: route.membershipTransaction,
    element: <MembershipTransaction />,
  },
  {
    path: route.notes,
    element: <Notes />,
  },
  {
    path: route.contactStage,
    element: <ContactStage />,
    route: Route,
  },
  {
    path: route.countries,
    element: <Countries />,
    route: Route,
  },
  {
    path: route.currencies,
    element: <Currencies />,
    route: Route,
  },
  {
    path: route.customFields,
    element: <CustomFields />,
    route: Route,
  },
  {
    path: route.dataTables,
    element: <DataTable />,
    route: Route,
  },
  {
    path: route.tablesBasic,
    element: <BasicTable />,
    route: Route,
  },
  {
    path: route.dealReports,
    element: <DealReports />,
    route: Route,
  },

  {
    path: route.deals,
    element: <Deals />,
    route: Route,
  },
  {
    path: route.dealsDetails,
    element: <DealsDetails />,
    route: Route,
  },
  {
    path: route.dealsKanban,
    element: <DealsKanban />,
    route: Route,
  },
  {
    path: route.deleteRequest,
    element: <DeleteRequest />,
    route: Route,
  },
  {
    path: route.cities,
    element: <Cities />,
    route: Route,
  },
  {
    path: route.companies,
    element: <Companies />,
    route: Route,
  },
  { path: route.localization, element: <Localization />, route: Route },
  {
    path: route.leadsDetails,
    element: <LeadsDetails />,
    route: Route,
  },
  {
    path: route.leads,
    element: <Leads />,
    route: Route,
  },
  {
    path: route.companies,
    element: <Companies />,
    route: Route,
  },
  {
    path: route.alert,
    element: <Alert />,
    route: Route,
  },
  {
    path: route.accordion,
    element: <Accordion />,
    route: Route,
  },
  {
    path: route.avatar,
    element: <Avatar />,
    route: Route,
  },
  {
    path: route.border,
    element: <Borders />,
    route: Route,
  },
  {
    path: route.breadcrums,
    element: <Breadcrumb />,
    route: Route,
  },
  {
    path: route.button,
    element: <Buttons />,
    route: Route,
  },
  {
    path: route.buttonGroup,
    element: <ButtonsGroup />,
    route: Route,
  },
  {
    path: route.cards,
    element: <Cards />,
    route: Route,
  },
  {
    path: route.carousel,
    element: <Carousel />,
    route: Route,
  },
  {
    path: route.colors,
    element: <Colors />,
    route: Route,
  },
  {
    path: route.dropdowns,
    element: <Dropdowns />,
    route: Route,
  },
  {
    path: route.grid,
    element: <Grid />,
    route: Route,
  },
  {
    path: route.images,
    element: <Images />,
    route: Route,
  },
  {
    path: route.lightbox,
    element: <Lightboxes />,
    route: Route,
  },
  {
    path: route.media,
    element: <Media />,
    route: Route,
  },
  {
    path: route.modals,
    element: <Modals />,
    route: Route,
  },
  {
    path: route.navTabs,
    element: <NavTabs />,
    route: Route,
  },
  {
    path: route.offcanvas,
    element: <Offcanvas />,
    route: Route,
  },
  {
    path: route.pagination,
    element: <Pagination />,
    route: Route,
  },
  {
    path: route.popover,
    element: <Popovers />,
    route: Route,
  },
  {
    path: route.rangeSlider,
    element: <RangeSlides />,
    route: Route,
  },
  {
    path: route.progress,
    element: <Progress />,
    route: Route,
  },
  {
    path: route.spinner,
    element: <Spinner />,
    route: Route,
  },

  {
    path: route.typography,
    element: <Typography />,
    route: Route,
  },
  {
    path: route.video,
    element: <Video />,
    route: Route,
  },
  {
    path: route.toasts,
    element: <Toasts />,
    route: Route,
  },
  {
    path: route.customFields,
    element: <CustomFields />,
    route: Route,
  },
  {
    path: route.invoiceSettings,
    element: <InvoiceSettings />,
    route: Route,
  },
  {
    path: route.printers,
    element: <Printers />,
    route: Route,
  },
  {
    path: route.bankAccounts,
    element: <BankAccounts />,
    route: Route,
  },
  {
    path: route.currencies,
    element: <Currencies />,
    route: Route,
  },
  {
    path: route.paymentGateways,
    element: <PaymentGateways />,
    route: Route,
  },
  {
    path: route.taxRates,
    element: <TaxRates />,
    route: Route,
  },
  {
    path: route.connectedApps,
    element: <ConnectedApps />,
    route: Route,
  },
  {
    path: route.notification,
    element: <Notifications />,
    route: Route,
  },
  {
    path: route.profile,
    element: <Profile />,
    route: Route,
  },
  {
    path: route.security,
    element: <Security />,
    route: Route,
  },
  // {
  //   path: route.banIpAddrress,
  //   element: <BanIpAddress />,
  //   route: Route,
  // },
  {
    path: route.storage,
    element: <Storage />,
    route: Route,
  },
  {
    path: route.emailSettings,
    element: <EmailSettings />,
    route: Route,
  },
  {
    path: route.gdprCookies,
    element: <GdprCookies />,
    route: Route,
  },
  {
    path: route.smsGateways,
    element: <SmsGateways />,
    route: Route,
  },
  {
    path: route.appearance,
    element: <Appearance />,
    route: Route,
  },
  {
    path: route.companySettings,
    element: <CompanySettings />,
    route: Route,
  },
  {
    path: route.language,
    element: <Language />,
    route: Route,
  },
  // {
  //   path: route.localization,
  //   element: <Localization />,
  //   route: Route,
  // },
  {
    path: route.preference,
    element: <Preference />,
    route: Route,
  },
  {
    path: route.prefixes,
    element: <Prefixes />,
    route: Route,
  },
  {
    path: route.leadsDashboard,
    element: <LeadsDashboard />,
    route: Route,
  },
  {
    path: route.projectDashboard,
    element: <ProjectDashboard />,
    route: Route,
  },
  {
    path: route.todo,
    element: <Todo />,
    route: Route,
  },
  {
    path: route.email,
    element: <Email />,
    route: Route,
  },
  {
    path: route.videoCall,
    element: <VideoCall />,
    route: Route,
  },
  {
    path: route.chat,
    element: <Chat />,
    route: Route,
  },
  {
    path: route.pages,
    element: <Pages />,
    route: Route,

  },
  {
    path: route.contactList,
    element: <ContactList />,
    route: Route,
  },
  {
    path: route.companyReports,
    element: <CompanyReport />,
    route: Route,
  },
  {
    path: route.contactReports,
    element: <ContactReport />,
    route: Route,
  },
  {
    path: route.dealReports,
    element: <DealReports />,
    route: Route,
  },
  {
    path: route.leadReports,
    element: <LeadReport />,
    route: Route,
  },
  {
    path: route.projectReports,
    element: <ProjectReport />,
    route: Route,
  },
  {
    path: route.taskReports,
    element: <TaskReport />,
    route: Route,
  },
  {
    path: route.calls,
    element: <Calls />,
    route: Route,
  },
  {
    path: route.contactStage,
    element: <ContactStage />,
    route: Route,
  },
  {
    path: route.industry,
    element: <Industry />,
    route: Route,
  },
  {
    path: route.sources,
    element: <Sources />,
    route: Route,
  },
  {
    path: route.deleteRequest,
    element: <DeleteRequest />,
    route: Route,
  },
  {
    path: route.rolesPermissions,
    element: <RolesPermissions />,
    route: Route,
  },
  {
    path: route.contactMessages,
    element: <ContactMessages />,
    route: Route,
  },
  {
    path: route.tickets,
    element: <Tickets />,
    route: Route,
  },
  {
    path: route.fileManager,
    element: <FileManager />,
    route: Route,
  },
  {
    path: route.faq,
    element: <Faq />,
    route: Route,
  },
  {
    path: route.lostReason,
    element: <LostReason />,
    route: Route,
  },
  {
    path: route.contactGrid,
    element: <ContactGrid />,
    route: Route,
  },
  {
    path: route.companiesGrid,
    element: <CompaniesGrid />,
    route: Route,
  },
  {
    path: route.pipeline,
    element: <Pipeline />,
    route: Route,
  },
  {
    path: route.projects,
    element: <Projects />,
    route: Route,
  },
  {
    path: route.tasks,
    element: <Task />,
    route: Route,
  },
  {
    path: route.companyDetails,
    element: <CompaniesDetails />,
    route: Route,
  },
  {
    path: route.states,
    element: <States />,
    route: Route,
  },
  {
    path: route.testimonials,
    element: <Testimonials />,
    route: Route,
  },
  {
    path: route.clipboard,
    element: <ClipBoard />,
    route: Route,
  },
  {
    path: route.counter,
    element: <Counter />,
    route: Route,
  },
  {
    path: route.dragandDrop,
    element: <DragAndDrop />,
    route: Route,
  },
  {
    path: route.rating,
    element: <Rating />,
    route: Route,
  },
  {
    path: route.ribbon,
    element: <Ribbon />,
    route: Route,
  },
  {
    path: route.stickyNotes,
    element: <Stickynote />,
    route: Route,
  },
  {
    path: route.textEditor,
    element: <TextEditor />,
    route: Route,
  },
  {
    path: route.timeLine,
    element: <Timeline />,
    route: Route,
  },
  {
    path: route.scrollBar,
    element: <Scrollbar />,
    route: Route,
  },
  {
    path: route.scrollBar,
    element: <Scrollbar />,
    route: Route,
  },
  {
    path: route.apexChat,
    element: <Apexchart />,
    route: Route,
  },
  {
    path: route.featherIcons,
    element: <FeatherIcons />,
    route: Route,
  },
  {
    path: route.falgIcons,
    element: <FeatherIcons />,
    route: Route,
  },
  {
    path: route.fantawesome,
    element: <FontawesomeIcons />,
    route: Route,
  },
  {
    path: route.fantawesome,
    element: <FontawesomeIcons />,
    route: Route,
  },
  {
    path: route.materialIcon,
    element: <MaterialIcons />,
    route: Route,
  },
  {
    path: route.pe7icon,
    element: <PE7Icons />,
    route: Route,
  },
  {
    path: route.simpleLineIcon,
    element: <SimplelineIcons />,
    route: Route,
  },
  {
    path: route.themifyIcon,
    element: <ThemifyIcons />,
    route: Route,
  },
  {
    path: route.typicon,
    element: <TypiconIcons />,
    route: Route,
  },
  {
    path: route.basicInput,
    element: <BasicInputs />,
    route: Route,
  },
  {
    path: route.weatherIcon,
    element: <WeatherIcons />,
    route: Route,
  },
  {
    path: route.checkboxandRadion,
    element: <CheckboxRadios />,
    route: Route,
  },
  {
    path: route.inputGroup,
    element: <InputGroup />,
    route: Route,
  },
  {
    path: route.gridandGutters,
    element: <GridGutters />,
    route: Route,
  },
  {
    path: route.formSelect,
    element: <FormSelect />,
    route: Route,
  },
  {
    path: route.formMask,
    element: <FormMask />,
    route: Route,
  },
  {
    path: route.fileUpload,
    element: <FileUpload />,
    route: Route,
  },
  {
    path: route.horizontalForm,
    element: <FormHorizontal />,
    route: Route,
  },
  {
    path: route.verticalForm,
    element: <FormVertical />,
    route: Route,
  },
  {
    path: route.floatingLable,
    element: <FloatingLabel />,
    route: Route,
  },
  {
    path: route.formValidation,
    element: <FormValidation />,
    route: Route,
  },
  {
    path: route.formSelect2,
    element: <FormSelect2 />,
    route: Route,
  },
  {
    path: route.formWizard,
    element: <FormWizard />,
    route: Route,
  },
  {
    path: route.formWizard,
    element: <DataTables />,
    route: Route,
  },
  {
    path: route.dataTable,
    element: <DataTables />,
    route: Route,
  },
  {
    path: route.tableBasic,
    element: <TablesBasic />,
    route: Route,
  },
  {
    path: route.iconicIcon,
    element: <IonicIcons />,
    route: Route,
  },
  // {
  //   path: route.chart,
  //   element: <ChartJs />,
  //   route: Route,
  // },
  {
    path: route.tasksImportant,
    element: <TasksImportant />,
    route: Route,
  },
  {
    path: route.tasksCompleted,
    element: <TaskCompleted />,
    route: Route,
  },
];

export const authRoutes = [
  {
    path: route.comingSoon,
    element: <ComingSoon />,
    route: Route,
  },
  {
    path: route.login,
    element: <Login />,
    route: Route,
  },
  {
    path: route.register,
    element: <Register />,
    route: Route,
  },
  {
    path: route.twoStepVerification,
    element: <TwoStepVerification />,
    route: Route,
  },
  {
    path: route.emailVerification,
    element: <EmailVerification />,
    route: Route,
  },
  {
    path: route.success,
    element: <Success />,
    route: Route,
  },
  {
    path: route.register,
    element: <Register />,
    route: Route,
  },
  {
    path: route.resetPassword,
    element: <ResetPassword />,
    route: Route,
  },
  {
    path: route.forgotPassword,
    element: <ForgotPassword />,
    route: Route,
  },
  {
    path: route.error404,
    element: <Error404 />,
    route: Route,
  },
  {
    path: route.error500,
    element: <Error500 />,
    route: Route,
  },
  {
    path: route.underMaintenance,
    element: <UnderMaintenance />,
    route: Route,
  },
  {
    path: route.lockScreen,
    element: <LockScreen />,
  },

];
