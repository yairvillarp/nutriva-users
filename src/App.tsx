import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Specializations } from './pages/Specializations';
import { Mediciones } from './pages/Mediciones';
import { Login } from './pages/Login';
import { Toaster } from "@/components/ui/sonner";
import { MisPacientes } from './components/dashboard/sections/Mis_pacientes/MisPacientes';
import { Usuarios } from './components/dashboard/sections/Usuarios/Usuarios';
import { ClinicalHistoryPage } from './components/dashboard/sections/Historia_clinica/ClinicalHistoryPage';
const AnthropometricsPage = lazy(() => import("./components/dashboard/sections/Anthropometrics/AnthropometricsPage")); // Changed to lazy import
const AnalyticDataPage = lazy(() => import("./components/dashboard/sections/AnalyticData/AnalyticDataPage")); // Added lazy import
import { Schedule } from './components/dashboard/sections/schedule/Schedule';
import { Appointment } from './components/dashboard/sections/appointment/Appointment';
import { ProfessionalAppointments } from './components/dashboard/sections/appointment/ProfessionalAppointments';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Locked Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mis-pacientes" element={
              <MainLayout>
                <MisPacientes />
              </MainLayout>
            } />
            <Route path="/usuarios" element={
              <MainLayout>
                <Usuarios />
              </MainLayout>
            } />
            <Route path="/mis-pacientes/:id/historia-clinica" element={
              <MainLayout>
                <ClinicalHistoryPage />
              </MainLayout>
            } />
            <Route path="/mis-pacientes/:id/antropometria" element={
              <MainLayout>
                <AnthropometricsPage />
              </MainLayout>
            } />
            <Route path="/mis-pacientes/:id/analitica" element={
              <MainLayout>
                <AnalyticDataPage />
              </MainLayout>
            } />
            <Route path="/users" element={
              <MainLayout>
                <Usuarios /> {/* Assuming 'Users' refers to the 'Usuarios' component */}
              </MainLayout>
            } />
            <Route path="/mediciones" element={
              <MainLayout>
                <Mediciones />
              </MainLayout>
            } />
            <Route path="/admin/schedules" element={
              <MainLayout>
                <Schedule />
              </MainLayout>
            } />
            <Route path="/admin/appointment" element={
              <MainLayout>
                <Appointment />
              </MainLayout>
            } />
            <Route path="/admin/appointment-profesional" element={
              <MainLayout>
                <ProfessionalAppointments />
              </MainLayout>
            } />
            <Route path="/" element={
              <MainLayout>
                <Specializations />
              </MainLayout>
            } />
          </Route>

          {/* Fallback to root if unknown route, or create a 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
