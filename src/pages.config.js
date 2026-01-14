import CreateLabel from './pages/CreateLabel';
import Dashboard from './pages/Dashboard';
import ManualOrder from './pages/ManualOrder';
import Orders from './pages/Orders';
import ProposalTemplate from './pages/ProposalTemplate';
import SalesPage from './pages/SalesPage';
import Settings from './pages/Settings';
import Shipments from './pages/Shipments';
import Production from './pages/Production';
import Staging from './pages/Staging';
import ReadyToShip from './pages/ReadyToShip';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateLabel": CreateLabel,
    "Dashboard": Dashboard,
    "ManualOrder": ManualOrder,
    "Orders": Orders,
    "ProposalTemplate": ProposalTemplate,
    "SalesPage": SalesPage,
    "Settings": Settings,
    "Shipments": Shipments,
    "Production": Production,
    "Staging": Staging,
    "ReadyToShip": ReadyToShip,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};