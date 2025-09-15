// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { FullScreenLoader } from './components/LoadingSpinner';
import { ProductionDiagnostic } from './components/ProductionDiagnostic';

// Páginas principales (carga inmediata)
import PaginaPrincipal from './page/PaginaPrincipal';

// Lazy loading para dashboards (carga bajo demanda)
const Dashboard = lazy(() => import('./page/Dashboard'));
const ConsultarObra = lazy(() => import('./page/ConsultarObra'));

// Lazy loading para dashboards específicos por proyecto
const EscenariosDeportivosDashboard = lazy(() => import('./page/EscenariosDeportivosDashboard'));
const JardinesBuenComienzoDashboard = lazy(() => import('./page/JardinesBuenComienzoDashboard'));
const EscuelasInteligentesDashboard = lazy(() => import('./page/EscuelasInteligentesDashboard'));
const RecreosDashboard = lazy(() => import('./page/RecreosDashboard'));
const PrimaveraNorteDashboard = lazy(() => import('./page/PrimaveraNorteDashboard'));
const C5iDashboard = lazy(() => import('./page/C5iDashboard'));
const TacitaDePlataDashboard = lazy(() => import('./page/TacitaDePlataDashboard'));
const MetroLa80Dashboard = lazy(() => import('./page/MetroLa80Dashboard'));
const UnidadHospitalariaDashboard = lazy(() => import('./page/UnidadHospitalariaDashboard'));

export default function App() {
  return (
    <ErrorBoundary>
      <ProductionDiagnostic />
      <Router>
        <Suspense fallback={<FullScreenLoader text="Cargando dashboard..." />}>
          <Routes>
            {/* Página principal - carga inmediata */}
            <Route path="/" element={<PaginaPrincipal />} />
            
            {/* Dashboards principales - lazy loading */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/consultar-obra" element={<ConsultarObra />} />
            
            {/* Rutas para dashboards específicos por proyecto estratégico - lazy loading */}
            <Route path="/dashboard/escenarios-deportivos" element={<EscenariosDeportivosDashboard />} />
            <Route path="/dashboard/jardines-buen-comienzo" element={<JardinesBuenComienzoDashboard />} />
            <Route path="/dashboard/escuelas-inteligentes" element={<EscuelasInteligentesDashboard />} />
            <Route path="/dashboard/recreos" element={<RecreosDashboard />} />
            <Route path="/dashboard/primavera-norte" element={<PrimaveraNorteDashboard />} />
            <Route path="/dashboard/c5i" element={<C5iDashboard />} />
            <Route path="/dashboard/tacita-de-plata" element={<TacitaDePlataDashboard />} />
            <Route path="/dashboard/metro-la-80" element={<MetroLa80Dashboard />} />
            <Route path="/dashboard/unidad-hospitalaria" element={<UnidadHospitalariaDashboard />} />
            
            {/* Ruta 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
