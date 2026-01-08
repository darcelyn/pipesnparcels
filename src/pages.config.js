import CreateLabel from './pages/CreateLabel';
import Dashboard from './pages/Dashboard';
import ManualOrder from './pages/ManualOrder';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Shipments from './pages/Shipments';
import SalesPage from './pages/SalesPage';
import ProposalTemplate from './pages/ProposalTemplate';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateLabel": CreateLabel,
    "Dashboard": Dashboard,
    "ManualOrder": ManualOrder,
    "Orders": Orders,
    "Settings": Settings,
    "Shipments": Shipments,
    "SalesPage": SalesPage,
    "ProposalTemplate": ProposalTemplate,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};