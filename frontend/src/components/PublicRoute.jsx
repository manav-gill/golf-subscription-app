import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { isAuthenticated } from '../utils/auth';

function PublicRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setChecking(false);
  }, []);

  if (checking) {
    return <p className="p-6 text-center text-secondary">Loading...</p>;
  }

  if (authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;
