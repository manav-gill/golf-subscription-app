import { useNavigate } from 'react-router-dom';

import { login as loginRequest, signup as signupRequest } from '../services/authService';

function extractToken(response) {
  return response?.data?.data?.token || response?.data?.token || null;
}

export default function useAuth() {
  const navigate = useNavigate();

  const login = async (email, password) => {
    const response = await loginRequest({ email, password });
    const token = extractToken(response);

    if (!token) {
      throw new Error('Token not found in login response');
    }

    localStorage.setItem('token', token);
    navigate('/dashboard');

    return response;
  };

  const signup = async (name, email, password) => {
    const response = await signupRequest({ name, email, password });
    navigate('/login');
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return {
    login,
    signup,
    logout
  };
}
