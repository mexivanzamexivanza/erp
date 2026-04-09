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
import Login from "./pages/Login";
import RequireAuth from "./auth/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<Sales />} />
        <Route path="stock-movements" element={<StockMovements />} />
      
        <Route path="vendors" element={<Vendors />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="receiving" element={<Receiving />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="ar-aging" element={<ARAging />} />
        <Route path="bills" element={<Bills />} />
        <Route path="ap-aging" element={<APAging />} />
      </Route>

      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}








