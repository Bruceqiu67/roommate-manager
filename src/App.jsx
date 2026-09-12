import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from './lib/store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Household from './pages/Household';
import Expenses from './pages/Expenses';
import Cleaning from './pages/Cleaning';
import Items from './pages/Items';
import Agreements from './pages/Agreements';

function ProtectedRoute({ children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.householdId) return <Navigate to="/household" replace />;
  return children;
}

function AuthRoute({ children }) {
  const user = getCurrentUser();
  if (user && user.householdId) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/household" element={
          getCurrentUser() ? <Household /> : <Navigate to="/login" replace />
        } />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="cleaning" element={<Cleaning />} />
          <Route path="items" element={<Items />} />
          <Route path="agreements" element={<Agreements />} />
        </Route>
      </Routes>
    </Router>
  );
}
