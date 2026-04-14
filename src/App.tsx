import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import StockMovements from "./pages/StockMovements";
import Vendors from "./pages/Vendors";
import PurchaseOrders from "./pages/PurchaseOrders";
import Receiving from "./pages/Receiving";
import Invoices from "./pages/Invoices";
import AuditLog from "./pages/AuditLog";
import ARAging from "./pages/ARAging";
import Bills from "./pages/Bills";
import APAging from "./pages/APAging";
import DemoGateway from "./pages/DemoGateway";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import Payroll from "./pages/Payroll";
import GeneralLedger from "./pages/GeneralLedger";
import FinancialReports from "./pages/FinancialReports";
import CRM from "./pages/CRM";
import Manufacturing from "./pages/Manufacturing";
import Projects from "./pages/Projects";
import Logistics from "./pages/Logistics";
import Calendar from "./pages/Calendar";
import UserRoles from "./pages/UserRoles";
import CurrencyAndTemplates from "./pages/CurrencyAndTemplates";
import Messages from "./pages/Messages";
import RequireAuth from "./auth/RequireAuth";
import Pricing from "./pages/Pricing";
import Home from "./pages/Home";
import IndustryPage from "./pages/IndustryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<DemoGateway />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/industria/:slug" element={<IndustryPage />} />
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard"         element={<Dashboard />} />
        <Route path="calendar"          element={<Calendar />} />
        <Route path="messages"          element={<Messages />} />
        <Route path="customers"         element={<Customers />} />
        <Route path="inventory"         element={<Inventory />} />
        <Route path="sales"             element={<Sales />} />
        <Route path="stock-movements"   element={<StockMovements />} />
        <Route path="vendors"           element={<Vendors />} />
        <Route path="purchase-orders"   element={<PurchaseOrders />} />
        <Route path="receiving"         element={<Receiving />} />
        <Route path="invoices"          element={<Invoices />} />
        <Route path="audit-log"         element={<AuditLog />} />
        <Route path="ar-aging"          element={<ARAging />} />
        <Route path="bills"             element={<Bills />} />
        <Route path="ap-aging"          element={<APAging />} />
        <Route path="employees"         element={<Employees />} />
        <Route path="settings"          element={<Settings />} />
        <Route path="payroll"           element={<Payroll />} />
        <Route path="general-ledger"    element={<GeneralLedger />} />
        <Route path="financial-reports" element={<FinancialReports />} />
        <Route path="crm"               element={<CRM />} />
        <Route path="manufacturing"     element={<Manufacturing />} />
        <Route path="projects"          element={<Projects />} />
        <Route path="logistics"         element={<Logistics />} />
        <Route path="user-roles"        element={<RequireAuth requiredRole="admin"><UserRoles /></RequireAuth>} />
        <Route path="currency"          element={<CurrencyAndTemplates />} />
        <Route path="*"                 element={<Navigate to="/app/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
