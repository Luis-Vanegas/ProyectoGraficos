// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PaginaPrincipal from './page/PaginaPrincipal';
import Dashboard from './page/Dashboard';
import ConsultarObra from './page/ConsultarObra';
import ProyectoDetalle from './page/ProyectoDetalle';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PaginaPrincipal />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/consultar-obra" element={<ConsultarObra />} />
        <Route path="/proyectos/:proyecto" element={<ProyectoDetalle />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
