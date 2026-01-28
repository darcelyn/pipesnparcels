/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import CreateLabel from './pages/CreateLabel';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
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
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateLabel": CreateLabel,
    "Dashboard": Dashboard,
    "Inventory": Inventory,
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
}

export const pagesConfig = {
    mainPage: "CreateLabel",
    Pages: PAGES,
    Layout: __Layout,
};