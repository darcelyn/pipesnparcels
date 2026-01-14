import CreateLabel from './pages/CreateLabel';
import Dashboard from './pages/Dashboard';
import ManualOrder from './pages/ManualOrder';
import Orders from './pages/Orders';
import Production from './pages/Production';
import ProposalTemplate from './pages/ProposalTemplate';
import ReadyToShip from './pages/ReadyToShip';
import SalesPage from './pages/SalesPage';
import Settings from './pages/Settings';
import Shipments from './pages/Shipments';
import Staging from './pages/Staging';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateLabel": CreateLabel,
    "Dashboard": Dashboard,
    "ManualOrder": ManualOrder,
    "Orders": Orders,
    "Production": Production,
    "ProposalTemplate": ProposalTemplate,
    "ReadyToShip": ReadyToShip,
    "SalesPage": SalesPage,
    "Settings": Settings,
    "Shipments": Shipments,
    "Staging": Staging,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};