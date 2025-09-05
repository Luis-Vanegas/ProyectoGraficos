// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PaginaPrincipal from './page/PaginaPrincipal';
import Dashboard from './page/Dashboard';
import ConsultarObra from './page/ConsultarObra';

// Importación de todos los nuevos dashboards específicos por proyecto
import EscenariosDeportivosDashboard from './page/EscenariosDeportivosDashboard';
import JardinesBuenComienzoDashboard from './page/JardinesBuenComienzoDashboard';
import EscuelasInteligentesDashboard from './page/EscuelasInteligentesDashboard';
import RecreosDashboard from './page/RecreosDashboard';
import PrimaveraNorteDashboard from './page/PrimaveraNorteDashboard';
import C5iDashboard from './page/C5iDashboard';
import TacitaDePlataDashboard from './page/TacitaDePlataDashboard';
import MetroLa80Dashboard from './page/MetroLa80Dashboard';
import UnidadHospitalariaDashboard from './page/UnidadHospitalariaDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PaginaPrincipal />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/consultar-obra" element={<ConsultarObra />} />
        
        {/* Rutas para dashboards específicos por proyecto estratégico */}
        <Route path="/dashboard/escenarios-deportivos" element={<EscenariosDeportivosDashboard />} />
        <Route path="/dashboard/jardines-buen-comienzo" element={<JardinesBuenComienzoDashboard />} />
        <Route path="/dashboard/escuelas-inteligentes" element={<EscuelasInteligentesDashboard />} />
        <Route path="/dashboard/recreos" element={<RecreosDashboard />} />
        <Route path="/dashboard/primavera-norte" element={<PrimaveraNorteDashboard />} />
        <Route path="/dashboard/c5i" element={<C5iDashboard />} />
        <Route path="/dashboard/tacita-de-plata" element={<TacitaDePlataDashboard />} />
        <Route path="/dashboard/metro-la-80" element={<MetroLa80Dashboard />} />
        <Route path="/dashboard/unidad-hospitalaria" element={<UnidadHospitalariaDashboard />} />
        
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
