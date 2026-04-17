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
import Accounting from './pages/Accounting';
import Tasks from './pages/Tasks';
import Engineering from './pages/Engineering';
import Operations from './pages/Operations';
import Sales from './pages/Sales';
import AccessControl from './pages/AccessControl';
import Apply from './pages/Apply';
import Attendance from './pages/Attendance';
import Dashboard from './pages/Dashboard';
import EmployeeProfile from './pages/EmployeeProfile';
import Employees from './pages/Employees';
import Onboarding from './pages/Onboarding';
import Payroll from './pages/Payroll';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Recruitment from './pages/Recruitment';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Vacancies from './pages/Vacancies';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Accounting": Accounting,
    "Tasks": Tasks,
    "Engineering": Engineering,
    "Operations": Operations,
    "Sales": Sales,
    "AccessControl": AccessControl,
    "Apply": Apply,
    "Attendance": Attendance,
    "Dashboard": Dashboard,
    "EmployeeProfile": EmployeeProfile,
    "Employees": Employees,
    "Onboarding": Onboarding,
    "Payroll": Payroll,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "Recruitment": Recruitment,
    "Reports": Reports,
    "Settings": Settings,
    "Vacancies": Vacancies,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};