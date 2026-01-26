import CreateLabel from './pages/CreateLabel';
import Dashboard from './pages/Dashboard';
import ManualOrder from './pages/ManualOrder';
import OnHold from './pages/OnHold';
import Orders from './pages/Orders';
import PackingStation from './pages/PackingStation';
import Production from './pages/Production';
import ProductionPlanning from './pages/ProductionPlanning';
import Products from './pages/Products';
import ProposalTemplate from './pages/ProposalTemplate';
import ReadyToShip from './pages/ReadyToShip';
import Reports from './pages/Reports';
import SalesPage from './pages/SalesPage';
import Settings from './pages/Settings';
import Shipments from './pages/Shipments';
import Staging from './pages/Staging';
import Inventory from './pages/Inventory';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateLabel": CreateLabel,
    "Dashboard": Dashboard,
    "ManualOrder": ManualOrder,
    "OnHold": OnHold,
    "Orders": Orders,
    "PackingStation": PackingStation,
    "Production": Production,
    "ProductionPlanning": ProductionPlanning,
    "Products": Products,
    "ProposalTemplate": ProposalTemplate,
    "ReadyToShip": ReadyToShip,
    "Reports": Reports,
    "SalesPage": SalesPage,
    "Settings": Settings,
    "Shipments": Shipments,
    "Staging": Staging,
    "Inventory": Inventory,
}

export const pagesConfig = {
    mainPage: "CreateLabel",
    Pages: PAGES,
    Layout: __Layout,
};