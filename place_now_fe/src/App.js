import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import HomeAdmin from "./pages/HomeAdmin";
import HomeSeller from "./pages/HomeSeller";
import HomeBuyer from "./pages/HomeBuyer";

import Nav from "./components/Nav";
import Footer from "./components/Footer";

import SellerProperties from "./pages/seller/SellerProperties";
import SellerReservations from "./pages/seller/SellerReservations";
import SellerMaintenance from "./pages/seller/SellerMaintenance";
import SellerInvoices from "./pages/seller/SellerInvoices";

import BuyerBrowse from "./pages/buyer/BuyerBrowse";
import BuyerReservations from "./pages/buyer/BuyerReservations";
import BuyerInvoices from "./pages/buyer/BuyerInvoices";
import BuyerMaintenance from "./pages/buyer/BuyerMaintenance";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminMetrics from "./pages/admin/AdminMetrics";
import AdminReports from "./pages/admin/AdminReports";

export default function App() {
  return (
    <BrowserRouter>
      <Nav />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin/home" element={<HomeAdmin />} />
        <Route path="/seller/home" element={<HomeSeller />} />
        <Route path="/buyer/home" element={<HomeBuyer />} />

        <Route path="/seller/properties" element={<SellerProperties />} />
        <Route path="/seller/reservations" element={<SellerReservations />} />
        <Route path="/seller/maintenance" element={<SellerMaintenance />} />
        <Route path="/seller/invoices" element={<SellerInvoices />} />

        <Route path="/buyer/properties" element={<BuyerBrowse />} />
        <Route path="/buyer/reservations" element={<BuyerReservations />} />
        <Route path="/buyer/invoices" element={<BuyerInvoices />} />
        <Route path="/buyer/maintenance" element={<BuyerMaintenance />} />

        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/metrics" element={<AdminMetrics />} />
        <Route path="/admin/reports" element={<AdminReports />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
