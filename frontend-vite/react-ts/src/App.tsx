import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import LabelUploader from './components/labelUploader';
import Dashboard from './components/dashboard'; 
import ProtectedRoute from './config/ProtectedRoute';
import Help from './components/help'; 
import SignUp from './components/signup';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
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
              <LabelUploader />
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