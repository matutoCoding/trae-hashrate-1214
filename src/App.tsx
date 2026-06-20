import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import BatchListPage from '@/pages/BatchListPage';
import WarehouseInPage from '@/pages/WarehouseInPage';
import OutboundPage from '@/pages/OutboundPage';
import WarningPage from '@/pages/WarningPage';
import TicketPage from '@/pages/TicketPage';
import DisplayPage from '@/pages/DisplayPage';
import QueueManagePage from '@/pages/QueueManagePage';
import PackagePage from '@/pages/PackagePage';
import BillPage from '@/pages/BillPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/battery/batches" element={<BatchListPage />} />
          <Route path="/battery/warehouse" element={<WarehouseInPage />} />
          <Route path="/expiry/outbound" element={<OutboundPage />} />
          <Route path="/expiry/warning" element={<WarningPage />} />
          <Route path="/queue/ticket" element={<TicketPage />} />
          <Route path="/queue/display" element={<DisplayPage />} />
          <Route path="/queue/manage" element={<QueueManagePage />} />
          <Route path="/pricing/packages" element={<PackagePage />} />
          <Route path="/pricing/bills" element={<BillPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
