import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { login as loginRequest } from './services/authService';

function App() {
  const handleTestLoginApi = async () => {
    console.log('TEST LOGIN CALL STARTED');

    try {
      const response = await loginRequest({
        email: 'debug@example.com',
        password: 'debug-password'
      });

      console.log('TEST LOGIN RESPONSE:', response?.data);
    } catch (error) {
      console.error('TEST LOGIN ERROR RESPONSE:', error?.response);
      console.error('TEST LOGIN ERROR MESSAGE:', error?.message);
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {import.meta.env.DEV ? (
        <button
          type="button"
          onClick={handleTestLoginApi}
          className="fixed bottom-4 right-4 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary shadow-soft"
        >
          Test Login API
        </button>
      ) : null}
    </>
  );
}

export default App;
