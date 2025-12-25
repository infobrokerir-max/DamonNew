import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import ProjectCreate from './pages/ProjectCreate';
import AdminSettings from './pages/admin/Settings';
import AdminUsers from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminDevices from './pages/admin/Devices';
import AdminPendingInquiries from './pages/admin/PendingInquiries';
import MapOverview from './pages/MapOverview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/new" element={<ProjectCreate />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="map" element={<MapOverview />} />
          
          <Route path="admin/settings" element={<AdminSettings />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/categories" element={<AdminCategories />} />
          <Route path="admin/devices" element={<AdminDevices />} />
          <Route path="admin/inquiries" element={<AdminPendingInquiries />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
