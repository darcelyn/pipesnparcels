import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import CreateLabel from './pages/CreateLabel';
import Shipments from './pages/Shipments';
import ManualOrder from './pages/ManualOrder';
import Settings from './pages/Settings';


export const PAGES = {
    "Dashboard": Dashboard,
    "Orders": Orders,
    "CreateLabel": CreateLabel,
    "Shipments": Shipments,
    "ManualOrder": ManualOrder,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
};