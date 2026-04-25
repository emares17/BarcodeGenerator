import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import LabelUploader from './components/labelUploader';
import Sidebar from './components/Sidebar';
import Dashboard from './components/dashboard';
import ProtectedRoute from './config/ProtectedRoute';
import Help from './components/help';
import SignUp from './components/signup';
import LandingPage from './pages/LandingPage';
import Inventory from './components/Inventory';

function UploadPage() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <LabelUploader />
      </main>
    </div>
  );
}

function InventoryPage() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Inventory />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="/help" element={<Help />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;